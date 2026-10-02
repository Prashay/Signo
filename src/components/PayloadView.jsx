import { useMemo, useState } from 'react'
import {
  Braces,
  FileText,
  Hexagon,
  Copy,
  Check,
  Clock,
  Database,
  Layers,
  Sparkles,
  Radio
} from 'lucide-react'
import { formatBytes, formatTime, tryPretty } from '../lib/mqttTree.js'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

const TABS = [
  { id: 'pretty', label: 'JSON Pretty', icon: Braces },
  { id: 'raw', label: 'Raw Payload', icon: FileText },
  { id: 'hex', label: 'Hex View', icon: Hexagon }
]

function hexDump(hex) {
  if (!hex) return ''
  const bytes = hex.match(/.{1,2}/g) || []
  const lines = []
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16)
    const addr = i.toString(16).padStart(8, '0')
    const hexPart = slice.join(' ').padEnd(47, ' ')
    const ascii = slice
      .map((b) => {
        const n = parseInt(b, 16)
        return n >= 32 && n <= 126 ? String.fromCharCode(n) : '.'
      })
      .join('')
    lines.push(`${addr}  ${hexPart}  ${ascii}`)
  }
  return lines.join('\n')
}

export default function PayloadView({ node, history }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [tab, setTab] = useState('pretty')
  const [picked, setPicked] = useState(0)
  const [copiedTopic, setCopiedTopic] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const messages = history || node?.messages || []
  const msg = messages[picked] || node?.latest

  const pretty = useMemo(() => tryPretty(msg?.payload?.text), [msg])

  const handleCopyTopic = () => {
    if (!node?.path) return
    navigator.clipboard.writeText(node.path)
    setCopiedTopic(true)
    setTimeout(() => setCopiedTopic(false), 2000)
  }

  const handleCopyPayload = () => {
    const textToCopy = tab === 'pretty' ? pretty.value : msg?.payload?.text || ''
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  if (!node) {
    return (
      <div
        className={`flex h-full flex-col items-center justify-center p-8 text-center transition-colors ${
          isDark ? 'bg-[#090b13] text-mist-300' : 'bg-slate-50 text-slate-600'
        }`}
      >
        <div
          className={`max-w-md rounded-3xl border p-8 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-[#0d101b]/80 shadow-panel'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isDark
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                : 'border-indigo-200 bg-indigo-50 text-indigo-600'
            }`}
          >
            <Radio size={24} className="animate-pulse" />
          </div>
          <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Select a Topic Node
          </h3>
          <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Click on any branch in the topic tree to inspect message schemas, real-time JSON payloads, QoS flags, and transmission history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col transition-colors border-r ${
        isDark ? 'bg-[#07090f] border-white/[0.06] text-mist-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Inspector Top Bar */}
      <div
        className={`border-b p-4 transition-colors ${
          isDark ? 'border-white/[0.06] bg-[#0c0e18]/40' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`rounded-lg px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                isDark
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700'
              }`}
            >
              Topic
            </span>
            <div className="font-mono text-sm font-semibold truncate select-all">{node.path}</div>
            <button
              onClick={handleCopyTopic}
              className={`rounded p-1 transition-colors ${
                isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Copy topic path"
            >
              {copiedTopic ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPayload}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                isDark
                  ? 'border-white/10 bg-white/5 text-mist-200 hover:bg-white/10 hover:text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {copiedPayload ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
            </button>
          </div>
        </div>

        {/* Metadata Telemetry Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span
            className={`rounded-md px-2 py-0.5 border ${
              isDark ? 'border-white/5 bg-white/[0.03] text-mist-300' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {node.count} packets received
          </span>

          {msg && (
            <>
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 border ${
                  isDark ? 'border-white/5 bg-white/[0.03] text-mist-300' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Clock size={11} className={isDark ? 'text-mist-400' : 'text-slate-400'} />
                {formatTime(msg.timestamp)}
              </span>

              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 border ${
                  isDark ? 'border-white/5 bg-white/[0.03] text-cyan-300' : 'border-indigo-100 bg-indigo-50 text-indigo-700'
                }`}
              >
                <Database size={11} />
                {formatBytes(msg.payload?.size || 0)}
              </span>

              <span
                className={`rounded-md px-2 py-0.5 font-sans font-semibold border ${
                  isDark
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-200 bg-indigo-100 text-indigo-800'
                }`}
              >
                QoS {msg.qos}
              </span>

              {msg.retain && (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400 font-medium">
                  Retained
                </span>
              )}

              {msg.dup && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-mist-400">
                  Duplicate
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex items-center gap-2 border-b px-4 py-2 select-none ${
          isDark ? 'border-white/[0.06] bg-[#090b13]' : 'border-slate-200 bg-slate-100/60'
        }`}
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? isDark
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : isDark
                  ? 'text-mist-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Payload Body + History Split */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_240px]">
        {/* Main Code View */}
        <div
          className={`min-h-0 overflow-auto p-4 font-mono text-xs leading-relaxed transition-colors ${
            isDark ? 'bg-[#090b14] text-mist-100' : 'bg-white text-slate-800'
          }`}
        >
          {!msg ? (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
              No payload content available for this frame.
            </div>
          ) : (
            <pre className="whitespace-pre font-mono">
              {tab === 'pretty' && pretty.value}
              {tab === 'raw' && (msg.payload?.text ?? '[binary payload]')}
              {tab === 'hex' && hexDump(msg.payload?.hex)}
            </pre>
          )}
        </div>

        {/* Message History Timeline */}
        <div
          className={`flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l ${
            isDark ? 'border-white/[0.06] bg-[#0c0e18]/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-3.5 py-2.5 ${
              isDark ? 'border-white/[0.04]' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock size={12} className={isDark ? 'text-mist-400' : 'text-slate-500'} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Payload History</span>
            </div>
            <span
              className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] ${
                isDark ? 'bg-white/5 text-mist-400' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {messages.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {messages.length === 0 && (
              <div className={`p-4 text-center text-xs ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
                No previous frames recorded.
              </div>
            )}
            {messages.map((m, i) => {
              const isSelected = i === picked
              return (
                <button
                  key={`${m.timestamp}-${i}`}
                  onClick={() => setPicked(i)}
                  className={`block w-full p-2.5 text-left transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-indigo-600/20 text-white border-l-2 border-indigo-500'
                        : 'bg-indigo-50 text-indigo-900 border-l-2 border-indigo-600'
                      : isDark
                      ? 'hover:bg-white/[0.03] text-mist-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-semibold">{formatTime(m.timestamp)}</span>
                    <span className="text-[10px] text-mist-500">{formatBytes(m.payload?.size || 0)}</span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] opacity-75">
                    {m.payload?.text || '[binary packet]'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

