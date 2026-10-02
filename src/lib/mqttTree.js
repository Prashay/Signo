export function emptyRoot() {
  return { name: 'root', path: '', children: {}, messages: [], latest: null, count: 0 }
}

export function upsertTopic(root, topic, message) {
  const parts = topic.split('/').filter((part, index) => part !== '' || index === 0)
  const segments = parts.length ? parts : [topic]
  let node = root
  let path = ''

  for (const segment of segments) {
    path = path ? `${path}/${segment}` : segment
    if (!node.children[segment]) {
      node.children[segment] = {
        name: segment,
        path,
        children: {},
        messages: [],
        latest: null,
        count: 0
      }
    }
    node = node.children[segment]
  }

  node.latest = message
  node.count += 1
  node.messages = [message, ...node.messages].slice(0, 40)
  root.count += 1
  return root
}

export function upsertMany(root, messages) {
  const base = root && root.children ? root : emptyRoot()
  const next = structuredClone(base)
  const slice = messages.length > 200 ? messages.slice(-200) : messages
  for (const message of slice) {
    if (message?.topic) upsertTopic(next, message.topic, message)
  }
  return next
}

export function collectLeaves(node, acc = []) {
  const kids = Object.values(node.children || {})
  if (node.path && node.latest) acc.push(node)
  for (const child of kids) collectLeaves(child, acc)
  return acc
}

export function filterTree(node, query) {
  if (!query) return node
  const q = query.toLowerCase()
  const next = { ...node, children: {} }
  let keep = (node.path || '').toLowerCase().includes(q) || node.name.toLowerCase().includes(q)

  for (const [key, child] of Object.entries(node.children || {})) {
    const filtered = filterTree(child, query)
    if (filtered) {
      next.children[key] = filtered
      keep = true
    }
  }

  return keep ? next : null
}

export function tryPretty(text) {
  if (!text) return { kind: 'empty', value: '' }
  try {
    const parsed = JSON.parse(text)
    return { kind: 'json', value: JSON.stringify(parsed, null, 2), parsed }
  } catch {
    return { kind: 'text', value: text }
  }
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const PRESETS = [
  {
    name: 'EMQX Cloud (WSS Direct)',
    protocol: 'wss',
    host: 'broker.emqx.io',
    port: 8084,
    path: '/mqtt',
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  },
  {
    name: 'HiveMQ Web (WSS Direct)',
    protocol: 'wss',
    host: 'broker.hivemq.com',
    port: 8884,
    path: '/mqtt',
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  },
  {
    name: 'Mosquitto Test (WSS Direct)',
    protocol: 'wss',
    host: 'test.mosquitto.org',
    port: 8081,
    path: '',
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  },
  {
    name: 'EMQX TCP (Port 1883 - Proxy)',
    protocol: 'mqtt',
    host: 'broker.emqx.io',
    port: 1883,
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  },
  {
    name: 'Local Docker (TCP 1883)',
    protocol: 'mqtt',
    host: '127.0.0.1',
    port: 1883,
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  },
  {
    name: 'Local Docker (WS 9001)',
    protocol: 'ws',
    host: '127.0.0.1',
    port: 9001,
    clientId: '',
    username: '',
    password: '',
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
    subscriptions: [{ topic: '#', qos: 0 }]
  }
]
