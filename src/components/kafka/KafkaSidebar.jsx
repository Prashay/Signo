import { useState } from 'react'
import {
  LayoutDashboard,
  Server,
  Layers,
  Users,
  ChevronDown,
  ChevronRight,
  Plus,
  Cpu,
  Activity,
  HardDrive,
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaSidebar({
  currentView,
  onSelectView,
  clusters = [],
  activeCluster,
  onSelectCluster,
  onNewCluster
}) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'
  const [clusterDropdown, setClusterDropdown] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'brokers', label: 'Broker Nodes', icon: Server, badge: activeCluster?.brokersCount ?? 1 },
    { id: 'topics', label: 'Stream Topics', icon: Layers, badge: activeCluster?.topicsCount ?? 0 },
    { id: 'consumers', label: 'Consumer Groups', icon: Users, badge: activeCluster?.consumersCount ?? 0 }
  ]

  return (
    <aside
      className={`flex w-64 flex-col border-r select-none transition-colors ${
        isDark
          ? 'border-white/[0.08] bg-[#0a0d14]/95 text-mist-300 backdrop-blur-xl'
          : 'border-slate-200 bg-white text-slate-700 shadow-sm'
      }`}
    >
      {/* Cluster Switcher Card */}
      <div className={`p-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setClusterDropdown(!clusterDropdown)}
            className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white hover:border-indigo-500/40 hover:bg-white/[0.06]'
                : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  isDark
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                <Zap size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`truncate font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeCluster?.name || 'local'}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <div className={`truncate text-[10px] font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  {activeCluster?.servers?.[0]?.host || 'localhost'}:{activeCluster?.servers?.[0]?.port || '8080'}
                </div>
              </div>
            </div>
            <ChevronDown size={14} className={`${isDark ? 'text-mist-500' : 'text-slate-400'} shrink-0 ml-1`} />
          </button>

          {/* Cluster Dropdown List */}
          {clusterDropdown && (
            <div
              className={`absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border p-1.5 shadow-2xl backdrop-blur-2xl space-y-1 ${
                isDark ? 'border-white/10 bg-[#121522]' : 'border-slate-200 bg-white text-slate-700 shadow-xl'
              }`}
            >
              <div className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
                Clusters
              </div>
              {clusters.map((c) => (
                <button
                  key={c.id || c.name}
                  type="button"
                  onClick={() => {
                    onSelectCluster(c)
                    setClusterDropdown(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                    activeCluster?.id === c.id
                      ? isDark
                        ? 'bg-indigo-600/20 text-indigo-200 font-medium'
                        : 'bg-indigo-50 text-indigo-700 font-semibold'
                      : isDark
                      ? 'text-mist-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.status === 'online' ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    />
                    <span>{c.name}</span>
                    {c.environment && (
                      <span className="rounded px-1 py-0.2 text-[8px] uppercase font-mono font-bold tracking-wider bg-white/10 opacity-75">
                        {c.environment}
                      </span>
                    )}
                  </div>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>{c.version}</span>
                </button>
              ))}

              <div className={`border-t pt-1 mt-1 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    onNewCluster()
                    setClusterDropdown(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isDark
                      ? 'text-indigo-300 hover:bg-indigo-600/20'
                      : 'text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Plus size={13} />
                  <span>Configure New Cluster</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className={`px-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-r from-indigo-600/25 to-violet-600/20 text-white border border-indigo-500/30 shadow-sm shadow-indigo-600/10'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                  : isDark
                  ? 'text-mist-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={15}
                  className={`transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-indigo-400'
                        : 'text-indigo-600'
                      : isDark
                      ? 'text-mist-400 group-hover:text-mist-200'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.2 font-mono text-[10px] ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-500/30 text-indigo-200'
                        : 'bg-indigo-200 text-indigo-800'
                      : isDark
                      ? 'bg-white/5 text-mist-400 group-hover:bg-white/10'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <div className={`pt-4 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
          Management
        </div>

        <button
          type="button"
          onClick={() => onSelectView('config')}
          className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            currentView === 'config'
              ? isDark
                ? 'bg-gradient-to-r from-indigo-600/25 to-violet-600/20 text-white border border-indigo-500/30 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
              : isDark
              ? 'text-mist-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Sliders
            size={15}
            className={
              currentView === 'config'
                ? isDark
                  ? 'text-indigo-400'
                  : 'text-indigo-600'
                : isDark
                ? 'text-mist-400'
                : 'text-slate-400'
            }
          />
          <span>Cluster Settings</span>
        </button>
      </div>

      {/* Cluster Live Resource Telemetry Widget */}
      <div className={`p-3 border-t ${isDark ? 'border-white/[0.06] bg-black/20' : 'border-slate-200 bg-slate-50/80'}`}>
        <div
          className={`rounded-xl border p-3 space-y-2.5 ${
            isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
              <Cpu size={12} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} /> Engine Load
            </span>
            <span className={`font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700 font-semibold'}`}>18%</span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <div className="h-full w-[18%] rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
              <ShieldCheck size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} /> Controller
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'}`}>
              Leader (ID:1)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewCluster}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:brightness-110 active:scale-[0.99] transition-all"
        >
          <Plus size={14} />
          <span>Connect New Cluster</span>
        </button>
      </div>
    </aside>
  )
}
