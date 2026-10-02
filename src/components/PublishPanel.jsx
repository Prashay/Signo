import { useState } from 'react'
import { Send, Sparkles, Check, Hash, CornerDownLeft } from 'lucide-react'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

const TEMPLATES = [
  {
    name: 'IoT Telemetry',
    topic: 'sensors/device-01/telemetry',
    payload: JSON.stringify(
      {
        deviceId: 'iot-sensor-01',
        temperature: 23.8,
        humidity: 49.2,
        battery: 94,
        ts: Date.now()
      },
      null,
      2
    )
  },
  {
    name: 'POS Order',
    topic: 'store/6339/sales',
    payload: JSON.stringify(
      {
        orderId: 'ORD-5481',
        store: '6339',
        cashier: 'terminal-2',
        total: 124.5,
        itemsCount: 4
      },
      null,
      2
    )
  },
  {
    name: 'Device Ping',
    topic: 'system/ping',
    payload: JSON.stringify(
      {
        status: 'UP',
        uptimeSec: 3600,
        firmware: 'v2.4.1'
      },
      null,
      2
    )
  }
]

export default function PublishPanel({ connected, onPublish }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [topic, setTopic] = useState('studio/hello')
  const [payload, setPayload] = useState('{\n  "message": "Hello from MQTT Studio",\n  "status": "ready"\n}')
  const [qos, setQos] = useState(0)
  const [retain, setRetain] = useState(false)
  const [sentFeedback, setSentFeedback] = useState(false)

  const formatJson = () => {
    try {
      const parsed = JSON.parse(payload)
      setPayload(JSON.stringify(parsed, null, 2))
    } catch {
      // not valid JSON, ignore
    }
  }

  const applyTemplate = (t) => {
    setTopic(t.topic)
    setPayload(t.payload)
  }

  const submit = (e) => {
    if (e) e.preventDefault()
    if (!topic.trim()) return
    onPublish({ topic: topic.trim(), payload, qos: Number(qos), retain })
    setSentFeedback(true)
    setTimeout(() => setSentFeedback(false), 1500)
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (connected) submit()
    }
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-3.5 py-3 ${
          isDark ? 'border-white/[0.06] bg-[#0c0e18]/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Send size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          <span className="font-display text-xs font-bold tracking-tight">Publish Payload</span>
        </div>
        <button
          type="button"
          onClick={formatJson}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
            isDark
              ? 'bg-white/5 text-mist-300 hover:bg-white/10 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Format JSON"
        >
          <Sparkles size={10} /> Format
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
        {/* Quick templates */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-mono mr-0.5 ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
            Preset:
          </span>
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-all ${
                isDark
                  ? 'border-white/5 bg-white/[0.03] text-mist-300 hover:border-indigo-500/40 hover:text-white hover:bg-white/5'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Topic Input */}
        <div>
          <label className={`block mb-1 text-[10px] font-mono uppercase font-semibold ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Target Topic
          </label>
          <div className="relative">
            <Hash size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-mist-500' : 'text-slate-400'}`} />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. sensors/temperature/living_room"
              className={`w-full rounded-xl border py-1.5 pl-8 pr-3 font-mono text-xs outline-none transition-all ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-600 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                  : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Payload text area */}
        <div className="flex flex-1 min-h-0 flex-col">
          <label className={`block mb-1 text-[10px] font-mono uppercase font-semibold ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Payload (JSON / String)
          </label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`min-h-0 flex-1 resize-none rounded-xl border p-3 font-mono text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-mist-100 placeholder-mist-600 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Footer controls: QoS, Retain, Send */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-white/5">
          <div className="flex items-center gap-3">
            {/* QoS segmented pills */}
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-mono mr-1 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>QoS:</span>
              {[0, 1, 2].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setQos(lvl)}
                  className={`h-6 w-6 rounded-md text-xs font-mono font-bold transition-all ${
                    qos === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-white/5 text-mist-400 hover:text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Retain checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={retain}
                onChange={(e) => setRetain(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span className={`text-[11px] font-medium ${isDark ? 'text-mist-300' : 'text-slate-700'}`}>Retain</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!connected}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              sentFeedback
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-indigo-600/30'
            }`}
          >
            {sentFeedback ? (
              <>
                <Check size={13} />
                <span>Sent!</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Publish</span>
                <span className="hidden sm:inline text-[10px] opacity-75 ml-0.5">⌘↵</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

