import http from 'node:http'
import { Buffer } from 'node:buffer'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import mqtt from 'mqtt'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')

const PORT = Number(process.env.PORT || 3900)
const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'signo-backend' })
})

function probeTcp(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const socket = new net.Socket()
    let settled = false

    const done = (online, error = null) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve({
        online,
        latency: online ? Math.max(1, Date.now() - startTime) : null,
        error: error ? error.message : null,
        host,
        port
      })
    }

    socket.setTimeout(timeout)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false, new Error('Connection timed out')))
    socket.once('error', (err) => done(false, err))

    try {
      socket.connect(Number(port), String(host))
    } catch (err) {
      done(false, err)
    }
  })
}

app.get('/api/kafka/probe', async (req, res) => {
  const host = String(req.query.host || 'localhost')
  const port = Number(req.query.port || 8080)
  const result = await probeTcp(host, port)
  res.json(result)
})

app.post('/api/kafka/validate', async (req, res) => {
  const { servers } = req.body || {}
  const targetServers = servers && servers.length > 0 ? servers : [{ host: 'localhost', port: '8080' }]
  const results = await Promise.all(
    targetServers.map((s) => probeTcp(s.host || 'localhost', s.port || 8080))
  )
  const allOnline = results.every((r) => r.online)
  res.json({
    ok: allOnline,
    results,
    message: allOnline
      ? 'All bootstrap brokers reached successfully'
      : 'One or more brokers unreachable (is Docker or Kafka running?)'
  })
})

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next()
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'))
  }
  next()
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

function decodePayload(buf) {
  const size = buf.length
  const hex = buf.toString('hex')
  const utf8 = buf.toString('utf8')
  const validUtf8 = Buffer.from(utf8, 'utf8').equals(buf)
  return {
    size,
    hex: hex.slice(0, 8192),
    text: validUtf8 ? utf8.slice(0, 65536) : null
  }
}

function buildUrl(options) {
  const protocol = options.protocol || 'mqtt'
  const host = options.host
  const port = options.port
  const path = options.path || (protocol === 'ws' || protocol === 'wss' ? '/mqtt' : '')
  return `${protocol}://${host}:${port}${path}`
}

