import { useState } from 'react'
import { X, Server, RefreshCw, Terminal, CheckCircle2, AlertTriangle, ArrowRight, Copy, Check } from 'lucide-react'

export default function BridgeStatusModal({
  isOpen,
  onClose,
  bridge,
  bridgeUrl,
  onUpdateBridgeUrl,
  onRetry
}) {
  const [copiedCmd, setCopiedCmd] = useState('')
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState(null)
  const [customUrlInput, setCustomUrlInput] = useState(bridgeUrl || '')

  if (!isOpen) return null

  const handleCopy = (cmd) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(''), 2000)
  }

  const handleProbe = async () => {
    setProbing(true)
    setProbeResult(null)
    try {
      const res = await fetch('http://127.0.0.1:3900/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        setProbeResult({ ok: true, message: `Backend responded: ${JSON.stringify(data)}` })
      } else {
        setProbeResult({ ok: false, message: `HTTP status: ${res.status}` })
      }
    } catch (err) {
      setProbeResult({ ok: false, message: 'Could not reach http://127.0.0.1:3900. Process is not running.' })
    } finally {
      setProbing(false)
    }
  }

  const handleSaveUrl = () => {
    onUpdateBridgeUrl(customUrlInput)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] text-mist-100 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-pink-500/20 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                bridge === 'ready'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : bridge === 'offline'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}
            >
              <Server size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">WebSocket Bridge Status</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    bridge === 'ready'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : bridge === 'offline'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      bridge === 'ready' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                    }`}
                  />
                  {bridge === 'ready' ? 'Proxy Live (3900)' : 'Direct Web Mode Active'}
                </span>
              </div>
              <p className="text-xs text-mist-400 mt-0.5">
                {bridge === 'ready'
                  ? 'Local Node.js TCP/MQTT proxy process is online on port 3900'
                  : 'In-browser WebSockets engine active · No proxy needed for WSS brokers'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-mist-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Diagnostic Explanation */}
        <div className="mt-5 space-y-4 text-xs">
          {bridge === 'ready' ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <h4 className="font-semibold text-emerald-300 flex items-center gap-2 mb-1.5">
                <CheckCircle2 size={15} />
                <span>Local WebSocket TCP Proxy is Active</span>
              </h4>
              <p className="text-mist-200 leading-relaxed">
                Your browser is connected to the local Signo bridge process on port 3900. You can freely dial raw TCP MQTT brokers (ports 1883/8883) and Kafka clusters.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-2 mb-1.5">
                <CheckCircle2 size={15} />
                <span>Direct Web Mode is Active (No Proxy Required)</span>
              </h4>
              <p className="text-mist-200 leading-relaxed">
                Signo can connect directly to MQTT brokers using WebSockets (<code className="font-mono text-cyan-300">wss://</code> or <code className="font-mono text-cyan-300">ws://</code>). You can publish, subscribe, explore topic trees, and run load simulations right inside your browser without running any background server!
              </p>
            </div>
          )}

          {/* When is proxy needed? */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>When is the Local WebSocket Proxy needed?</span>
            </h4>
            <p className="text-mist-300 leading-relaxed">
              Standard web browsers cannot open raw TCP sockets to ports 1883 or 8883 due to browser security sandbox rules. If your broker does <strong>not</strong> support WebSockets and only listens on raw TCP, start the local Node.js proxy (<code className="font-mono text-indigo-300">server/index.js</code>) on port 3900.
            </p>
          </div>

          {/* Quick Start Commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-mist-400">
                To Enable Raw TCP (Ports 1883 / 8883)
              </span>
            </div>

            <div className="space-y-2">
              {/* Command 1: Server only */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090b10] px-3.5 py-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-mist-200">
                  <Terminal size={14} className="text-cyan-400 shrink-0" />
                  <span>npm run server</span>
                </div>
                <button
                  onClick={() => handleCopy('npm run server')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'npm run server' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCmd === 'npm run server' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Command 2: Full dev (client + server) */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090b10] px-3.5 py-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-mist-200">
                  <Terminal size={14} className="text-indigo-400 shrink-0" />
                  <span>npm run dev</span>
                </div>
                <button
                  onClick={() => handleCopy('npm run dev')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'npm run dev' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCmd === 'npm run dev' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-mist-400">
              Run in your terminal inside the <code className="font-mono text-mist-300">Signo</code> directory.
            </p>
          </div>

          {/* GitHub Pages note */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 text-[11px] text-mist-400 leading-relaxed">
            <strong className="text-mist-200">GitHub Pages / Static Hosting:</strong> When browsing online, Signo uses Direct Web Mode with WebSockets. If you have a custom remote bridge server, you can configure its URL below.
          </div>

          {/* Custom Bridge URL override */}
          <div className="pt-2 border-t border-white/[0.08]">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-mist-400 mb-1.5">
              Custom WebSocket Bridge Endpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ws://127.0.0.1:3900/ws (default: auto)"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-[#090b10] px-3 py-1.5 font-mono text-xs text-white placeholder:text-mist-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleSaveUrl}
                className="rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Probe Test Result */}
          {probeResult && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                probeResult.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {probeResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{probeResult.ok ? 'Backend is Running!' : 'Backend Unreachable'}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">{probeResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={handleProbe}
            disabled={probing}
            className="flex items-center gap-1.5 text-xs text-mist-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={probing ? 'animate-spin' : ''} />
            <span>{probing ? 'Probing port 3900...' : 'Probe Local Server'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-medium text-mist-300 hover:bg-white/5 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                onRetry()
                handleProbe()
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:brightness-110 transition-all"
            >
              <RefreshCw size={12} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
