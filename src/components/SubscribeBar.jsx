import { useState } from 'react'
import { Plus, Hash } from 'lucide-react'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

export default function SubscribeBar({ connected, onSubscribe }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [topic, setTopic] = useState('#')
  const [qos, setQos] = useState(0)

  return (
    <form
      className="flex gap-1.5 px-3 pb-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!topic.trim() || !connected) return
        onSubscribe(topic.trim(), Number(qos))
      }}
    >
      <div className="relative min-w-0 flex-1">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. sensors/# or pos/+"
          className={`w-full rounded-lg border py-1 pl-2.5 pr-2 font-mono text-[11px] outline-none transition-all ${
            isDark
              ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-600 focus:border-indigo-500/60'
              : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
          }`}
        />
      </div>

      <select
        value={qos}
        onChange={(e) => setQos(e.target.value)}
        className={`rounded-lg border px-2 py-1 font-mono text-[11px] outline-none ${
          isDark
            ? 'border-white/10 bg-[#0c0e18] text-white focus:border-indigo-500/60'
            : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
        }`}
      >
        <option value={0}>QoS 0</option>
        <option value={1}>QoS 1</option>
        <option value={2}>QoS 2</option>
      </select>

      <button
        type="submit"
        disabled={!connected}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isDark
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
        }`}
        title="Subscribe to topic filter"
      >
        <Plus size={12} />
        <span>Sub</span>
      </button>
    </form>
  )
}

