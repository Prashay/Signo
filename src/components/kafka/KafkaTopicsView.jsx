import { useState, useEffect, useCallback } from 'react'
import {
  Layers,
  Plus,
  Send,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
  Hash,
  Database,
  ArrowUpRight,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaTopicsView({ cluster, onTopicsUpdated, onTopicOpen }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [topics, setTopics] = useState([])
  const [search, setSearch] = useState('')
  const [hideInternal, setHideInternal] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [isLive, setIsLive] = useState(false)

  // Modal states
  const [createModal, setCreateModal] = useState(false)
  const [produceModal, setProduceModal] = useState(false)

  // Create topic state
  const [newTopicName, setNewTopicName] = useState('')
  const [newPartitions, setNewPartitions] = useState(3)
  const [newReplication, setNewReplication] = useState(1)
  const [newCleanup, setNewCleanup] = useState('Delete')

  // Produce state
  const [produceTopic, setProduceTopic] = useState('')
  const [produceKey, setProduceKey] = useState('store_6339')
  const [produceValue, setProduceValue] = useState(
    JSON.stringify({ event: 'SALE_COMPLETED', amount: 129.5, cashier: 'Jane', ts: Date.now() }, null, 2)
  )
  const [produceStatus, setProduceStatus] = useState(null)

  const loadTopics = useCallback(async () => {
    if (!cluster) return
    setLoadingTopics(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/kafka/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster })
      })
      const data = await res.json()
      if (data.ok && Array.isArray(data.topics)) {
        setTopics(data.topics)
        setIsLive(true)
        if (onTopicsUpdated) onTopicsUpdated(data.topics.length)
        if (data.topics.length > 0) {
          setProduceTopic(data.topics[0].name)
        }
      } else {
        setIsLive(false)
        setFetchError(data.error || 'Failed to fetch topics from broker')
        setTopics([])
      }
    } catch (err) {
      setIsLive(false)
      setFetchError(err.message || 'Unable to connect to Kafka API')
      setTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }, [cluster, onTopicsUpdated])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  const filteredTopics = topics.filter((t) => {
    if (hideInternal && t.internal) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCreateTopic = async (e) => {
    e.preventDefault()
    const name = newTopicName.trim()
    if (!name) return

    try {
      const res = await fetch('/api/kafka/create-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cluster,
          topic: name,
          partitions: Number(newPartitions) || 1,
          replicationFactor: Number(newReplication) || 1
        })
      })
      const data = await res.json()
      if (data.ok) {
        await loadTopics()
      } else {
        setFetchError(data.error || 'Kafka rejected topic creation')
      }
    } catch (err) {
      setFetchError(err.message || 'Unable to create topic on Kafka broker')
    }
    setNewTopicName('')
    setCreateModal(false)
  }

  const handleProduce = async (e) => {
    e.preventDefault()
    if (!produceTopic) {
      setProduceStatus('Select a Kafka topic before publishing a message')
      return
    }
    let parsedVal = produceValue
    try {
      parsedVal = JSON.parse(produceValue)
    } catch {}

    let publishOk = false
    try {
      const res = await fetch('/api/kafka/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cluster,
          topic: produceTopic,
          key: produceKey,
          value: parsedVal
        })
      })
      const data = await res.json()
      if (data.ok) {
        publishOk = true
        setProduceStatus('Message published successfully to Kafka broker partition!')
      } else {
        setProduceStatus(`Publish failed: ${data.error || 'Kafka rejected the message'}`)
      }
    } catch {
      setProduceStatus('Publish failed: Kafka broker is unavailable')
    }

    if (publishOk) {
      await loadTopics()
    }
    setTimeout(() => {
      setProduceStatus(null)
      setProduceModal(false)
    }, 1200)
  }

  return (
    <div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Title & Action Buttons */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isDark ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              Event Streams
            </span>
          </div>
          <h1
            className={`font-display text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Stream Topics
          </h1>
          <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Cluster: <span className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{cluster?.name || 'local'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadTopics}
            disabled={loadingTopics}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all shadow-sm ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-mist-300 hover:bg-white/[0.08] hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Refresh topics from Kafka broker"
          >
            <RefreshCw size={14} className={loadingTopics ? 'animate-spin text-cyan-400' : ''} />
            <span>{loadingTopics ? 'Fetching...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setProduceModal(true)}
            disabled={topics.length === 0}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all shadow-sm ${
              isDark
                ? 'border-indigo-500/30 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            } ${topics.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send size={14} />
            <span>Produce Message</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus size={15} />
            <span>Create Topic</span>
          </button>
        </div>
      </div>

      {/* Live connection or Error Banner */}
      {isLive && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs transition-colors ${
            isDark
              ? 'border-emerald-500/25 bg-emerald-950/40 text-emerald-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Live Kafka Topics:</span>
            <span>Retrieved {topics.length} topic{topics.length === 1 ? '' : 's'} directly from broker.</span>
          </div>
          <span className="font-mono text-[11px] opacity-75">{cluster?.bootstrapServers || cluster?.servers?.[0]?.host}</span>
        </div>
      )}

      {fetchError && !isLive && (
        <div
          className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs transition-colors ${
            isDark
              ? 'border-amber-500/30 bg-amber-950/40 text-amber-200'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={15} className="text-amber-400 shrink-0" />
            <div className="min-w-0 truncate">
              <span className="font-semibold">Broker unreachable: </span>
              <span className="font-mono text-[11px]">{fetchError}</span>
              <span className="opacity-80"> (no fallback/demo topics are shown)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadTopics}
            className="ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-mist-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Filter by topic name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-500 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500'
            }`}
          />
        </div>

        <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${isDark ? 'text-mist-400' : 'text-slate-600'}`}>
          <input
            type="checkbox"
            checked={hideInternal}
            onChange={(e) => setHideInternal(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
          />
          <span>Hide Internal System Topics</span>
        </label>
      </div>

      {/* Topics Table */}
      <div
        className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors ${
          isDark
            ? 'border-white/[0.08] bg-[#0c0e18]/80 shadow-panel'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[11px] font-medium ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.02] text-mist-400'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <tr>
                <th className="px-5 py-3.5">Topic Channel</th>
                <th className="px-5 py-3.5">Partitions</th>
                <th className="px-5 py-3.5">Replication</th>
                <th className="px-5 py-3.5">Message Depth</th>
                <th className="px-5 py-3.5">Storage Footprint</th>
                <th className="px-5 py-3.5">Retention Policy</th>
                <th className="px-5 py-3.5 text-right">Stream Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono text-xs ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-12 text-center font-sans ${isDark ? 'text-mist-400' : 'text-slate-400'}`}>
                    No topics found matching your query.
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic) => (
                  <tr
                    key={topic.name}
                    className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onTopicOpen) onTopicOpen(topic)
                          }}
                          className={`font-semibold font-sans text-xs transition-colors ${
                            isDark ? 'text-white hover:text-cyan-300' : 'text-slate-900 hover:text-indigo-600'
                          }`}
                        >
                          {topic.name}
                        </button>
                        {topic.internal && (
                          <span
                            className={`rounded-full px-2 py-0.5 font-sans text-[10px] border ${
                              isDark
                                ? 'bg-white/5 text-mist-400 border-white/10'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            system
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{topic.partitions}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>{topic.replicationFactor}x</td>
                    <td className={`px-5 py-4 font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{topic.messagesCount.toLocaleString()}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>{topic.size}</td>
                    <td className={`px-5 py-4 font-sans ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>{topic.cleanUp}</td>
                    <td className="px-5 py-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onTopicOpen) onTopicOpen(topic)
                          }}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                            isDark
                              ? 'border-white/10 bg-white/5 text-mist-200 hover:bg-white/10 hover:text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
                          }`}
                          title="Open Topic Details"
                        >
                          <Eye size={13} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
                          <span>Open</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProduceTopic(topic.name)
                            setProduceModal(true)
                          }}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isDark
                              ? 'border-indigo-500/30 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                              : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xs'
                          }`}
                          title="Produce to topic"
                        >
                          <Send size={13} />
                          <span>Publish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TOPIC MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'border-white/10 bg-[#0d101b] text-mist-100' : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Plus size={16} />
                </div>
                <h2 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create New Stream Topic
                </h2>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className={`transition-colors ${isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g. telemetry.events.v1"
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                      : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                    Partitions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={newPartitions}
                    onChange={(e) => setNewPartitions(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                    Replication Factor
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={newReplication}
                    onChange={(e) => setNewReplication(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Cleanup Policy
                </label>
                <select
                  value={newCleanup}
                  onChange={(e) => setNewCleanup(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-[#141727] text-white focus:border-indigo-500'
                      : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                  }`}
                >
                  <option value="Delete">Delete (Time / Size based retention)</option>
                  <option value="Compact">Compact (Log compaction)</option>
                  <option value="Compact,Delete">Compact & Delete</option>
                </select>
              </div>

              <div className={`flex items-center justify-end gap-2.5 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white hover:brightness-110 shadow-md"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCE MESSAGE MODAL */}
      {produceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'border-white/10 bg-[#0d101b] text-mist-100' : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Send size={15} />
                </div>
                <h2 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Publish Stream Message
                </h2>
              </div>
              <button
                onClick={() => setProduceModal(false)}
                className={`transition-colors ${isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X size={16} />
              </button>
            </div>

            {produceStatus && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
                  isDark
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>{produceStatus}</span>
              </div>
            )}

            <form onSubmit={handleProduce} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Target Topic
                </label>
                <select
                  value={produceTopic}
                  onChange={(e) => setProduceTopic(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-[#141727] text-white focus:border-indigo-500'
                      : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                  }`}
                >
                  {topics.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Partition Key (Optional)
                </label>
                <input
                  type="text"
                  value={produceKey}
                  onChange={(e) => setProduceKey(e.target.value)}
                  placeholder="Partition key string"
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                      : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Payload Content
                </label>
                <textarea
                  rows={6}
                  value={produceValue}
                  onChange={(e) => setProduceValue(e.target.value)}
                  className={`w-full rounded-xl border p-3.5 font-mono text-xs outline-none transition-all shadow-inner ${
                    isDark
                      ? 'border-white/10 bg-black/40 text-cyan-300 focus:border-indigo-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2.5 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setProduceModal(false)}
                  className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white hover:brightness-110 shadow-md"
                >
                  <Send size={13} />
                  <span>Send Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
