import mqtt from 'mqtt'

// Active in-browser MQTT client instances and simulator timers
const browserSessions = new Map()
const browserLoaders = new Map()

export function decodeBrowserPayload(buf) {
  if (!buf) return { size: 0, hex: '', text: '' }
  try {
    let uint8
    if (typeof buf === 'string') {
      uint8 = new TextEncoder().encode(buf)
    } else if (buf instanceof Uint8Array) {
      uint8 = buf
    } else if (buf.buffer instanceof ArrayBuffer) {
      uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    } else {
      uint8 = new Uint8Array(buf)
    }

    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8)
    let hex = ''
    const maxHex = Math.min(uint8.length, 4096)
    for (let i = 0; i < maxHex; i++) {
      hex += uint8[i].toString(16).padStart(2, '0')
    }

    return {
      size: uint8.length,
      hex,
      text: text.slice(0, 65536)
    }
  } catch (err) {
    return {
      size: 0,
      hex: '',
      text: String(buf)
    }
  }
}

export function buildBrowserMqttUrl(options) {
  let protocol = options.protocol || 'wss'
  let host = (options.host || 'broker.emqx.io').trim()
  let port = Number(options.port)
  let path = (options.path || '').trim()

  // In-browser connections cannot dial raw TCP (1883/8883)
  // Smart-map known public brokers to their official WebSocket endpoints
  if (protocol === 'mqtt' || protocol === 'mqtts' || port === 1883 || port === 8883) {
    if (host.includes('emqx.io')) {
      protocol = 'wss'
      port = 8084
      path = path || '/mqtt'
    } else if (host.includes('mosquitto.org')) {
      protocol = 'wss'
      port = 8081
    } else if (host.includes('hivemq.com')) {
      protocol = 'wss'
      port = 8884
      path = path || '/mqtt'
    } else {
      // For local or generic brokers, use wss if on https, or ws if on http
      protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
      if (!port || port === 1883 || port === 8883) {
        port = protocol === 'wss' ? 8084 : 8083
      }
    }
  }

  if (protocol === 'ws' || protocol === 'wss') {
    if (!path && host.includes('emqx.io')) path = '/mqtt'
    if (!path && host.includes('hivemq.com')) path = '/mqtt'
  }

  if (path && !path.startsWith('/')) path = `/${path}`
  return `${protocol}://${host}:${port}${path}`
}

export function connectBrowserMqtt(id, options, handlers) {
  disconnectBrowserMqtt(id)

  const url = buildBrowserMqttUrl(options)
  handlers.onStatus({
    id,
    status: 'connecting',
    url,
    note: `Connecting directly via browser WebSockets: ${url}`
  })

  try {
    const client = mqtt.connect(url, {
      clientId: options.clientId || `signo-web-${Math.random().toString(16).slice(2, 8)}`,
      username: options.username || undefined,
      password: options.password || undefined,
      keepalive: Number(options.keepalive || 60),
      clean: options.clean !== false,
      reconnectPeriod: 5000,
      connectTimeout: 12000
    })

    browserSessions.set(id, client)

    client.on('connect', () => {
      handlers.onStatus({ id, status: 'connected', url })
      const subs = Array.isArray(options.subscriptions) ? options.subscriptions : [{ topic: '#', qos: 0 }]
      for (const sub of subs) {
        if (!sub?.topic) continue
        client.subscribe(sub.topic, { qos: Number(sub.qos || 0) }, (err) => {
          handlers.onSubscribed({
            id,
            topic: sub.topic,
            qos: Number(sub.qos || 0),
            error: err ? err.message : null
          })
        })
      }
    })

    client.on('reconnect', () => {
      handlers.onStatus({ id, status: 'connecting', url })
    })

    client.on('close', () => {
      handlers.onStatus({ id, status: 'disconnected', url })
    })

    client.on('offline', () => {
      handlers.onStatus({ id, status: 'disconnected', url })
    })

    client.on('error', (err) => {
      handlers.onStatus({
        id,
        status: 'error',
        error: err.message || 'Connection failed',
        url
      })
    })

    client.on('message', (topic, payload, packet) => {
      const decoded = decodeBrowserPayload(payload)
      handlers.onMessage({
        id,
        topic,
        payload: decoded,
        qos: packet.qos || 0,
        retain: Boolean(packet.retain),
        dup: Boolean(packet.dup),
        timestamp: Date.now()
      })
    })

    return client
  } catch (err) {
    handlers.onStatus({
      id,
      status: 'error',
      error: err.message || 'Browser WebSocket connection failed',
      url
    })
    return null
  }
}

export function disconnectBrowserMqtt(id) {
  stopBrowserLoad(id)
  const client = browserSessions.get(id)
  if (client) {
    try {
      client.end(true)
    } catch {}
    browserSessions.delete(id)
  }
}

export function subscribeBrowserMqtt(id, topic, qos = 0, callback) {
  const client = browserSessions.get(id)
  if (!client) return
  client.subscribe(topic, { qos: Number(qos) }, (err) => {
    if (callback) callback(err ? err.message : null)
  })
}

export function unsubscribeBrowserMqtt(id, topic, callback) {
  const client = browserSessions.get(id)
  if (!client) return
  client.unsubscribe(topic, (err) => {
    if (callback) callback(err ? err.message : null)
  })
}

export function publishBrowserMqtt(id, topic, payload, options = {}, callback) {
  const client = browserSessions.get(id)
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const qos = Number(options.qos || 0)
  const retain = Boolean(options.retain)

  if (client && client.connected) {
    client.publish(topic, body, { qos, retain }, (err) => {
      if (callback) callback(err ? err.message : null)
    })
  } else {
    // If not connected, report back so UI can display locally
    if (callback) callback('Broker not connected (message shown locally)')
  }
}

export function startBrowserLoad(id, cfg, handlers) {
  stopBrowserLoad(id)

  const rate = Math.max(1, Math.min(Number(cfg.rate || 10), 100))
  const topics = cfg.topics && cfg.topics.length ? cfg.topics : ['store/6339/sales', 'store/6339/checkout']
  const store = cfg.store || '6339'
  const intervalMs = Math.max(25, Math.floor(1000 / rate))

  let seq = 1
  const timer = setInterval(() => {
    const topic = topics[Math.floor(Math.random() * topics.length)]
    const mockData = {
      store,
      seq,
      timestamp: Date.now(),
      lane: Math.floor(Math.random() * 8) + 1,
      total: (Math.random() * 85 + 5).toFixed(2),
      items: Math.floor(Math.random() * 6) + 1
    }
    const body = JSON.stringify(mockData)

    handlers.onMessage({
      id,
      topic,
      payload: decodeBrowserPayload(body),
      qos: 0,
      retain: false,
      dup: false,
      timestamp: Date.now()
    })

    const client = browserSessions.get(id)
    if (client && client.connected) {
      try {
        client.publish(topic, body, { qos: 0 })
      } catch {}
    }
    seq++
  }, intervalMs)

  browserLoaders.set(id, timer)
  handlers.onLoadStatus({ id, running: true, rate, topics, store })
}

export function stopBrowserLoad(id) {
  const timer = browserLoaders.get(id)
  if (timer) {
    clearInterval(timer)
    browserLoaders.delete(id)
  }
}
