import { useEffect, useState } from 'react'
import {
  X,
  PlugZap,
  Shield,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Upload,
  Key,
  FileKey,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react'
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
  tls: false,
  validateCertificate: true,
  rejectUnauthorized: true,
  caCert: '',
  clientCert: '',
  clientKey: '',
  keyPassphrase: '',
  subscriptions: [{ topic: '#', qos: 0 }]
}

export default function ConnectModal({ open, initial, onClose, onSave }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [form, setForm] = useState(initial || emptyForm)
  const [view, setView] = useState('general') // 'general' | 'advanced'
  const [subTopic, setSubTopic] = useState('#')
  const [subQos, setSubQos] = useState(0)

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyForm, ...initial } : emptyForm)
      setView('general')
    }
  }, [open, initial])

  if (!open) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const applyPreset = (preset) => {
    const isTls = preset.protocol === 'mqtts' || preset.protocol === 'wss'
    setForm({
      ...emptyForm,
      ...preset,
      tls: isTls,
      validateCertificate: true,
      rejectUnauthorized: true,
      clientId: `mqtt-studio-${Math.random().toString(16).slice(2, 8)}`
    })
  }

  const handleTlsToggle = (isTls) => {
    setForm((f) => {
      let nextProto = f.protocol
      let nextPort = f.port

      if (isTls) {
        if (nextProto === 'mqtt') nextProto = 'mqtts'
        if (nextProto === 'ws') nextProto = 'wss'
        if (nextPort === 1883) nextPort = 8883
        if (nextPort === 8083) nextPort = 8084
      } else {
        if (nextProto === 'mqtts') nextProto = 'mqtt'
        if (nextProto === 'wss') nextProto = 'ws'
        if (nextPort === 8883) nextPort = 1883
        if (nextPort === 8084) nextPort = 8083
      }

      return {
        ...f,
        tls: isTls,
        protocol: nextProto,
        port: nextPort
      }
    })
  }

  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        set(field, content)
      }
    }
    reader.readAsText(file)
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

  const hasCerts = Boolean(form.caCert || form.clientCert || form.clientKey)

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
              {view === 'advanced' ? <Shield size={16} /> : <PlugZap size={16} />}
            </div>
            <div>
              <h2 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {view === 'advanced'
                  ? 'Advanced TLS & Certificate Options'
                  : initial
                  ? 'Edit MQTT Connection'
                  : 'Add MQTT Connection'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                {view === 'advanced'
                  ? 'Configure CA server certificate, client certificate, and private key (mTLS)'
                  : 'Configure broker endpoints, TLS encryption, authentication, and topics'}
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

        {/* View Switcher: General Connection Form vs Advanced Certificates Form */}
        {view === 'advanced' ? (
          /* ============================================================== */
          /* ADVANCED CERTIFICATE OPTIONS VIEW                             */
          /* ============================================================== */
          <div className="p-6 space-y-5">
            {/* Top Navigation Bar with Back Button */}
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-white/[0.06]' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setView('general')}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'border-white/10 bg-white/[0.03] text-mist-200 hover:bg-white/[0.08] hover:text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <ArrowLeft size={14} />
                <span>Back to Connection Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${
                    form.tls
                      ? isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isDark
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <Lock size={10} />
                  <span>{form.tls ? 'TLS Enabled' : 'Plaintext Mode'}</span>
                </span>
              </div>
            </div>

            {/* 1. CA Server Certificate */}
            <div
              className={`rounded-2xl border p-4 transition-colors ${
                isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <FileKey size={14} className="text-cyan-400" />
                  <span>CA Server Certificate</span>
                </label>
                <div className="flex items-center gap-2">
                  {form.caCert && (
                    <button
                      type="button"
                      onClick={() => set('caCert', '')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <label className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Upload size={12} />
                    <span>Upload CA File (.crt / .pem / .ca)</span>
                    <input
                      type="file"
                      accept=".crt,.pem,.ca,.cer"
                      className="sr-only"
                      onChange={(e) => handleFileUpload(e, 'caCert')}
                    />
                  </label>
                </div>
              </div>
              <textarea
                rows={3}
                value={form.caCert || ''}
                onChange={(e) => set('caCert', e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDXTCCAkWgAwIBAgIJAP...&#10;-----END CERTIFICATE-----"
                className={`w-full font-mono text-xs rounded-xl border p-3 outline-none transition-all leading-relaxed ${
                  isDark
                    ? 'border-white/10 bg-[#070a14] text-cyan-300 placeholder-mist-600 focus:border-indigo-500'
                    : 'border-slate-300 bg-white text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
                }`}
              />
              <p className={`mt-1 text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                Custom Root Certificate Authority to verify self-signed or private enterprise MQTT brokers.
              </p>
            </div>

            {/* 2. Client Certificate */}
            <div
              className={`rounded-2xl border p-4 transition-colors ${
                isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Client Certificate (Public Cert)</span>
                </label>
                <div className="flex items-center gap-2">
                  {form.clientCert && (
                    <button
                      type="button"
                      onClick={() => set('clientCert', '')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <label className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Upload size={12} />
                    <span>Upload Client Cert (.crt / .pem)</span>
                    <input
                      type="file"
                      accept=".crt,.pem,.cer"
                      className="sr-only"
                      onChange={(e) => handleFileUpload(e, 'clientCert')}
                    />
                  </label>
                </div>
              </div>
              <textarea
                rows={3}
                value={form.clientCert || ''}
                onChange={(e) => set('clientCert', e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIICrDCCAZSgAwIBAg...&#10;-----END CERTIFICATE-----"
                className={`w-full font-mono text-xs rounded-xl border p-3 outline-none transition-all leading-relaxed ${
                  isDark
                    ? 'border-white/10 bg-[#070a14] text-emerald-300 placeholder-mist-600 focus:border-indigo-500'
                    : 'border-slate-300 bg-white text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
                }`}
              />
              <p className={`mt-1 text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                Client public certificate passed to the broker for mutual TLS (mTLS) authentication.
              </p>
            </div>

            {/* 3. Client Key */}
            <div
              className={`rounded-2xl border p-4 transition-colors ${
                isDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Key size={14} className="text-purple-400" />
                  <span>Client Private Key</span>
                </label>
                <div className="flex items-center gap-2">
                  {form.clientKey && (
                    <button
                      type="button"
                      onClick={() => set('clientKey', '')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <label className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Upload size={12} />
                    <span>Upload Private Key (.key / .pem)</span>
                    <input
                      type="file"
                      accept=".key,.pem"
                      className="sr-only"
                      onChange={(e) => handleFileUpload(e, 'clientKey')}
                    />
                  </label>
                </div>
              </div>
              <textarea
                rows={3}
                value={form.clientKey || ''}
                onChange={(e) => set('clientKey', e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEowIBAAKCAQEA...&#10;-----END RSA PRIVATE KEY-----"
                className={`w-full font-mono text-xs rounded-xl border p-3 outline-none transition-all leading-relaxed ${
                  isDark
                    ? 'border-white/10 bg-[#070a14] text-purple-300 placeholder-mist-600 focus:border-indigo-500'
                    : 'border-slate-300 bg-white text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
                }`}
              />
              <p className={`mt-1 text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                Private cryptographic key corresponding to the client certificate.
              </p>
            </div>

            {/* 4. Key Passphrase */}
            <div>
              <Field label="Key Passphrase (Optional)" isDark={isDark}>
                <input
                  type="password"
                  value={form.keyPassphrase || ''}
                  onChange={(e) => set('keyPassphrase', e.target.value)}
                  placeholder="Enter passphrase if key is encrypted"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* GENERAL CONNECTION SETTINGS VIEW                              */
          /* ============================================================== */
          <>
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
                <select
                  value={form.protocol}
                  onChange={(e) => {
                    const proto = e.target.value
                    const isTls = proto === 'mqtts' || proto === 'wss'
                    setForm((f) => ({
                      ...f,
                      protocol: proto,
                      tls: isTls,
                      port: isTls ? (proto === 'wss' ? 8084 : 8883) : (proto === 'ws' ? 8083 : 1883)
                    }))
                  }}
                  className={selectClass}
                >
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

            {/* Security, TLS & Certificate Options Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-2 border-t ${
                isDark ? 'border-white/[0.04]' : 'border-slate-100'
              }`}
            >
              <div className="flex flex-wrap items-center gap-5 text-xs">
                {/* 1. Encryption (TLS) Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.tls || form.protocol === 'mqtts' || form.protocol === 'wss')}
                    onChange={(e) => handleTlsToggle(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <Lock
                      size={13}
                      className={
                        form.tls || form.protocol === 'mqtts' || form.protocol === 'wss'
                          ? 'text-cyan-400'
                          : isDark ? 'text-mist-500' : 'text-slate-400'
                      }
                    />
                    <span className={form.tls ? 'text-indigo-400 font-semibold' : ''}>
                      Encryption (TLS)
                    </span>
                  </div>
                </label>

                {/* 2. Validate Certificate Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.validateCertificate !== false && form.rejectUnauthorized !== false}
                    onChange={(e) => {
                      const val = e.target.checked
                      setForm((f) => ({ ...f, validateCertificate: val, rejectUnauthorized: val }))
                    }}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck
                      size={13}
                      className={
                        form.validateCertificate !== false && form.rejectUnauthorized !== false
                          ? 'text-emerald-400'
                          : isDark ? 'text-mist-500' : 'text-slate-400'
                      }
                    />
                    <span>Validate Certificate</span>
                  </div>
                </label>

                {/* Clean Session Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.clean !== false}
                    onChange={(e) => set('clean', e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <span className={isDark ? 'text-mist-300' : 'text-slate-600'}>Clean Session</span>
                </label>
              </div>

              {/* Advance Option Button */}
              <button
                type="button"
                onClick={() => setView('advanced')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  hasCerts
                    ? isDark
                      ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200'
                      : 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : isDark
                    ? 'border-white/10 bg-white/[0.03] text-mist-300 hover:border-indigo-500/40 hover:bg-white/[0.08] hover:text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                }`}
                title="Add custom CA server certificate, client certificate, and client key"
              >
                <Shield size={13} className={hasCerts ? 'text-indigo-400' : ''} />
                <span>Advance Option: Add Certificate</span>
                {hasCerts && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <ChevronRight size={13} />
              </button>
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
                      className="rounded-full p-0.5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
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
                  className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs'
                  }`}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between border-t px-6 py-4 ${
            isDark ? 'border-white/[0.06] bg-[#090b12]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {view === 'advanced' ? (
            <button
              type="button"
              onClick={() => setView('general')}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-mist-200 hover:bg-white/[0.08] hover:text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'text-mist-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Save & Connect
            </button>
          </div>
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
