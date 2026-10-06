import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

const TABS = ['Overview', 'Messages', 'Consumers', 'Settings', 'Statistics']
const PAGE_SIZE = 50

// Keep topic data in-memory while navigating away and back. A topic is fetched
// once on entry and stays cached until the user explicitly presses Refresh.
const topicViewCache = new Map()

function topicCacheKey(cluster, topicName) {
  return `${JSON.stringify(cluster)}::${topicName}`
}

function sortKafkaMessages(items, order) {
  const rows = [...(items || [])]
  const newestFirst = order === 'newest'
  rows.sort((a, b) => {
    const at = Number(a.timestamp || 0)
    const bt = Number(b.timestamp || 0)
    if (at !== bt) return newestFirst ? bt - at : at - bt
    const ap = Number(a.partition || 0)
    const bp = Number(b.partition || 0)
    if (ap !== bp) return newestFirst ? bp - ap : ap - bp
    try {
      const ao = BigInt(String(a.offset || '0'))
      const bo = BigInt(String(b.offset || '0'))
      if (ao === bo) return 0
      return newestFirst ? (bo > ao ? 1 : -1) : (ao > bo ? 1 : -1)
    } catch {
      return newestFirst ? String(b.offset).localeCompare(String(a.offset)) : String(a.offset).localeCompare(String(b.offset))
    }
  })
  return rows
}

function formatBytes(bytes) {
  const n = Number(bytes || 0)
  if (!Number.isFinite(n) || n <= 0) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}

function tone(isDark, kind = 'neutral') {
  const map = {
    success: isDark ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    warning: isDark ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200',
    neutral: isDark ? 'text-mist-300 bg-white/[0.03] border-white/10' : 'text-slate-600 bg-slate-50 border-slate-200'
  }
  return map[kind] || map.neutral
}

