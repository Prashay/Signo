import { useEffect, useState } from 'react'
import { X, PlugZap, Server, Shield, Globe, Layers, Plus } from 'lucide-react'
import { PRESETS } from '../lib/mqttTree.js'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

const emptyForm = {
  name: 'New connection',
  protocol: 'mqtt',
  host: 'broker.emqx.io',
  port: 1883,
  path: '',
  clientId: '',
  username: '',
  password: '',
  keepalive: 60,
  clean: true,
  protocolVersion: 4,
  rejectUnauthorized: true,
  subscriptions: [{ topic: '#', qos: 0 }]
}

export default function ConnectModal({ open, initial, onClose, onSave }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [form, setForm] = useState(initial || emptyForm)
  const [subTopic, setSubTopic] = useState('#')
  const [subQos, setSubQos] = useState(0)

  useEffect(() => {
    if (open) setForm(initial || emptyForm)
  }, [open, initial])

  if (!open) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const applyPreset = (preset) => {
    setForm({ ...emptyForm, ...preset, clientId: `mqtt-studio-${Math.random().toString(16).slice(2, 8)}` })
  }

  const addSub = () => {
    if (!subTopic.trim()) return
    setForm((f) => ({
      ...f,
      subscriptions: [...(f.subscriptions || []), { topic: subTopic.trim(), qos: Number(subQos) }]
    }))
    setSubTopic('')
  }

  const removeSub = (i) => {
    setForm((f) => ({ ...f, subscriptions: f.subscriptions.filter((_, idx) => idx !== i) }))
  }

  const inputClass = `w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
    isDark
      ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500/60 focus:bg-white/[0.05]'
      : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
  }`

  const selectClass = `w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
    isDark
      ? 'border-white/10 bg-[#0c0e18] text-white focus:border-indigo-500/60'
      : 'border-slate-200 bg-white text-slate-900 shadow-2xs focus:border-indigo-500'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'border-white/[0.08] bg-[#0c0e18] text-mist-100 shadow-indigo-950/40'
            : 'border-slate-200 bg-white text-slate-800 shadow-slate-300'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <PlugZap size={16} />
            </div>
            <div>
              <h2 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {initial ? 'Edit MQTT Connection' : 'Add MQTT Connection'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                Configure broker endpoints, authentication, and subscribed topic filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-1.5 transition-colors ${
              isDark ? 'text-mist-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Public Presets */}
        <div className={`px-6 pt-4 pb-1 border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
          <div className={`mb-2 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
            Quick Presets
          </div>
          <div className="flex flex-wrap gap-2 pb-3">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/[0.02] text-mist-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-900 shadow-2xs'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-6">
          <Field label="Connection Name" isDark={isDark}>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
          </Field>

          <Field label="Protocol" isDark={isDark}>
            <select value={form.protocol} onChange={(e) => set('protocol', e.target.value)} className={selectClass}>
              <option value="mqtt">mqtt (TCP Direct)</option>
              <option value="mqtts">mqtts (TLS Encrypted)</option>
              <option value="ws">ws (WebSocket)</option>
              <option value="wss">wss (Secure WebSocket)</option>
            </select>
          </Field>

          <Field label="Host Address" isDark={isDark}>
            <input value={form.host} onChange={(e) => set('host', e.target.value)} className={`${inputClass} font-mono`} />
          </Field>

          <Field label="Port" isDark={isDark}>
            <input
              type="number"
              value={form.port}
              onChange={(e) => set('port', Number(e.target.value))}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field label="Client ID" isDark={isDark}>
            <input value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className={`${inputClass} font-mono`} />
          </Field>

          <Field label="Keepalive (seconds)" isDark={isDark}>
            <input
              type="number"
              value={form.keepalive}
              onChange={(e) => set('keepalive', Number(e.target.value))}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field label="Username (Optional)" isDark={isDark}>
            <input value={form.username} onChange={(e) => set('username', e.target.value)} className={inputClass} />
          </Field>

          <Field label="Password (Optional)" isDark={isDark}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="MQTT Protocol Version" isDark={isDark}>
            <select
              value={form.protocolVersion}
              onChange={(e) => set('protocolVersion', Number(e.target.value))}
              className={selectClass}
            >
              <option value={4}>MQTT 3.1.1 (Standard)</option>
              <option value={5}>MQTT 5.0 (Enhanced)</option>
              <option value={3}>MQTT 3.1 (Legacy)</option>
            </select>
          </Field>

          <Field label="Path (for ws / wss)" isDark={isDark}>
            <input value={form.path || ''} onChange={(e) => set('path', e.target.value)} placeholder="/mqtt" className={`${inputClass} font-mono`} />
          </Field>
        </div>

        {/* Security / Session Checkboxes */}
        <div className={`flex flex-wrap items-center gap-6 px-6 pb-4 text-xs ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.clean} onChange={(e) => set('clean', e.target.checked)} className="rounded accent-indigo-600" />
            <span className="font-medium">Clean Session</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.rejectUnauthorized !== false}
              onChange={(e) => set('rejectUnauthorized', e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span className="font-medium">Verify TLS Certificate</span>
          </label>
        </div>

        {/* Subscriptions section */}
        <div className={`border-t px-6 py-4 ${isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className={`mb-2 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
            Initial Subscriptions
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {(form.subscriptions || []).map((s, i) => (
              <span
                key={`${s.topic}-${i}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                  isDark
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-800'
                }`}
              >
                <span>{s.topic} (QoS {s.qos})</span>
                <button
                  type="button"
                  onClick={() => removeSub(i)}
                  className="rounded-full p-0.5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={subTopic}
              onChange={(e) => setSubTopic(e.target.value)}
              className={`flex-1 ${inputClass} font-mono`}
              placeholder="e.g. store/# or telemetry/+"
            />
            <select value={subQos} onChange={(e) => setSubQos(e.target.value)} className={`w-28 ${selectClass}`}>
              <option value={0}>QoS 0</option>
              <option value={1}>QoS 1</option>
              <option value={2}>QoS 2</option>
            </select>
            <button
              type="button"
              onClick={addSub}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs'
              }`}
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-end gap-2.5 border-t px-6 py-4 ${
            isDark ? 'border-white/[0.06] bg-[#090b12]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              isDark ? 'text-mist-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, isDark }) {
  return (
    <label className="block">
      <span className={`mb-1 block text-[11px] font-medium ${isDark ? 'text-mist-300' : 'text-slate-700'}`}>
        {label}
      </span>
      {children}
    </label>
  )
}

