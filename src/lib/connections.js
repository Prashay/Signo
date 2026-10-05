import { emptyRoot } from './mqttTree.js'

export function newId() {
  return `conn-${Math.random().toString(16).slice(2, 10)}`
}

export function makeConnection(opts = {}) {
  return {
    id: opts.id || newId(),
    name: opts.name || 'New connection',
    protocol: opts.protocol || 'mqtt',
    host: opts.host || 'broker.emqx.io',
    port: opts.port || 1883,
    path: opts.path || '',
    clientId: opts.clientId || '',
    username: opts.username || '',
    password: opts.password || '',
    keepalive: opts.keepalive || 60,
    clean: opts.clean !== false,
    protocolVersion: opts.protocolVersion || 4,
    tls: opts.tls !== undefined ? Boolean(opts.tls) : (opts.protocol === 'mqtts' || opts.protocol === 'wss'),
    validateCertificate: opts.validateCertificate !== false && opts.rejectUnauthorized !== false,
    rejectUnauthorized: opts.validateCertificate !== false && opts.rejectUnauthorized !== false,
    caCert: opts.caCert || '',
    clientCert: opts.clientCert || '',
    clientKey: opts.clientKey || '',
    keyPassphrase: opts.keyPassphrase || '',
    subscriptions: opts.subscriptions || [{ topic: '#', qos: 0 }],
    status: 'disconnected',
    error: '',
    tree: emptyRoot(),
    subs: [],
    events: [],
    loadRunning: false,
    selectedPath: '',
    selectedNode: null,
    paused: false
  }
}

export function persistList(list) {
  const safe = list.map((c) => ({
    id: c.id,
    name: c.name,
    protocol: c.protocol,
    host: c.host,
    port: c.port,
    path: c.path,
    clientId: c.clientId,
    username: c.username,
    keepalive: c.keepalive,
    clean: c.clean,
    protocolVersion: c.protocolVersion,
    tls: c.tls,
    validateCertificate: c.validateCertificate,
    rejectUnauthorized: c.rejectUnauthorized,
    caCert: c.caCert,
    clientCert: c.clientCert,
    clientKey: c.clientKey,
    keyPassphrase: c.keyPassphrase,
    subscriptions: c.subscriptions
  }))
  localStorage.setItem('mqtt-studio-connections', JSON.stringify(safe))
}

export function loadList() {
  try {
    const raw = localStorage.getItem('mqtt-studio-connections')
    if (!raw) {
      return [
        makeConnection({
          name: 'EMQX Public (WebSockets)',
          protocol: 'wss',
          host: 'broker.emqx.io',
          port: 8084,
          path: '/mqtt',
          subscriptions: [{ topic: 'testtopic/#', qos: 0 }]
        })
      ]
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) {
      return [
        makeConnection({
          name: 'EMQX Public (WebSockets)',
          protocol: 'wss',
          host: 'broker.emqx.io',
          port: 8084,
          path: '/mqtt',
          subscriptions: [{ topic: 'testtopic/#', qos: 0 }]
        })
      ]
    }
    return parsed.map((c) => makeConnection(c))
  } catch {
    return []
  }
}

export function patchConn(list, id, patch) {
  return list.map((c) => (c.id === id ? { ...c, ...patch } : c))
}

export function pushConnEvent(list, id, text) {
  return list.map((c) => {
    if (c.id !== id) return c
    return { ...c, events: [{ text, at: Date.now() }, ...c.events].slice(0, 50) }
  })
}
