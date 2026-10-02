import { useState } from 'react'
import { Users, AlertTriangle, CheckCircle2, Search, ArrowUpDown, Activity, Radio } from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

const DEFAULT_CONSUMERS = [
  {
    groupId: 'store-pos-stream-processor',
    status: 'STABLE',
    membersCount: 4,
    partitionsCovered: 4,
    totalLag: 0,
    topics: ['store.pos.transactions']
  },
  {
    groupId: 'inventory-reconciliation-worker',
    status: 'STABLE',
    membersCount: 3,
    partitionsCovered: 3,
    totalLag: 2,
    topics: ['inventory.events.stream']
  },
  {
    groupId: 'ecommerce-payment-gateway-consumer',
    status: 'STABLE',
    membersCount: 6,
    partitionsCovered: 6,
    totalLag: 0,
    topics: ['ecommerce.orders.v1']
  }
]

export default function KafkaConsumersView({ cluster }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [consumers, setConsumers] = useState(DEFAULT_CONSUMERS)
  const [search, setSearch] = useState('')

  const filtered = consumers.filter((c) =>
    search ? c.groupId.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isDark ? 'text-indigo-400' : 'text-indigo-700'
              }`}
            >
              Consumer Topology
            </span>
          </div>
          <h1
            className={`font-display text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Consumer Groups
          </h1>
          <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Active Cluster: <span className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{cluster?.name || 'local'}</span>
          </div>
        </div>
      </div>

      {/* Overview stats */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Active Consumer Groups</span>
            <Users size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {consumers.length}
          </div>
          <div className={`text-[11px] mt-2 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All groups active and balanced
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Assigned Stream Workers</span>
            <Activity size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            13
          </div>
          <div className={`text-[11px] mt-2 font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Cooperative sticky assignor
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Aggregate Stream Lag</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            2 events
          </div>
          <div className={`text-[11px] mt-2 ${isDark ? 'text-emerald-400/80' : 'text-emerald-700 font-medium'}`}>
            Zero critical processing backlog
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative w-full sm:w-80">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-mist-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search consumer group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-500 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500'
            }`}
          />
        </div>
      </div>

      {/* Consumers Table */}
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
                <th className="px-5 py-3.5">Group ID</th>
                <th className="px-5 py-3.5">Rebalance State</th>
                <th className="px-5 py-3.5">Assigned Workers</th>
                <th className="px-5 py-3.5">Partitions Covered</th>
                <th className="px-5 py-3.5">Target Streams</th>
                <th className="px-5 py-3.5 text-right">Stream Lag</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono text-xs ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {filtered.map((c) => (
                <tr
                  key={c.groupId}
                  className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                >
                  <td className={`px-5 py-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.groupId}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] border font-sans font-medium ${
                        isDark
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-bold ${isDark ? 'text-mist-200' : 'text-slate-800'}`}>{c.membersCount}</td>
                  <td className={`px-5 py-4 ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>{c.partitionsCovered}</td>
                  <td className={`px-5 py-4 font-sans ${isDark ? 'text-cyan-300' : 'text-indigo-600 font-medium'}`}>
                    {c.topics.join(', ')}
                  </td>
                  <td className={`px-5 py-4 text-right font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {c.totalLag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
