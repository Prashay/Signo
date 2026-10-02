import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Cable,
  CheckCircle2,
  Clock,
  Eraser,
  Layers,
  Pause,
  Play,
  Plus,
  Plug,
  Radio,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react'
import TopicTree from '../TopicTree.jsx'
import PayloadView from '../PayloadView.jsx'
import PublishPanel from '../PublishPanel.jsx'
import ConnectModal from '../ConnectModal.jsx'
import SubscribeBar from '../SubscribeBar.jsx'
import LoadTest from '../LoadTest.jsx'
import ConnectionList from '../ConnectionList.jsx'
import BridgeStatusModal from './BridgeStatusModal.jsx'
import { emptyRoot, filterTree, upsertMany } from '../../lib/mqttTree.js'
import { loadList, makeConnection, persistList, patchConn, pushConnEvent } from '../../lib/connections.js'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

const DEMO_TOPICS = ['sales', 'inventory', 'checkout', 'pos/1', 'pos/2', 'alerts'].map(
  (name) => `store/6339/${name}`
)

function countTreeTopics(node) {
  if (!node) return 0
  let count = (node.messages && node.messages.length > 0) ? 1 : 0
  if (node.children) {
    for (const child of Object.values(node.children)) {
      count += countTreeTopics(child)
    }
  }
  return count
}

