import { useMemo, useState } from 'react'
import { Gauge, Square, Zap, Activity } from 'lucide-react'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

const TOPIC_NAMES = ['sales', 'inventory', 'checkout', 'pos/1', 'pos/2', 'alerts']
const PRESET_RATES = [50, 100, 250, 500]

export default function LoadTest({ connected, running, onStart, onStop }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [store, setStore] = useState('6339')
  const [rate, setRate] = useState(100)
  const [topicCount, setTopicCount] = useState(6)

  const topics = useMemo(
    () => TOPIC_NAMES.slice(0, topicCount).map((name) => `store/${store}/${name}`),
    [store, topicCount]
  )

  return (
    <div className={`border-t p-3.5 transition-colors ${isDark ? 'border-white/[0.06] bg-[#0c0e18]/40' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
            running
              ? isDark ? 'border-amber-500/30 bg-amber-500/20 text-amber-300 animate-pulse' : 'border-amber-300 bg-amber-100 text-amber-700 animate-pulse'
              : isDark ? 'border-white/10 bg-white/5 text-mist-400' : 'border-slate-200 bg-white text-slate-600'
          }`}>
            <Gauge size={13} />
          </div>
          <span className="font-display text-xs font-bold tracking-tight">Load Generator</span>
        </div>

        {running && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${
            isDark
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              : 'border-amber-300 bg-amber-100 text-amber-800'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            {rate} msg/s active
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className={`text-[10px] font-mono uppercase font-semibold ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
          Store
          <input
            value={store}
            disabled={running}
            onChange={(e) => setStore(e.target.value.replace(/[^\w-]/g, ''))}
            className={`mt-1 w-full rounded-xl border px-2.5 py-1.5 font-mono text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500/60'
                : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
            }`}
          />
        </label>

        <label className={`text-[10px] font-mono uppercase font-semibold ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
          Topics
          <select
            value={topicCount}
            disabled={running}
            onChange={(e) => setTopicCount(Number(e.target.value))}
            className={`mt-1 w-full rounded-xl border px-2 py-1.5 text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-[#0c0e18] text-white focus:border-indigo-500/60'
                : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
            }`}
          >
            <option value={4}>4 topics</option>
            <option value={5}>5 topics</option>
            <option value={6}>6 topics</option>
          </select>
        </label>

        <label className={`text-[10px] font-mono uppercase font-semibold ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
          Rate /sec
          <input
            type="number"
            min={10}
            max={500}
            value={rate}
            disabled={running}
            onChange={(e) => setRate(Number(e.target.value))}
            className={`mt-1 w-full rounded-xl border px-2.5 py-1.5 font-mono text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500/60'
                : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
            }`}
          />
        </label>
      </div>

      {/* Preset rate buttons */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`text-[10px] font-mono mr-0.5 ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>Rate:</span>
        {PRESET_RATES.map((r) => (
          <button
            key={r}
            type="button"
            disabled={running}
            onClick={() => setRate(r)}
            className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium transition-all ${
              rate === r
                ? 'border-indigo-500/50 bg-indigo-600 text-white'
                : isDark
                ? 'border-white/5 bg-white/[0.03] text-mist-400 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {r}/s
          </button>
        ))}
      </div>

      {/* Target topic badges */}
      <div className="mt-2 flex flex-wrap gap-1">
        {topics.map((t) => (
          <span
            key={t}
            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] border ${
              isDark
                ? 'border-white/5 bg-white/[0.03] text-mist-300'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {t.replace(`store/${store}/`, '')}
          </span>
        ))}
      </div>

      {/* Start / Stop trigger button */}
      <button
        type="button"
        onClick={() => (running ? onStop() : onStart({ store, rate, topics }))}
        className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold shadow-md transition-all active:scale-95 ${
          running
            ? 'bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-500'
            : isDark
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-amber-500/20 hover:brightness-110'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-amber-500/20 hover:brightness-105'
        }`}
      >
        {running ? (
          <>
            <Square size={13} />
            <span>Halt Load ({rate}/s)</span>
          </>
        ) : (
          <>
            <Zap size={13} />
            <span>Launch Traffic Burst ({topicCount} topics @ {rate}/s)</span>
          </>
        )}
      </button>
    </div>
  )
}

