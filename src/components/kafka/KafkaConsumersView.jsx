import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, CheckCircle2, Search, RefreshCw } from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaConsumersView({ cluster }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'
  const [consumers, setConsumers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadConsumers = useCallback(async () => {
    if (!cluster) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/kafka/consumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Unable to load Kafka consumer groups')
      setConsumers(Array.isArray(data.groups) ? data.groups : [])
    } catch (err) {
      setError(err.message || 'Unable to load Kafka consumer groups')
      setConsumers([])
    } finally {
      setLoading(false)
    }
  }, [cluster])

  useEffect(() => {
    loadConsumers()
  }, [loadConsumers])

  const filtered = useMemo(() => consumers.filter((c) =>
    search ? String(c.groupId).toLowerCase().includes(search.toLowerCase()) : true
  ), [consumers, search])

  const activeMembers = consumers.reduce((sum, c) => sum + Number(c.membersCount || 0), 0)
  const aggregateLag = consumers.reduce((sum, c) => sum + Number(c.totalLag || 0), 0)

  return (
    <div className={`flex-1 overflow-y-auto p-8 ${isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Consumer Topology</span>
          </div>
          <h1 className={`font-display text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Consumer Groups</h1>
          <div className={`mt-0.5 text-xs font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Cluster: <span className="font-semibold text-indigo-600">{cluster?.name || 'local'}</span></div>
        </div>
        <button onClick={loadConsumers} disabled={loading} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-mist-200' : 'border-slate-200 bg-white text-slate-700'}`}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className={`mb-5 rounded-lg border px-4 py-3 text-xs ${isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{error}</div>}

      <div className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-4 ${isDark ? 'border-white/[0.08] bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
          <div className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Consumer Groups</div>
          <div className={`mt-2 font-mono text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{consumers.length}</div>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'border-white/[0.08] bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
          <div className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Active Consumers</div>
          <div className={`mt-2 font-mono text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeMembers}</div>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'border-white/[0.08] bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
          <div className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Aggregate Consumer Lag</div>
          <div className={`mt-2 flex items-center gap-2 font-mono text-2xl font-semibold ${aggregateLag ? 'text-amber-500' : 'text-emerald-500'}`}>
            {aggregateLag}{!aggregateLag && <CheckCircle2 size={16} />}
          </div>
        </div>
      </div>

      <div className="mb-5 relative w-full sm:w-96">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-mist-500' : 'text-slate-400'}`} />
        <input
          type="text"
          placeholder="Search by Consumer Group ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-900'}`}
        />
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/[0.08] bg-[#0c0e18]' : 'border-slate-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] ${isDark ? 'border-white/[0.08] bg-white/[0.02] text-mist-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <tr>
                <th className="px-5 py-3.5">Group ID</th>
                <th className="px-5 py-3.5">Num Of Members</th>
                <th className="px-5 py-3.5">Num Of Topics</th>
                <th className="px-5 py-3.5">Consumer Lag</th>
                <th className="px-5 py-3.5">Coordinator</th>
                <th className="px-5 py-3.5">State</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={`px-5 py-12 text-center ${isDark ? 'text-mist-400' : 'text-slate-400'}`}>No consumer groups found.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.groupId} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                  <td className={`px-5 py-4 font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.groupId}</td>
                  <td className="px-5 py-4 font-mono">{c.membersCount}</td>
                  <td className="px-5 py-4 font-mono">{c.topicsCount ?? 0}</td>
                  <td className={`px-5 py-4 font-mono ${Number(c.totalLag || 0) ? 'text-amber-500' : 'text-slate-500'}`}>{c.totalLag ?? 0}</td>
                  <td className="px-5 py-4 font-mono">{c.coordinator ?? 'N/A'}</td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-[10px] ${String(c.status).toUpperCase() === 'STABLE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
