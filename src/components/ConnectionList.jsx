import { Plus, Plug, Trash2, WifiOff, Server, Radio, ChevronRight } from 'lucide-react'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

export default function ConnectionList({
  connections,
  activeId,
  onSelect,
  onAdd,
  onDisconnect,
  onConnect,
  onRemove
}) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  return (
    <div
      className={`flex h-full min-h-0 flex-col transition-colors border-r ${
        isDark ? 'bg-[#0a0d14] border-white/[0.06] text-mist-100' : 'bg-slate-50/70 border-slate-200 text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-3.5 py-3 ${
          isDark ? 'border-white/[0.06] bg-[#0c0e18]/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Server size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          <span className="font-display text-xs font-bold tracking-tight">Brokers Fleet</span>
          <span
            className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-semibold ${
              isDark ? 'bg-white/5 text-mist-400' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {connections.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus size={12} />
          <span>Add</span>
        </button>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1.5">
        {connections.length === 0 && (
          <div className="p-6 text-center">
            <Radio size={24} className={`mx-auto mb-2 ${isDark ? 'text-mist-600' : 'text-slate-400'}`} />
            <p className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
              No brokers added yet.
            </p>
            <button
              onClick={onAdd}
              className={`mt-3 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                isDark
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700'
              }`}
            >
              <Plus size={12} /> Connect Broker
            </button>
          </div>
        )}

        {connections.map((c) => {
          const active = c.id === activeId
          const isConnected = c.status === 'connected'
          const isConnecting = c.status === 'connecting'
          const isError = c.status === 'error'

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer ${
                active
                  ? isDark
                    ? 'border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 shadow-sm'
                    : 'border-indigo-300 bg-indigo-50/60 shadow-xs'
                  : isDark
                    ? 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                    : 'border-slate-200/70 bg-white hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60 animate-pulse'
                          : isConnecting
                          ? 'bg-amber-400 animate-ping'
                          : isError
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span
                      className={`truncate text-xs font-semibold ${
                        active
                          ? isDark ? 'text-white' : 'text-indigo-950 font-bold'
                          : isDark ? 'text-mist-200' : 'text-slate-800'
                      }`}
                    >
                      {c.name}
                    </span>
                  </div>

                  <div className={`mt-1 flex items-center gap-1 font-mono text-[10px] truncate ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    <span className="rounded bg-white/5 px-1 py-0.2 uppercase text-[9px]">
                      {c.protocol}
                    </span>
                    <span>{c.host}:{c.port}</span>
                  </div>
                </div>

                {c.tree?.count > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-medium border ${
                      isDark
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-800'
                    }`}
                  >
                    {c.tree.count}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-2.5 flex items-center justify-between border-t pt-2 transition-colors border-dashed border-white/5">
                <span
                  className={`text-[10px] font-mono capitalize ${
                    isConnected
                      ? 'text-emerald-500 font-medium'
                      : isConnecting
                      ? 'text-amber-400'
                      : isError
                      ? 'text-rose-400'
                      : isDark ? 'text-mist-500' : 'text-slate-400'
                  }`}
                >
                  {c.status}
                </span>

                <div className="flex items-center gap-1.5">
                  {isConnected || isConnecting ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDisconnect(c.id)
                      }}
                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                        isDark
                          ? 'border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                          : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <WifiOff size={10} /> Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onConnect(c.id)
                      }}
                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                        isDark
                          ? 'border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                          : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <Plug size={10} /> Connect
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(c.id)
                    }}
                    className={`rounded p-1 transition-colors ${
                      isDark
                        ? 'text-mist-500 hover:text-rose-400 hover:bg-rose-500/10'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title="Remove Broker"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