export default function KafkaTopicDetailView({ cluster, topic, onBack, onPublish }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)
  const [configs, setConfigs] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [consumers, setConsumers] = useState([])
  const [messages, setMessages] = useState([])

  const [seekType, setSeekType] = useState('offset')
  const [seekValue, setSeekValue] = useState('0')
  const now = new Date()
  const [seekDate, setSeekDate] = useState(() => now.toISOString().slice(0, 10))
  const [seekTime, setSeekTime] = useState(() => now.toTimeString().slice(0, 5))
  const dateInputRef = useRef(null)
  const timeInputRef = useRef(null)
  const liveIntervalRef = useRef(null)
  const loadMessagesRef = useRef(null)

  const openNativePicker = useCallback((inputRef) => {
    const input = inputRef.current
    if (!input) return
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker()
        return
      }
    } catch (_) {
      // Some Chromium/Electron builds can reject showPicker outside the native picker path.
    }
    input.focus()
    input.click()
  }, [])
  const [selectedPartitions, setSelectedPartitions] = useState([])
  const [partitionMenuOpen, setPartitionMenuOpen] = useState(false)
  const [keySerde, setKeySerde] = useState('String')
  const [valueSerde, setValueSerde] = useState('String')
  const [messageSearch, setMessageSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('oldest')
  const [extraFilter, setExtraFilter] = useState(false)
  const [extraKey, setExtraKey] = useState('')
  const [extraValue, setExtraValue] = useState('')
  const [page, setPage] = useState(1)
  const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState(null)
  const [expandedTab, setExpandedTab] = useState('value')

  const topicName = topic?.name || ''
  const partitions = details?.partitions || []
  const partitionIds = useMemo(() => partitions.map((p) => p.partitionId), [partitions])

  const cacheKey = topicCacheKey(cluster, topicName)

  const loadDetails = useCallback(async ({ force = false } = {}) => {
    if (!cluster || !topicName) return

    const cached = topicViewCache.get(cacheKey)
    if (!force && cached?.details) {
      setDetails(cached.details)
      setConfigs(cached.configs || [])
      setStatistics(cached.statistics || null)
      if (cached.messagesLoaded) {
        setMessages(cached.messages || [])
        setInitialMessagesLoaded(true)
      }
      if (cached.consumersLoaded) setConsumers(cached.consumers || [])
      const ids = (cached.details?.partitions || []).map((p) => p.partitionId)
      setSelectedPartitions((current) => current.length ? current.filter((id) => ids.includes(id)) : ids)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/kafka/topic-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, topic: topicName })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Unable to load topic details')
      const nextDetails = data.details
      setDetails(nextDetails)
      setConfigs(data.configs || [])
      setStatistics(data.statistics || null)
      const ids = (nextDetails?.partitions || []).map((p) => p.partitionId)
      setSelectedPartitions((current) => current.length ? current.filter((id) => ids.includes(id)) : ids)
      topicViewCache.set(cacheKey, {
        ...(topicViewCache.get(cacheKey) || {}),
        details: nextDetails,
        configs: data.configs || [],
        statistics: data.statistics || null
      })
    } catch (err) {
      setError(err.message || 'Unable to load topic details')
    } finally {
      setLoading(false)
    }
  }, [cluster, topicName, cacheKey])

  const loadConsumers = useCallback(async () => {
    if (!cluster || !topicName) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/kafka/topic-consumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, topic: topicName })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Unable to load topic consumers')
      const nextConsumers = data.consumers || []
      setConsumers(nextConsumers)
      topicViewCache.set(cacheKey, { ...(topicViewCache.get(cacheKey) || {}), consumers: nextConsumers, consumersLoaded: true })
    } catch (err) {
      setError(err.message || 'Unable to load topic consumers')
    } finally {
      setLoading(false)
    }
  }, [cluster, topicName])

  const loadMessages = useCallback(async ({ initial = false, force = false, live = false } = {}) => {
    if (!cluster || !topicName) return
    setLoading(true)
    setError('')

    const requestSeekType = (initial || live || seekType === 'live') ? 'latest' : seekType
    const requestSeekValue = initial
      ? ''
      : seekType === 'timestamp'
        ? new Date(`${seekDate}T${seekTime}`).getTime()
        : seekValue

    try {
      const res = await fetch('/api/kafka/topic-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cluster,
          topic: topicName,
          seekType: requestSeekType,
          seekValue: requestSeekValue,
          partitions: selectedPartitions.length ? selectedPartitions : partitionIds,
          limit: 500,
          search: messageSearch,
          sortOrder: sortOrder === 'live' ? 'newest' : sortOrder,
          keySerde,
          valueSerde,
          keyFilter: extraKey,
          valueFilter: extraValue
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Unable to consume topic messages')

      // Replace displayed data only after Kafka has returned a successful result.
      // A manual query must never clear an existing result while it is in flight.
      const nextMessages = sortKafkaMessages(data.messages || [], sortOrder)
      setMessages(nextMessages)
      setPage(1)
      topicViewCache.set(cacheKey, { ...(topicViewCache.get(cacheKey) || {}), messages: nextMessages, messagesLoaded: true })
      if (initial || live || seekType === 'live') setInitialMessagesLoaded(true)
    } catch (err) {
      setError(err.message || 'Unable to consume topic messages')
      // Preserve the previous successful result on a failed fetch.
    } finally {
      setLoading(false)
    }
  }, [cluster, topicName, cacheKey, seekType, seekDate, seekTime, selectedPartitions, partitionIds, messageSearch, sortOrder, keySerde, valueSerde, extraKey, extraValue])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  useEffect(() => {
    loadMessagesRef.current = loadMessages
  }, [loadMessages])

  useEffect(() => {
    if (activeTab === 'Consumers') {
      const cached = topicViewCache.get(cacheKey)
      if (!cached?.consumersLoaded) loadConsumers()
      else setConsumers(cached.consumers || [])
    }
    if (activeTab === 'Messages' && details && !initialMessagesLoaded) {
      const cached = topicViewCache.get(cacheKey)
      if (cached?.messagesLoaded) {
        setMessages(sortKafkaMessages(cached.messages || [], sortOrder))
        setInitialMessagesLoaded(true)
      } else {
        loadMessages({ initial: true })
      }
    }
    // Filter changes intentionally do not fetch. Submit is the manual fetch action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, details, initialMessagesLoaded, cacheKey])

  useEffect(() => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    liveIntervalRef.current = null
    if (sortOrder === 'live' && activeTab === 'Messages') {
      // Live mode is the only mode that automatically refetches. It refreshes
      // the latest window without changing any user-selected filters.
      loadMessagesRef.current?.({ initial: true, live: true })
      liveIntervalRef.current = setInterval(() => loadMessagesRef.current?.({ initial: true, live: true }), 5000)
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
    }
  }, [sortOrder, activeTab])

  const totalMessages = details?.messageCount ?? topic?.messagesCount ?? 0
  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE))
  const visibleMessages = messages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const messageByteLength = (value) => {
    if (value == null) return 0
    return new TextEncoder().encode(String(value)).length
  }

  const formatMessageBytes = (value) => {
    const bytes = messageByteLength(value)
    if (!bytes) return '0 Bytes'
    if (bytes < 1024) return `${bytes} Bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const prettyMessageValue = (value) => {
    if (value == null) return 'null'
    const text = String(value)
    try {
      const parsed = JSON.parse(text)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return text
    }
  }

  const toggleExpandedMessage = (message) => {
    const key = `${message.partition}-${message.offset}`
    if (expandedMessage === key) {
      setExpandedMessage(null)
      return
    }
    setExpandedMessage(key)
    setExpandedTab('value')
  }

  const refreshTopic = useCallback(async () => {
    if (!cluster || !topicName) return
    topicViewCache.delete(cacheKey)
    setInitialMessagesLoaded(false)
    setError('')
    await loadDetails({ force: true })
    if (activeTab === 'Messages') await loadMessages({ initial: true, force: true })
  }, [cluster, topicName, cacheKey, activeTab, loadDetails, loadMessages])

  const handleSortChange = (nextOrder) => {
    setSortOrder(nextOrder)
    if (nextOrder === 'live') return
    const sorted = sortKafkaMessages(messages, nextOrder)
    setMessages(sorted)
    topicViewCache.set(cacheKey, { ...(topicViewCache.get(cacheKey) || {}), messages: sorted, messagesLoaded: true })
    setPage(1)
  }

  const selectAllPartitions = () => setSelectedPartitions(partitionIds)
  const clearPartitions = () => setSelectedPartitions([])
  const togglePartition = (id) => {
    setSelectedPartitions((current) => current.includes(id) ? current.filter((p) => p !== id) : [...current, id])
  }

  const cardClass = `rounded-xl border ${isDark ? 'border-white/[0.08] bg-[#0c0e18]/80' : 'border-slate-200 bg-white'} shadow-sm`
  const muted = isDark ? 'text-mist-400' : 'text-slate-500'
  const heading = isDark ? 'text-white' : 'text-slate-900'

  return (
    <div className={`flex-1 overflow-y-auto p-8 ${isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <button onClick={onBack} className={`mb-3 inline-flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}>
            <ArrowLeft size={14} /> Topics
          </button>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">Topics</span>
            <span className={muted}>/</span>
            <h1 className={`truncate font-display text-xl font-bold ${heading}`}>{topicName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshTopic} disabled={loading} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${tone(isDark)}`}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => onPublish?.(topicName)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
            <Send size={13} /> Produce Message
          </button>
        </div>
      </div>

      <div className={`mb-5 flex items-center gap-6 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 text-xs font-medium ${activeTab === tab ? (isDark ? 'text-white' : 'text-slate-900') : muted}`}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
        ))}
      </div>

      {error && <div className={`mb-5 rounded-lg border px-4 py-3 text-xs ${tone(isDark, 'warning')}`}>{error}</div>}

      {activeTab === 'Overview' && (
        <div>
          <div className="mb-5 grid grid-cols-2 gap-0 md:grid-cols-5">
            {[
              ['Partitions', details?.partitionsCount ?? topic?.partitions ?? 0],
              ['Replication Factor', details?.replicationFactor ?? topic?.replicationFactor ?? 0],
              ['URP', details?.underReplicatedPartitions ?? 'N/A'],
              ['In Sync Replicas', `${details?.inSyncReplicas ?? 'N/A'}${details?.totalReplicas ? ` of ${details.totalReplicas}` : ''}`],
              ['Message Count', Number(totalMessages).toLocaleString()]
            ].map(([label, value], index) => (
              <div key={label} className={`border px-4 py-4 ${index === 0 ? 'rounded-l-xl' : ''} ${index === 4 ? 'rounded-r-xl' : ''} ${isDark ? 'border-white/[0.08] bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
                <div className={`mb-2 text-[10px] uppercase tracking-wide ${muted}`}>{label}</div>
                <div className={`font-mono text-lg font-semibold ${heading}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className={cardClass}>
            <div className={`border-b px-4 py-3 text-xs font-semibold ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>Partition Details</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={isDark ? 'text-mist-400' : 'text-slate-500'}>
                  <tr>
                    <th className="px-4 py-3">Partition ID</th>
                    <th className="px-4 py-3">Leader</th>
                    <th className="px-4 py-3">Replicas</th>
                    <th className="px-4 py-3">ISR</th>
                    <th className="px-4 py-3">First Offset</th>
                    <th className="px-4 py-3">Next Offset</th>
                    <th className="px-4 py-3">Message Count</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                  {partitions.map((p) => (
                    <tr key={p.partitionId}>
                      <td className="px-4 py-3 font-mono">{p.partitionId}</td>
                      <td className="px-4 py-3 font-mono text-emerald-500">{p.leader ?? 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-emerald-500">{(p.replicas || []).join(', ') || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-emerald-500">{(p.isr || []).join(', ') || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono">{p.firstOffset ?? 0}</td>
                      <td className="px-4 py-3 font-mono">{p.nextOffset ?? 0}</td>
                      <td className="px-4 py-3 font-mono">{p.messageCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Messages' && (
        <div>
          <div className={`${cardClass} mb-4 p-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center">
                <select value={seekType} onChange={(e) => setSeekType(e.target.value)} className={`rounded-l-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`}>
                  <option value="offset">Offset</option>
                  <option value="timestamp">Date / Time</option>
                </select>
                {seekType === 'timestamp' ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => openNativePicker(dateInputRef)}
                        className={`inline-flex h-[34px] w-[145px] items-center gap-2 rounded-lg border px-3 text-left text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        title="Select date"
                      >
                        <Calendar size={14} className={muted} aria-hidden="true" />
                        <span>{seekDate ? new Date(`${seekDate}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Select date'}</span>
                      </button>
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={seekDate}
                        onChange={(e) => setSeekDate(e.target.value)}
                        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
                        tabIndex={-1}
                        aria-label="Select date"
                      />
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => openNativePicker(timeInputRef)}
                        className={`inline-flex h-[34px] w-[112px] items-center gap-2 rounded-lg border px-3 text-left text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        title="Select time"
                      >
                        <Clock3 size={14} className={muted} aria-hidden="true" />
                        <span>{seekTime ? new Date(`1970-01-01T${seekTime}:00`).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Select time'}</span>
                      </button>
                      <input
                        ref={timeInputRef}
                        type="time"
                        value={seekTime}
                        onChange={(e) => setSeekTime(e.target.value)}
                        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
                        tabIndex={-1}
                        aria-label="Select time"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Clock3 size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="number" min="0" value={seekValue} onChange={(e) => setSeekValue(e.target.value)} className={`w-[150px] rounded-r-lg border-y border-r px-8 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`} />
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setPartitionMenuOpen((v) => !v)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${tone(isDark)}`}>
                  <span>Partitions</span><ChevronDown size={12} />
                  <span className="font-semibold">{selectedPartitions.length === partitionIds.length ? 'All items are selected.' : `${selectedPartitions.length} selected`}</span>
                </button>
                {partitionMenuOpen && (
                  <div className={`absolute left-0 top-10 z-20 w-60 rounded-lg border p-3 shadow-xl ${isDark ? 'border-white/10 bg-[#111522]' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <button onClick={selectAllPartitions} className="text-indigo-600">Select all</button>
                      <button onClick={clearPartitions} className="text-slate-500">Clear</button>
                    </div>
                    {partitionIds.map((id) => (
                      <label key={id} className="flex items-center gap-2 py-1.5 text-xs">
                        <input type="checkbox" checked={selectedPartitions.includes(id)} onChange={() => togglePartition(id)} />
                        Partition {id}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <select value={keySerde} onChange={(e) => setKeySerde(e.target.value)} className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`}>
                <option>String</option><option>JSON</option><option>Bytes</option>
              </select>
              <select value={valueSerde} onChange={(e) => setValueSerde(e.target.value)} className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`}>
                <option>String</option><option>JSON</option><option>Bytes</option>
              </select>

              <div className="relative min-w-[220px] flex-1">
                <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                <input value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} placeholder="Search key or value" className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`} />
              </div>
              <button onClick={() => setExtraFilter((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${extraFilter ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : tone(isDark)}`}>
                <Filter size={13} /> Add Filters
              </button>
              <button onClick={loadMessages} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Submit</button>
              <select value={sortOrder} onChange={(e) => handleSortChange(e.target.value)} className={`ml-auto rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`}>
                <option value="oldest">Oldest First</option>
                <option value="newest">Newest First</option>
                <option value="live">Live</option>
              </select>
              {sortOrder === 'live' && <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] ${tone(isDark, 'success')}`}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>}
            </div>
            {extraFilter && (
              <div className={`mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2 ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                <input value={extraKey} onChange={(e) => setExtraKey(e.target.value)} placeholder="Key contains..." className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`} />
                <input value={extraValue} onChange={(e) => setExtraValue(e.target.value)} placeholder="Value contains..." className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white'}`} />
              </div>
            )}
          </div>

          <div className={cardClass}>
            <div className={`flex items-center justify-between border-b px-4 py-3 text-[11px] ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <span>{messages.length ? `${messages.length} messages consumed` : '0 messages consumed'}</span>
              <span className={muted}>Kafka consumer query · {keySerde} / {valueSerde}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={muted}>
                  <tr>
                    <th className="w-10 px-4 py-3"></th>
                    <th className="px-4 py-3">Offset</th>
                    <th className="px-4 py-3">Partition</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Key <span className="text-indigo-500">Preview</span></th>
                    <th className="px-4 py-3">Value <span className="text-indigo-500">Preview</span></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                  {visibleMessages.length === 0 ? (
                    <tr><td colSpan={6} className={`px-4 py-12 text-center ${muted}`}>No messages found</td></tr>
                  ) : visibleMessages.map((m) => {
                    const messageKey = `${m.partition}-${m.offset}`
                    const isExpanded = expandedMessage === messageKey
                    return (
                      <Fragment key={messageKey}>
                        <tr className={isExpanded ? (isDark ? 'bg-white/[0.03]' : 'bg-slate-50') : ''}>
                          <td className="px-4 py-2.5 align-middle">
                            <button
                              onClick={() => toggleExpandedMessage(m)}
                              aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
                              className="flex h-4 w-4 items-center justify-center rounded-sm bg-indigo-500 text-[11px] font-bold text-white hover:bg-indigo-600"
                            >
                              {isExpanded ? '−' : '+'}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 font-mono">{m.offset}</td>
                          <td className="px-4 py-2.5 font-mono">{m.partition}</td>
                          <td className="px-4 py-2.5 font-mono whitespace-nowrap">{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}</td>
                          <td className="max-w-[260px] px-4 py-2.5 font-mono truncate" title={m.key ?? ''}>{m.key ?? 'null'}</td>
                          <td className="max-w-[680px] px-4 py-2.5 font-mono truncate" title={m.value ?? ''}>{m.value ?? 'null'}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className={`p-0 ${isDark ? 'bg-[#11151f]' : 'bg-slate-50'}`}>
                              <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
                                <div className="p-4">
                                  <div className="mb-3 inline-flex overflow-hidden rounded-md border bg-white shadow-sm">
                                    {['key', 'value', 'headers'].map((tab) => (
                                      <button
                                        key={tab}
                                        onClick={() => setExpandedTab(tab)}
                                        className={`border-r px-4 py-2 text-xs font-medium last:border-r-0 ${expandedTab === tab ? 'bg-white text-slate-900' : 'text-slate-500 hover:bg-slate-50'} ${isDark && expandedTab === tab ? 'bg-[#1a2030] text-white' : ''}`}
                                      >
                                        {tab[0].toUpperCase() + tab.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                  <div className={`min-h-[130px] rounded-md border p-4 ${isDark ? 'border-white/10 bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
                                    {expandedTab === 'key' && (
                                      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">{prettyMessageValue(m.key)}</pre>
                                    )}
                                    {expandedTab === 'value' && (
                                      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">{prettyMessageValue(m.value)}</pre>
                                    )}
                                    {expandedTab === 'headers' && (
                                      Object.keys(m.headers || {}).length ? (
                                        <div className="max-h-[360px] overflow-auto space-y-2">
                                          {Object.entries(m.headers || {}).map(([name, value]) => (
                                            <div key={name} className="grid grid-cols-[190px_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                                              <div className="font-mono font-semibold text-slate-700 break-all">{name}</div>
                                              <pre className="whitespace-pre-wrap break-words font-mono text-slate-800">{prettyMessageValue(value)}</pre>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className={`text-xs ${muted}`}>No headers</div>
                                      )
                                    )}
                                  </div>
                                </div>
                                <aside className={`border-l p-5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                  <dl className="space-y-5 text-xs">
                                    <div>
                                      <dt className={muted}>Timestamp</dt>
                                      <dd className={`mt-1 font-mono text-sm ${heading}`}>{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}</dd>
                                      <div className={`mt-1 text-[10px] ${muted}`}>Timestamp type: CREATE_TIME</div>
                                    </div>
                                    <div>
                                      <dt className={muted}>Partition</dt>
                                      <dd className={`mt-1 font-mono text-sm ${heading}`}>{m.partition}</dd>
                                    </div>
                                    <div>
                                      <dt className={muted}>Offset</dt>
                                      <dd className={`mt-1 font-mono text-sm ${heading}`}>{m.offset}</dd>
                                    </div>
                                    <div>
                                      <dt className={muted}>Key Serde</dt>
                                      <dd className={`mt-1 text-sm ${heading}`}>{keySerde}</dd>
                                      <div className={`mt-1 text-[10px] ${muted}`}>Size: {formatMessageBytes(m.key)}</div>
                                    </div>
                                    <div>
                                      <dt className={muted}>Value Serde</dt>
                                      <dd className={`mt-1 text-sm ${heading}`}>{valueSerde}</dd>
                                      <div className={`mt-1 text-[10px] ${muted}`}>Size: {formatMessageBytes(m.value)}</div>
                                    </div>
                                    <div>
                                      <dt className={muted}>Headers</dt>
                                      <dd className={`mt-1 text-sm ${heading}`}>{Object.keys(m.headers || {}).length}</dd>
                                    </div>
                                  </dl>
                                </aside>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className={`flex items-center justify-between border-t px-4 py-3 text-xs ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <span className={muted}>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? 'opacity-40' : ''}`}>Back</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`rounded-lg border px-3 py-1.5 ${page >= totalPages ? 'opacity-40' : ''}`}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Consumers' && (
        <div className={cardClass}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <div>
              <div className={`text-sm font-semibold ${heading}`}>Consumers for {topicName}</div>
              <div className={`text-[11px] ${muted}`}>Consumer groups currently subscribed to this topic.</div>
            </div>
            <button onClick={loadConsumers} disabled={loading} className={`rounded-lg border px-3 py-2 text-xs ${tone(isDark)}`}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={muted}>
                <tr><th className="px-4 py-3">Consumer Group ID</th><th className="px-4 py-3">Active Consumers</th><th className="px-4 py-3">Consumer Lag</th><th className="px-4 py-3">Coordinator</th><th className="px-4 py-3">State</th></tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                {consumers.length === 0 ? <tr><td colSpan={5} className={`px-4 py-12 text-center ${muted}`}>No consumer groups are currently using this topic.</td></tr> : consumers.map((c) => (
                  <tr key={c.groupId}>
                    <td className="px-4 py-3 font-mono font-semibold">{c.groupId}</td>
                    <td className="px-4 py-3">{c.activeConsumers}</td>
                    <td className={`px-4 py-3 font-mono ${c.lag > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.lag}</td>
                    <td className="px-4 py-3 font-mono">{c.coordinator ?? 'N/A'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${c.state === 'STABLE' ? tone(isDark, 'success') : tone(isDark, 'warning')}`}>{c.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className={cardClass}>
          <div className={`flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}><Settings2 size={15} /> Topic Configuration</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={muted}><tr><th className="px-4 py-3">Property</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Source</th></tr></thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                {configs.map((c) => <tr key={c.name}><td className="px-4 py-3 font-mono">{c.name}</td><td className="px-4 py-3 font-mono break-all">{c.value ?? 'N/A'}</td><td className="px-4 py-3">{c.source || 'broker'}</td></tr>)}
                {!configs.length && <tr><td colSpan={3} className={`px-4 py-12 text-center ${muted}`}>No topic configuration was returned by Kafka.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Statistics' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${cardClass} p-5`}><div className={`text-xs ${muted}`}>Message Count</div><div className={`mt-2 font-mono text-2xl font-semibold ${heading}`}>{Number(statistics?.messageCount ?? totalMessages).toLocaleString()}</div></div>
          <div className={`${cardClass} p-5`}><div className={`text-xs ${muted}`}>Estimated Logical Bytes</div><div className={`mt-2 font-mono text-2xl font-semibold ${heading}`}>{formatBytes(statistics?.estimatedBytes)}</div><div className={`mt-1 text-[11px] ${muted}`}>Based on records actually read; broker disk bytes are not exposed by KafkaJS.</div></div>
          <div className={`${cardClass} p-5`}><div className={`text-xs ${muted}`}>Partitions</div><div className={`mt-2 font-mono text-2xl font-semibold ${heading}`}>{partitions.length}</div></div>
          <div className={`${cardClass} p-5 md:col-span-3`}><div className={`mb-3 text-sm font-semibold ${heading}`}>Partition Statistics</div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className={muted}><tr><th className="px-3 py-2">Partition</th><th className="px-3 py-2">Low</th><th className="px-3 py-2">High</th><th className="px-3 py-2">Messages</th></tr></thead><tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>{(statistics?.partitions || []).map((p) => <tr key={p.partition}><td className="px-3 py-2 font-mono">{p.partition}</td><td className="px-3 py-2 font-mono">{p.low}</td><td className="px-3 py-2 font-mono">{p.high}</td><td className="px-3 py-2 font-mono">{p.count}</td></tr>)}</tbody></table></div></div>
        </div>
      )}

      {loading && <div className={`fixed bottom-5 right-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-white/10 bg-[#111522] text-white' : 'border-slate-200 bg-white text-slate-700'}`}><RefreshCw size={13} className="animate-spin" /> Fetching Kafka data...</div>}
    </div>
  )
}
