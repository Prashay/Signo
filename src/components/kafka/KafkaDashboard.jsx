import { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  Sliders,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Zap,
  Activity,
  Server,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaDashboard({
  clusters = [],
  isProbing = false,
  onProbeCluster,
  onProbeAllClusters,
  onOpenConfig,
  onConfigureCluster,
  onSelectCluster
}) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [showStandaloneBanner, setShowStandaloneBanner] = useState(true)
  const [onlyOffline, setOnlyOffline] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [sortField, setSortField] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)

  const onlineCount = useMemo(
    () => clusters.filter((c) => c.status === 'online').length,
    [clusters]
  )
  const offlineCount = useMemo(
    () => clusters.filter((c) => c.status !== 'online').length,
    [clusters]
  )

  const filteredClusters = useMemo(() => {
    return clusters
      .filter((c) => {
        if (onlyOffline && c.status === 'online') return false
        if (statusFilter === 'ONLINE' && c.status !== 'online') return false
        if (statusFilter === 'OFFLINE' && c.status === 'online') return false
        if (search) {
          const q = search.toLowerCase()
          return (
            c.name.toLowerCase().includes(q) ||
            c.version.toLowerCase().includes(q) ||
            (c.bootstrapServers || '').toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? ''
        const valB = b[sortField] ?? ''
        if (valA < valB) return sortAsc ? -1 : 1
        if (valA > valB) return sortAsc ? 1 : -1
        return 0
      })
  }, [clusters, onlyOffline, statusFilter, search, sortField, sortAsc])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  return (
    <div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Hero Banner & Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              Live Cluster Fleet
            </span>
          </div>
          <h1
            className={`font-display text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Cluster Dashboard
          </h1>
          <p className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Real-time topology, stream throughput, and partition distribution across managed clusters
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          <span>Configure New Cluster</span>
        </button>
      </div>

      {/* Dynamic Docker / Connection Status Alert Banner */}
      {showStandaloneBanner && (
        <div
          className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 backdrop-blur-xl transition-all ${
            offlineCount > 0
              ? isDark
                ? 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                : 'border-amber-200 bg-amber-50/80 text-amber-900 shadow-xs'
              : isDark
                ? 'border-indigo-500/25 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 text-indigo-200'
                : 'border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50 text-indigo-950 shadow-xs'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                offlineCount > 0
                  ? isDark
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-amber-300 bg-white text-amber-600 shadow-xs'
                  : isDark
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-200 bg-white text-indigo-600 shadow-xs'
              }`}
            >
              {offlineCount > 0 ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs tracking-tight">
                  {offlineCount > 0
                    ? 'Docker Disconnected — Standalone Simulation Active'
                    : 'Live Clusters Connected'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono border font-medium ${
                    offlineCount > 0
                      ? isDark
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        : 'border-amber-300 bg-amber-100 text-amber-900'
                      : isDark
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : 'border-emerald-200 bg-emerald-100/80 text-emerald-800'
                  }`}
                >
                  {offlineCount > 0 ? 'Broker Port 8080 Offline' : '✓ Real-time Stream Connected'}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${offlineCount > 0 ? (isDark ? 'text-amber-200/80' : 'text-amber-800') : (isDark ? 'text-mist-400' : 'text-slate-600')}`}>
                {offlineCount > 0
                  ? 'No active broker was detected listening on localhost:8080 (Docker container is stopped). Kfkax continues to operate in Standalone Mode so you can design topics, produce simulated messages, and inspect schemas. Start docker-compose whenever you want live broker synchronization.'
                  : 'All bootstrap servers are online and responding to live probes.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {onProbeAllClusters && (
              <button
                type="button"
                onClick={onProbeAllClusters}
                disabled={isProbing}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
                }`}
              >
                <RefreshCw size={12} className={isProbing ? 'animate-spin text-amber-400' : ''} />
                <span>{isProbing ? 'Checking...' : 'Check Connection'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowStandaloneBanner(false)}
              aria-label="Dismiss banner"
              className={`rounded-lg p-1 transition-colors ${
                isDark ? 'text-mist-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Telemetry Stat Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Online Clusters */}
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Active Clusters</span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                onlineCount > 0
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : isDark
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {onlineCount > 0 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{onlineCount}</span>
            <span className={`text-xs ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>/ {clusters.length} total</span>
          </div>
          <div
            className={`mt-3 flex items-center gap-2 text-[11px] font-medium ${
              onlineCount > 0
                ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                onlineCount > 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>
              {onlineCount > 0
                ? `${onlineCount} operational cluster${onlineCount > 1 ? 's' : ''}`
                : 'Docker stopped / 0 online'}
            </span>
          </div>
        </div>

        {/* Real-time Stream Throughput */}
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Stream Ingress / Egress</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <TrendingUp size={13} />
            </span>
          </div>
          <div className={`font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            1.42 <span className={`text-xs font-normal ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>MB/s</span>
          </div>
          <div className={`mt-3 flex items-center justify-between text-[11px] font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span>Prod: 124.5 KB/s</span>
            <span>Cons: 89.2 KB/s</span>
          </div>
        </div>

        {/* Partition Topology */}
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Partitions & Topics</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Layers size={13} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>12</span>
            <span className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>partitions in 4 topics</span>
          </div>
          <div className={`mt-3 text-[11px] ${isDark ? 'text-indigo-300' : 'text-indigo-600 font-medium'}`}>
            <span>Full replica synchronization</span>
          </div>
        </div>

        {/* Node Target Connectivity */}
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Target Bootstrap Node</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Server size={13} />
            </span>
          </div>
          <div className={`font-mono text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            localhost:8080
          </div>
          <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Port 8080 active · Node #1</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter pills + Search + Offline Switch */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Tabs */}
          <div
            className={`flex items-center rounded-xl border p-1 transition-colors ${
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL')
                setOnlyOffline(false)
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                statusFilter === 'ALL' && !onlyOffline
                  ? isDark
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-mist-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Clusters ({clusters.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ONLINE')
                setOnlyOffline(false)
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                statusFilter === 'ONLINE' && !onlyOffline
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-xs'
                  : isDark
                  ? 'text-mist-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online ({onlineCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('OFFLINE')
                setOnlyOffline(true)
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                onlyOffline || statusFilter === 'OFFLINE'
                  ? isDark
                    ? 'bg-red-500/20 text-red-300 shadow-sm'
                    : 'bg-red-50 text-red-700 border border-red-200 font-semibold shadow-xs'
                  : isDark
                  ? 'text-mist-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>

          {/* Offline only toggle switch */}
          <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${isDark ? 'text-mist-400' : 'text-slate-600'}`}>
            <input
              type="checkbox"
              checked={onlyOffline}
              onChange={(e) => {
                setOnlyOffline(e.target.checked)
                if (e.target.checked) setStatusFilter('OFFLINE')
                else setStatusFilter('ALL')
              }}
              className="sr-only peer"
            />
            <div
              className={`relative h-5 w-9 rounded-full transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4 peer-checked:bg-indigo-600 ${
                isDark ? 'bg-white/10' : 'bg-slate-300'
              }`}
            />
            <span>Only offline</span>
          </label>
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-72">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-mist-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search by name, version, host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-500 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
            }`}
          />
        </div>
      </div>

      {/* Clusters Fleet Table */}
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
              className={`border-b text-[11px] font-medium select-none ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.02] text-mist-400'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Cluster Name</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('version')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Engine Version</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('brokersCount')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Brokers</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('partitions')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Partitions</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('topicsCount')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Topics</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('production')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Production</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('consumption')}
                  className={`cursor-pointer px-5 py-3.5 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className={isDark ? 'text-mist-500' : 'text-slate-400'} />
                    <span>Consumption</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center ${isDark ? 'text-mist-400' : 'text-slate-400'}`}>
                    No clusters found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster) => (
                  <tr
                    key={cluster.id || cluster.name}
                    className={`transition-colors group ${
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                            isDark
                              ? 'bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 text-indigo-300 border-indigo-500/20'
                              : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <Zap size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectCluster && onSelectCluster(cluster)}
                              className={`font-semibold transition-colors ${
                                isDark ? 'text-white hover:text-indigo-400' : 'text-slate-900 hover:text-indigo-600'
                              }`}
                            >
                              {cluster.name}
                            </button>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                cluster.status === 'online'
                                  ? isDark
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : cluster.status === 'checking'
                                  ? isDark
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isDark
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  cluster.status === 'online'
                                    ? 'bg-emerald-500'
                                    : cluster.status === 'checking'
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {cluster.status === 'online'
                                ? `Operational (${cluster.latency || '4ms'})`
                                : cluster.status === 'checking'
                                ? 'Checking...'
                                : 'Offline (Docker stopped)'}
                            </span>
                            {cluster.readOnly && (
                              <span
                                className={`rounded px-1.5 py-0.2 text-[10px] border ${
                                  isDark
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                Read-Only
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`font-mono text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                              {cluster.bootstrapServers || 'localhost:8080'}
                            </span>
                            {cluster.status === 'offline' && (
                              <span className={`text-[10px] font-mono ${isDark ? 'text-rose-400/90' : 'text-rose-600'}`}>
                                • Port unreachable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-mono ${isDark ? 'text-mist-300' : 'text-slate-700'}`}>
                      {cluster.version || '3.5-IV2'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono ${
                          isDark
                            ? 'bg-white/5 text-mist-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Server size={11} className={isDark ? 'text-mist-400' : 'text-slate-500'} />
                        {cluster.brokersCount ?? 1} node
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-mono ${isDark ? 'text-mist-200' : 'text-slate-700'}`}>
                      {cluster.partitions ?? 12}
                    </td>
                    <td className={`px-5 py-4 font-mono font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700 font-semibold'}`}>
                      {cluster.topicsCount ?? 4}
                    </td>
                    <td className={`px-5 py-4 font-mono ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>
                      {cluster.status === 'online' ? (cluster.production || '124.5 KB/s') : '0 Bytes'}
                    </td>
                    <td className={`px-5 py-4 font-mono ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>
                      {cluster.status === 'online' ? (cluster.consumption || '89.2 KB/s') : '0 Bytes'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onProbeCluster && (
                          <button
                            type="button"
                            onClick={() => onProbeCluster(cluster)}
                            disabled={isProbing}
                            title="Probe broker connection"
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                              isDark
                                ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                            }`}
                          >
                            <RefreshCw size={11} className={isProbing ? 'animate-spin text-amber-400' : ''} />
                            <span>Check</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectCluster && onSelectCluster(cluster)}
                          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            isDark
                              ? 'border-white/10 bg-white/5 text-mist-200 hover:bg-white/10 hover:text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
                          }`}
                        >
                          <span>Explore</span>
                          <ArrowUpRight size={13} className={isDark ? 'text-mist-400' : 'text-slate-500'} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onConfigureCluster(cluster)}
                          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isDark
                              ? 'border-indigo-500/30 bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                              : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 shadow-xs'
                          }`}
                        >
                          <Sliders size={12} />
                          <span>Configure</span>
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
    </div>
  )
}