export default function MqttStudioApp({ onRateChange }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const wsRef = useRef(null)
  const pausedRef = useRef({})
  const pendingRef = useRef({})
  const localLoadRef = useRef({})
  const countsRef = useRef({})

  const [bridge, setBridge] = useState('idle')
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false)
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem('signo_bridge_url') || '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [connections, setConnections] = useState(() => loadList())
  const [activeId, setActiveId] = useState(() => loadList()[0]?.id || '')
  const [filter, setFilter] = useState('')
  const [rate, setRate] = useState(0)
  const [activeStudioTab, setActiveStudioTab] = useState('publish') // 'publish' | 'load' | 'events'

  const active = connections.find((c) => c.id === activeId) || connections[0] || null

  const send = useCallback((payload) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
  }, [])

  const update = useCallback((id, patch) => {
    setConnections((prev) => patchConn(prev, id, patch))
  }, [])

  const note = useCallback((id, text) => {
    setConnections((prev) => pushConnEvent(prev, id, text))
  }, [])

  const ingest = useCallback((id, frame) => {
    if (pausedRef.current[id]) return
    countsRef.current[id] = (countsRef.current[id] || 0) + 1
    if (!pendingRef.current[id]) pendingRef.current[id] = []
    pendingRef.current[id].push(frame)
    if (pendingRef.current[id].length > 400) pendingRef.current[id].splice(0, pendingRef.current[id].length - 400)
  }, [])

  const stopLocalLoad = useCallback((id) => {
    if (localLoadRef.current[id]) {
      clearInterval(localLoadRef.current[id])
      delete localLoadRef.current[id]
    }
    update(id, { loadRunning: false })
  }, [update])

  const startLocalLoad = useCallback((id, store, rateValue, topics) => {
    stopLocalLoad(id)
    const tickMs = 50
    const perTick = Math.max(1, Math.round((rateValue * tickMs) / 1000))
    let seq = 0
    localLoadRef.current[id] = setInterval(() => {
      const now = Date.now()
      for (let i = 0; i < perTick; i++) {
        const topic = topics[seq % topics.length]
        const text = JSON.stringify({
          store,
          topic,
          seq,
          ts: now,
          value: Math.round(Math.random() * 10000) / 100,
          aisle: (seq % 12) + 1
        })
        ingest(id, {
          type: 'message',
          id,
          topic,
          payload: { size: text.length, hex: '', text },
          qos: 0,
          retain: false,
          dup: false,
          timestamp: now
        })
        seq += 1
      }
    }, tickMs)
    update(id, { loadRunning: true })
  }, [ingest, stopLocalLoad, update])

  useEffect(() => {
    persistList(connections)
  }, [connections])

  useEffect(() => {
    let reconnect
    const connectBridge = (overrideUrl) => {
      clearTimeout(reconnect)
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
      }

      setBridge('connecting')

      const custom = overrideUrl !== undefined ? overrideUrl : bridgeUrl
      let targetUrl = custom ? custom.trim() : ''

      if (!targetUrl) {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        targetUrl = `${proto}//${window.location.host}/ws`
      }

      let ws
      try {
        ws = new WebSocket(targetUrl)
      } catch (err) {
        setBridge('offline')
        reconnect = setTimeout(() => connectBridge(), 4000)
        return
      }

      wsRef.current = ws

      const handleIncoming = (event) => {
        let frame
        try {
          frame = JSON.parse(event.data)
        } catch {
          return
        }

        if (frame.type === 'status') {
          update(frame.id, {
            status: frame.status,
            error: frame.error || '',
            url: frame.url
          })
          note(frame.id, `status: ${frame.status}${frame.error ? ` (${frame.error})` : ''}`)
          return
        }

        if (frame.type === 'subscribed') {
          setConnections((prev) =>
            prev.map((c) => {
              if (c.id !== frame.id) return c
              const existing = c.subs.filter((s) => s.topic !== frame.topic)
              const nextSubs = frame.error ? existing : [...existing, { topic: frame.topic, qos: frame.qos }]
              return { ...c, subs: nextSubs }
            })
          )
          note(frame.id, frame.error ? `sub failed: ${frame.topic} (${frame.error})` : `subscribed: ${frame.topic}`)
          return
        }

        if (frame.type === 'unsubscribed') {
          setConnections((prev) =>
            prev.map((c) => (c.id === frame.id ? { ...c, subs: c.subs.filter((s) => s.topic !== frame.topic) } : c))
          )
          note(frame.id, `unsubscribed: ${frame.topic}`)
          return
        }

        if (frame.type === 'published') {
          note(frame.id, frame.error ? `pub failed: ${frame.topic} (${frame.error})` : `published: ${frame.topic}`)
          return
        }

        if (frame.type === 'loadtest') {
          update(frame.id, { loadRunning: frame.running })
          note(frame.id, frame.running ? `load test @ ${frame.rate}/s` : 'load test stopped')
          return
        }

        if (frame.type === 'message') {
          ingest(frame.id, frame)
        }
      }

      ws.onopen = () => {
        setBridge('ready')
      }

      ws.onmessage = handleIncoming

      ws.onerror = () => {
        setBridge('offline')
      }

      ws.onclose = () => {
        setBridge('offline')
        // If not custom and running on localhost/127.0.0.1 not on port 3001, try direct 3001 as fallback
        if (!custom && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001') {
          const directUrl = 'ws://127.0.0.1:3001/ws'
          try {
            const fallbackWs = new WebSocket(directUrl)
            fallbackWs.onopen = () => {
              wsRef.current = fallbackWs
              setBridge('ready')
              fallbackWs.onmessage = handleIncoming
              fallbackWs.onerror = () => setBridge('offline')
              fallbackWs.onclose = () => {
                setBridge('offline')
                reconnect = setTimeout(() => connectBridge(), 4000)
              }
            }
            fallbackWs.onerror = () => {
              setBridge('offline')
              reconnect = setTimeout(() => connectBridge(), 4000)
            }
          } catch {
            reconnect = setTimeout(() => connectBridge(), 4000)
          }
        } else {
          reconnect = setTimeout(() => connectBridge(), 4000)
        }
      }
    }

    connectBridge()
    return () => {
      clearTimeout(reconnect)
      if (wsRef.current) wsRef.current.close()
    }
  }, [ingest, note, update, bridgeUrl])

  useEffect(() => {
    const flush = setInterval(() => {
      const batches = pendingRef.current
      const ids = Object.keys(batches).filter((id) => batches[id]?.length)
      if (!ids.length) return
      pendingRef.current = {}
      setConnections((prev) =>
        prev.map((c) => {
          const batch = batches[c.id]
          if (!batch?.length) return c
          const tree = upsertMany(c.tree, batch)
          let selectedNode = c.selectedNode
          if (c.selectedPath) {
            const walk = (node) => {
              if (node.path === c.selectedPath) return node
              return Object.values(node.children || {}).map(walk).find(Boolean)
            }
            selectedNode = walk(tree) || selectedNode
          }
          return { ...c, tree, selectedNode }
        })
      )
    }, 120)
    const t = setInterval(() => {
      const total = Object.values(countsRef.current).reduce((a, b) => a + b, 0)
      setRate(total)
      if (onRateChange) onRateChange(total)
      countsRef.current = {}
    }, 1000)
    return () => {
      clearInterval(flush)
      clearInterval(t)
    }
  }, [onRateChange])

  const connectBroker = (conn) => {
    const next = {
      ...conn,
      clientId: conn.clientId || `mqtt-studio-${Math.random().toString(16).slice(2, 10)}`,
      status: 'connecting',
      error: '',
      tree: emptyRoot(),
      subs: [],
      selectedPath: '',
      selectedNode: null
    }
    setConnections((prev) => prev.map((c) => (c.id === conn.id ? next : c)))
    pendingRef.current[conn.id] = []
    send({ type: 'connect', id: conn.id, options: next })
  }

  const saveConnection = (form) => {
    const existing = editing?.id && connections.some((c) => c.id === editing.id)
    const conn = makeConnection({ ...form, id: existing ? editing.id : undefined })
    if (existing) {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === conn.id
            ? { ...c, ...conn, tree: c.tree, events: c.events, subs: c.subs, status: c.status }
            : c
        )
      )
      setActiveId(conn.id)
      connectBroker({ ...connections.find((c) => c.id === conn.id), ...conn })
    } else {
      setConnections((prev) => [...prev, conn])
      setActiveId(conn.id)
      connectBroker(conn)
    }
    setModal(false)
    setEditing(null)
  }

  const disconnect = (id) => {
    stopLocalLoad(id)
    send({ type: 'disconnect', id })
    update(id, { status: 'disconnected', loadRunning: false })
  }

  const removeConnection = (id) => {
    stopLocalLoad(id)
    send({ type: 'disconnect', id })
    setConnections((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (activeId === id) setActiveId(next[0]?.id || '')
      return next
    })
  }

  const runDemo = () => {
    const existing = connections.find((c) => c.name === 'Store 6339 demo')
    const demo =
      existing ||
      makeConnection({
        name: 'Store 6339 demo',
        host: 'demo.local',
        port: 0,
        protocol: 'mqtt',
        subscriptions: [{ topic: 'store/6339/#', qos: 0 }]
      })
    if (!existing) setConnections((prev) => [...prev, demo])
    setActiveId(demo.id)
    startLocalLoad(demo.id, '6339', 100, DEMO_TOPICS)
    send({
      type: 'loadtest',
      id: demo.id,
      action: 'start',
      store: '6339',
      rate: 100,
      topics: DEMO_TOPICS
    })
    note(demo.id, 'demo started @ 100/s on 6 topics')
    setActiveStudioTab('load')
  }

  const stopDemo = (id) => {
    stopLocalLoad(id)
    send({ type: 'loadtest', id, action: 'stop' })
  }

  const visibleTree = useMemo(
    () => filterTree(active?.tree || emptyRoot(), filter) || emptyRoot(),
    [active, filter]
  )

  const connected = active?.status === 'connected'
  const demoRunning = connections.some((c) => c.loadRunning || localLoadRef.current[c.id])
  const topicCount = useMemo(() => countTreeTopics(active?.tree), [active?.tree])

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#090b10] text-mist-100' : 'bg-slate-100/80 text-slate-800'
      }`}
    >
      {/* Top Application Control & Telemetry Bar */}
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur-md z-10 transition-colors ${
          isDark
            ? 'border-white/[0.08] bg-[#0c0e18]/85 text-mist-100'
            : 'border-slate-200 bg-white/90 text-slate-800 shadow-2xs'
        }`}
      >
        {/* Left Branding & Broker Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20">
            <Radio size={18} className="text-white animate-pulse" />
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ${
                connected
                  ? 'bg-emerald-400 ring-emerald-900/50'
                  : active?.status === 'connecting'
                  ? 'bg-amber-400 ring-amber-900/50 animate-ping'
                  : 'bg-slate-400 ring-slate-800'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold tracking-tight">MQTT Studio</span>
              <span
                className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                  isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                v2.4 Live
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {active ? (
                <>
                  <span
                    className={`font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {active.name}
                  </span>
                  <span className={isDark ? 'text-mist-500' : 'text-slate-400'}>·</span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    {active.host}:{active.port}
                  </span>
                </>
              ) : (
                <span className={isDark ? 'text-mist-500' : 'text-slate-400'}>No broker active</span>
              )}
            </div>
          </div>
        </div>

        {/* Center Live Telemetry Gauges */}
        <div className="hidden items-center gap-2.5 md:flex">
          {/* Bridge indicator */}
          <button
            type="button"
            onClick={() => setIsBridgeModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition-all cursor-pointer hover:brightness-110 active:scale-95 ${
              bridge === 'ready'
                ? isDark
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : bridge === 'offline'
                ? isDark
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
                : isDark
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
            title="Click for WebSocket proxy bridge status & setup guide"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                bridge === 'ready'
                  ? 'bg-emerald-400 animate-pulse'
                  : bridge === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {bridge === 'ready' ? 'Bridge Live' : bridge === 'offline' ? 'Bridge Offline' : 'Connecting'}
            </span>
          </button>

          {/* Rate Speedometer */}
          <div
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
              rate > 0
                ? isDark
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 shadow-xs'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                : isDark
                ? 'border-white/[0.06] bg-white/[0.03] text-mist-400'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <Activity size={12} className={rate > 0 ? 'text-indigo-400 animate-pulse' : 'opacity-40'} />
            <span className="font-bold">{rate.toFixed(0)}</span>
            <span className="text-[10px] opacity-70">msg/s</span>
          </div>

          {/* Stream Paused Flag */}
          {active?.paused && (
            <span className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-bold text-amber-300 animate-pulse">
              <Pause size={10} /> STREAM PAUSED
            </span>
          )}
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume button */}
          <button
            onClick={() => {
              if (!active) return
              const next = !active.paused
              pausedRef.current[active.id] = next
              update(active.id, { paused: next })
            }}
            disabled={!active}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              active?.paused
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : isDark
                ? 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
            title={active?.paused ? 'Resume packet ingestion' : 'Pause stream ingestion'}
          >
            {active?.paused ? <Play size={12} className="fill-current" /> : <Pause size={12} />}
            <span className="hidden sm:inline">{active?.paused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Clear Tree */}
          <button
            onClick={() => {
              if (!active) return
              pendingRef.current[active.id] = []
              update(active.id, { tree: emptyRoot(), selectedNode: null, selectedPath: '' })
            }}
            disabled={!active}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
            title="Clear all discovered topics for active broker"
          >
            <Eraser size={12} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Store 6339 Demo Toggle */}
          {demoRunning ? (
            <button
              onClick={() => active && stopDemo(active.id)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 shadow-xs transition-all"
            >
              <WifiOff size={12} className="animate-spin" />
              <span>Stop Demo</span>
            </button>
          ) : (
            <button
              onClick={runDemo}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-xs'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-2xs'
              }`}
              title="Spawn simulated Store 6339 telemetry load stream"
            >
              <Zap size={12} className="text-amber-400" />
              <span className="hidden sm:inline">Store Demo</span>
            </button>
          )}

          {/* New Broker */}
          <button
            onClick={() => {
              setEditing(null)
              setModal(true)
            }}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all"
          >
            <Plug size={12} />
            <span>New Broker</span>
          </button>
        </div>
      </header>

      {/* Error alert toast if active broker experienced connection failure */}
      {active?.error && (
        <div
          className={`flex items-center justify-between border-b px-4 py-2 text-xs font-mono transition-colors ${
            isDark
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-500" />
            <span>Broker connection notice: {active.error}</span>
          </div>
          <button
            onClick={() => connectBroker(active)}
            className="rounded border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold hover:bg-rose-500/20 transition-all"
          >
            Retry Connect
          </button>
        </div>
      )}

      {/* Modern 4-Pane Responsive Workspace */}
      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_260px_minmax(0,1fr)_340px]">
        {/* Pane 1: Brokers Fleet List */}
        <section
          className={`min-h-0 border-r transition-colors ${
            isDark ? 'border-white/[0.06] bg-[#090c13]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <ConnectionList
            connections={connections}
            activeId={active?.id}
            onSelect={setActiveId}
            onAdd={() => {
              setEditing(null)
              setModal(true)
            }}
            onConnect={(id) => {
              const c = connections.find((x) => x.id === id)
              if (c) connectBroker(c)
            }}
            onDisconnect={disconnect}
            onRemove={removeConnection}
          />
        </section>

        {/* Pane 2: Topic Hierarchy Explorer */}
        <section
          className={`min-h-0 border-r transition-colors ${
            isDark ? 'border-white/[0.06] bg-[#0b0e17]' : 'border-slate-200 bg-white'
          }`}
        >
          <TopicTree
            tree={visibleTree}
            selected={active?.selectedPath}
            onSelect={(node) => {
              if (!active) return
              update(active.id, { selectedPath: node.path, selectedNode: node })
            }}
            filter={filter}
            onFilter={setFilter}
            title={active ? `${active.name} Topics` : 'Topic Tree'}
          />
        </section>

        {/* Pane 3: Central Payload Inspector & Message Stream */}
        <section
          className={`min-h-0 border-r transition-colors ${
            isDark ? 'border-white/[0.06] bg-[#0c101c]' : 'border-slate-200 bg-slate-50/40'
          }`}
        >
          <PayloadView node={active?.selectedNode} history={active?.selectedNode?.messages} />
        </section>

        {/* Pane 4: Right Interactive Studio (Publish, Load Test, Wire Audit & Subscriptions) */}
        <aside
          className={`flex min-h-0 flex-col transition-colors ${
            isDark ? 'bg-[#0a0d15]' : 'bg-white'
          }`}
        >
          {/* Segmented Tab Switcher */}
          <div
            className={`flex items-center border-b p-1.5 transition-colors ${
              isDark ? 'border-white/[0.06] bg-[#0d101a]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              onClick={() => setActiveStudioTab('publish')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeStudioTab === 'publish'
                  ? isDark
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : isDark
                  ? 'text-mist-400 hover:text-white hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Send size={12} />
              <span>Publish</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('load')}
              className={`relative flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeStudioTab === 'load'
                  ? isDark
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : isDark
                  ? 'text-mist-400 hover:text-white hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap size={12} />
              <span>Load Gen</span>
              {(active?.loadRunning || demoRunning) && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveStudioTab('events')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeStudioTab === 'events'
                  ? isDark
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : isDark
                  ? 'text-mist-400 hover:text-white hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity size={12} />
              <span>Wire & Subs</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                  activeStudioTab === 'events'
                    ? isDark
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-800'
                    : isDark
                    ? 'bg-white/10 text-mist-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {(active?.subs || []).length}
              </span>
            </button>
          </div>

          {/* Studio Tab Viewports */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeStudioTab === 'publish' && (
              <PublishPanel
                connected={Boolean(active) && bridge === 'ready'}
                onPublish={(p) => {
                  if (!active) return
                  send({ type: 'subscribe', id: active.id, topic: p.topic, qos: p.qos || 0 })
                  send({ type: 'publish', id: active.id, ...p })
                  const text = String(p.payload ?? '')
                  ingest(active.id, {
                    type: 'message',
                    id: active.id,
                    topic: p.topic,
                    payload: { size: text.length, hex: '', text },
                    qos: p.qos || 0,
                    retain: Boolean(p.retain),
                    dup: false,
                    timestamp: Date.now()
                  })
                  note(active.id, `publish ${p.topic}`)
                }}
              />
            )}

            {activeStudioTab === 'load' && (
              <div className="p-1">
                <LoadTest
                  connected={connected}
                  running={demoRunning || Boolean(active?.loadRunning)}
                  onStart={(cfg) => {
                    if (!active) return
                    startLocalLoad(active.id, cfg.store, cfg.rate, cfg.topics)
                    send({ type: 'subscribe', id: active.id, topic: `store/${cfg.store}/#`, qos: 0 })
                    send({
                      type: 'loadtest',
                      id: active.id,
                      action: 'start',
                      store: cfg.store,
                      rate: cfg.rate,
                      topics: cfg.topics
                    })
                  }}
                  onStop={() => active && stopDemo(active.id)}
                />
              </div>
            )}

            {activeStudioTab === 'events' && (
              <div className="flex flex-col h-full min-h-0">
                {/* Topic Subscriptions Section */}
                <div
                  className={`border-b p-3 transition-colors ${
                    isDark ? 'border-white/[0.06] bg-[#0c0f1a]/50' : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-xs font-bold tracking-tight">Active Subscriptions</span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold ${
                        isDark ? 'bg-white/5 text-mist-400' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {(active?.subs || []).length} filters
                    </span>
                  </div>

                  <SubscribeBar
                    connected={connected}
                    onSubscribe={(topic, qos) => active && send({ type: 'subscribe', id: active.id, topic, qos })}
                  />

                  {/* Subscription tags pool */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(active?.subs || []).length === 0 ? (
                      <span className={`text-[11px] italic ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
                        No topic filters subscribed yet. Enter # to catch all.
                      </span>
                    ) : (
                      (active?.subs || []).map((s) => (
                        <button
                          key={s.topic}
                          onClick={() => active && send({ type: 'unsubscribe', id: active.id, topic: s.topic })}
                          className={`group flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] transition-all ${
                            isDark
                              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-300'
                              : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                          title="Click to unsubscribe"
                        >
                          <span>{s.topic}</span>
                          <span className="opacity-50 text-[9px]">Q{s.qos}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-rose-500 font-bold ml-0.5">×</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Wire Event Stream Section */}
                <div className="flex-1 flex flex-col min-h-0 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Terminal size={13} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                      <span className="font-display text-xs font-bold tracking-tight">Wire Event Stream</span>
                    </div>
                    {active && (active.events || []).length > 0 && (
                      <button
                        onClick={() => update(active.id, { events: [] })}
                        className={`text-[10px] font-semibold hover:underline ${
                          isDark ? 'text-mist-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Clear Log
                      </button>
                    )}
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto rounded-xl border p-2.5 font-mono text-[11px] space-y-1.5 ${
                      isDark
                        ? 'border-white/[0.06] bg-[#07090f] text-mist-300'
                        : 'border-slate-200 bg-slate-900 text-slate-200'
                    }`}
                  >
                    {(!active?.events || active.events.length === 0) && (
                      <div className="p-4 text-center text-xs opacity-50 italic">
                        No wire events recorded yet. Connect to a broker or subscribe to a topic.
                      </div>
                    )}
                    {(active?.events || []).map((e, i) => {
                      const isErr = e.text?.includes('failed') || e.text?.includes('error')
                      const isSub = e.text?.includes('subscribed')
                      const isPub = e.text?.includes('published') || e.text?.includes('publish')
                      const isConn = e.text?.includes('status:') || e.text?.includes('connected')

                      return (
                        <div
                          key={`${e.at}-${i}`}
                          className="flex items-start gap-2 border-b border-white/[0.04] pb-1 last:border-b-0"
                        >
                          <span className="shrink-0 text-[10px] text-mist-500 select-none">
                            {new Date(e.at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span
                            className={`break-all ${
                              isErr
                                ? 'text-rose-400 font-semibold'
                                : isSub
                                ? 'text-emerald-400'
                                : isPub
                                ? 'text-cyan-300'
                                : isConn
                                ? 'text-indigo-300'
                                : 'text-mist-300'
                            }`}
                          >
                            {e.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Modern Status Footer */}
      <footer
        className={`flex items-center justify-between border-t px-4 py-2 text-[11px] font-mono transition-colors ${
          isDark
            ? 'border-white/[0.08] bg-[#080a10] text-mist-400'
            : 'border-slate-200 bg-white text-slate-600 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <Cable size={12} className={connected ? 'text-emerald-400' : 'text-slate-400'} />
          <span>
            {active ? (
              <>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{active.name}</strong> ·{' '}
                {active.protocol}://{active.host}:{active.port} · Client:{' '}
                {active.clientId || 'auto-assigned'}
              </>
            ) : (
              'No connection selected'
            )}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span>
            Topics: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{topicCount}</strong>
          </span>
          <span className="opacity-40">|</span>
          <span>
            Throughput:{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-900'}>{rate.toFixed(0)} msg/s</strong>
          </span>
          <span className="opacity-40">|</span>
          <span className="opacity-70">
            <kbd className="rounded border px-1 py-0.2 text-[10px]">Ctrl+Enter</kbd> Publish ·{' '}
            <kbd className="rounded border px-1 py-0.2 text-[10px]">Esc</kbd> Dismiss
          </span>
        </div>
      </footer>

      {/* Connection Config Modal */}
      <ConnectModal
        open={modal}
        initial={editing}
        onClose={() => {
          setModal(false)
          setEditing(null)
        }}
        onSave={saveConnection}
      />

      {/* Bridge Diagnostic & Setup Modal */}
      <BridgeStatusModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        bridge={bridge}
        bridgeUrl={bridgeUrl}
        onUpdateBridgeUrl={(newUrl) => {
          setBridgeUrl(newUrl)
          if (newUrl) {
            localStorage.setItem('signo_bridge_url', newUrl)
          } else {
            localStorage.removeItem('signo_bridge_url')
          }
          if (wsRef.current) {
            try { wsRef.current.close() } catch {}
          }
        }}
        onRetry={() => {
          if (wsRef.current) {
            try { wsRef.current.close() } catch {}
          }
        }}
      />
    </div>
  )
}