wss.on('connection', (socket) => {
  const sessions = new Map()
  const loaders = new Map()

  const send = (payload) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(payload))
    }
  }

  const stopLoad = (id) => {
    const timer = loaders.get(id)
    if (timer) {
      clearInterval(timer)
      loaders.delete(id)
    }
  }

  const dropSession = (id) => {
    stopLoad(id)
    const client = sessions.get(id)
    if (!client) return
    sessions.delete(id)
    try {
      client.end(true)
    } catch {
      client.removeAllListeners()
    }
  }

  socket.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      send({ type: 'error', message: 'Invalid JSON frame' })
      return
    }

    const { type, id } = msg

    if (type === 'connect') {
      if (!id || !msg.options?.host) {
        send({ type: 'status', id, status: 'error', error: 'Host is required' })
        return
      }
      dropSession(id)
      const options = msg.options
      const url = buildUrl(options)
      send({ type: 'status', id, status: 'connecting', url })

      const client = mqtt.connect(url, {
        clientId: options.clientId || `mqtt-studio-${Math.random().toString(16).slice(2, 10)}`,
        username: options.username || undefined,
        password: options.password || undefined,
        keepalive: Number(options.keepalive || 60),
        clean: options.clean !== false,
        reconnectPeriod: 0,
        connectTimeout: 12000,
        rejectUnauthorized: options.rejectUnauthorized !== false && options.validateCertificate !== false,
        protocolVersion: Number(options.protocolVersion || 4),
        ca: options.caCert ? options.caCert : undefined,
        cert: options.clientCert ? options.clientCert : undefined,
        key: options.clientKey ? options.clientKey : undefined,
        passphrase: options.keyPassphrase || undefined
      })

      sessions.set(id, client)

      client.on('connect', () => {
        send({ type: 'status', id, status: 'connected', url })
        const subs = Array.isArray(options.subscriptions) ? options.subscriptions : [{ topic: '#', qos: 0 }]
        for (const sub of subs) {
          if (!sub?.topic) continue
          client.subscribe(sub.topic, { qos: Number(sub.qos || 0) }, (err) => {
            send({
              type: 'subscribed',
              id,
              topic: sub.topic,
              qos: Number(sub.qos || 0),
              error: err ? err.message : null
            })
          })
        }
      })

      client.on('reconnect', () => send({ type: 'status', id, status: 'connecting' }))
      client.on('close', () => send({ type: 'status', id, status: 'disconnected' }))
      client.on('offline', () => send({ type: 'status', id, status: 'disconnected' }))
      client.on('error', (err) => {
        send({ type: 'status', id, status: 'error', error: err.message })
      })

      client.on('message', (topic, payload, packet) => {
        const decoded = decodePayload(Buffer.isBuffer(payload) ? payload : Buffer.from(payload))
        send({
          type: 'message',
          id,
          topic,
          payload: decoded,
          qos: packet.qos,
          retain: Boolean(packet.retain),
          dup: Boolean(packet.dup),
          timestamp: Date.now()
        })
      })
      return
    }

    if (type === 'loadtest') {
      stopLoad(id)
      if (msg.action === 'stop') {
        send({ type: 'loadtest', id, running: false })
        return
      }
      const topics = Array.isArray(msg.topics) ? msg.topics.filter(Boolean) : []
      if (!topics.length) {
        send({ type: 'loadtest', id, running: false, error: 'No topics' })
        return
      }
      const client = sessions.get(id)
      const rate = Math.min(500, Math.max(1, Number(msg.rate || 100)))
      const tickMs = 10
      const perTick = Math.max(1, Math.round((rate * tickMs) / 1000))
      const actualRate = perTick * (1000 / tickMs)
      let seq = 0
      const store = String(msg.store || '6339')
      const publishToBroker = Boolean(msg.publishToBroker) && client?.connected
      const timer = setInterval(() => {
        const now = Date.now()
        for (let i = 0; i < perTick; i++) {
          const topic = topics[seq % topics.length]
          const body = JSON.stringify({
            store,
            topic,
            seq,
            ts: now,
            value: Math.round(Math.random() * 10000) / 100,
            aisle: (seq % 12) + 1
          })
          send({
            type: 'message',
            id,
            topic,
            payload: decodePayload(Buffer.from(body)),
            qos: 0,
            retain: false,
            dup: false,
            timestamp: now
          })
          if (publishToBroker) client.publish(topic, body, { qos: 0 })
          seq += 1
        }
      }, tickMs)
      loaders.set(id, timer)
      send({ type: 'loadtest', id, running: true, rate: actualRate, topics, store })
      return
    }

    const client = sessions.get(id)
    if (!client) {
      send({ type: 'error', id, message: 'No active MQTT session' })
      return
    }

    if (type === 'disconnect') {
      dropSession(id)
      send({ type: 'status', id, status: 'disconnected' })
      return
    }

    if (type === 'subscribe') {
      client.subscribe(msg.topic, { qos: Number(msg.qos || 0) }, (err) => {
        send({
          type: 'subscribed',
          id,
          topic: msg.topic,
          qos: Number(msg.qos || 0),
          error: err ? err.message : null
        })
      })
      return
    }

    if (type === 'unsubscribe') {
      client.unsubscribe(msg.topic, (err) => {
        send({
          type: 'unsubscribed',
          id,
          topic: msg.topic,
          error: err ? err.message : null
        })
      })
      return
    }

    if (type === 'publish') {
      const payload = msg.payload ?? ''
      const qos = Number(msg.qos || 0)
      const retain = Boolean(msg.retain)
      const buf = Buffer.from(String(payload))
      send({
        type: 'message',
        id,
        topic: msg.topic,
        payload: decodePayload(buf),
        qos,
        retain,
        dup: false,
        timestamp: Date.now(),
        local: true
      })
      if (!client.connected) {
        send({ type: 'published', id, topic: msg.topic, error: 'Broker not connected, shown locally' })
        return
      }
      if (msg.topic) {
        client.subscribe(msg.topic, { qos }, () => {})
      }
      client.publish(msg.topic, payload, { qos, retain }, (err) => {
        send({
          type: 'published',
          id,
          topic: msg.topic,
          error: err ? err.message : null
        })
      })
      return
    }

  })

  socket.on('close', () => {
    for (const id of sessions.keys()) dropSession(id)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MQTT Studio bridge listening on ${PORT}`)
})
