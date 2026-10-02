import { useState } from 'react'
import {
  Radio,
  Layers,
  Wifi,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Database,
  Activity,
  CheckCircle2,
  Gauge,
  Terminal,
  Server,
  Network,
  Binary
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'
import AppleWelcomeModal from './AppleWelcomeModal.jsx'

export default function SignoLandingPage({ onLaunchApp, mqttRate = 0 }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'
  const [showAppleWelcome, setShowAppleWelcome] = useState(false)

  return (
    <div
      className={`relative flex h-full w-full min-h-0 flex-col overflow-y-auto transition-colors select-none ${
        isDark ? 'bg-[#06080e] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Background Ambient Glow Nebulas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full blur-[140px] opacity-25 ${
            isDark ? 'bg-indigo-600' : 'bg-indigo-300'
          }`}
        />
        <div
          className={`absolute -top-20 right-1/4 h-[440px] w-[440px] rounded-full blur-[130px] opacity-20 ${
            isDark ? 'bg-purple-600' : 'bg-purple-300'
          }`}
        />
        <div
          className={`absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full blur-[150px] opacity-15 ${
            isDark ? 'bg-cyan-500' : 'bg-sky-300'
          }`}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className={`absolute inset-0 opacity-[0.03] ${
            isDark ? 'bg-[radial-gradient(#fff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000_1px,transparent_1px)]'
          } [background-size:24px_24px]`}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium backdrop-blur-md shadow-xs transition-all">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span
                className={`font-mono uppercase text-[10px] tracking-widest font-bold ${
                  isDark ? 'text-indigo-300' : 'text-indigo-700'
                }`}
              >
                Signo Enterprise Suite · v2.4
              </span>
            </div>

            <button
              onClick={() => setShowAppleWelcome(true)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
              title="Experience Apple Welcome animation"
            >
              <Sparkles size={12} className="text-indigo-400" />
              <span>Apple Welcome Experience</span>
            </button>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl font-display">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Signo
            </span>
          </h1>

          <p
            className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-mist-400' : 'text-slate-600'
            }`}
          >
            A high-performance unified console for real-time message brokers and event streaming
            architectures. Select an application workspace below to begin.
          </p>

          {/* Quick telemetry indicators */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-mist-300'
                  : 'border-slate-200 bg-white text-slate-700 shadow-2xs'
              }`}
            >
              <Server size={12} className="text-indigo-500" />
              <span>Core Port: 7200</span>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-mist-300'
                  : 'border-slate-200 bg-white text-slate-700 shadow-2xs'
              }`}
            >
              <Network size={12} className="text-emerald-500" />
              <span>Target Node: 8080</span>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 ${
                isDark
                  ? 'border-white/10 bg-white/[0.03] text-mist-300'
                  : 'border-slate-200 bg-white text-slate-700 shadow-2xs'
              }`}
            >
              <ShieldCheck size={12} className="text-purple-500" />
              <span>Zero Remote Telemetry</span>
            </div>
          </div>
        </div>

        {/* The Two Main Application Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Card 1: MQTT Studio */}
          <div
            onClick={() => onLaunchApp('mqtt')}
            className={`group relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 backdrop-blur-xl ${
              isDark
                ? 'border-white/[0.08] bg-[#0c0f18]/80 hover:border-cyan-500/50 hover:bg-[#0f1320]/90 hover:shadow-cyan-500/10'
                : 'border-slate-200 bg-white/90 hover:border-cyan-500/60 hover:bg-white hover:shadow-cyan-500/10'
            }`}
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Radio size={28} className="text-white" />
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-4 ring-[#0c0f18] group-hover:animate-ping" />
                </div>

                <span
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                    isDark
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      : 'border-cyan-300 bg-cyan-50 text-cyan-800'
                  }`}
                >
                  IoT & Telemetry
                </span>
              </div>

              {/* Title & Description */}
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight font-display group-hover:text-cyan-400 transition-colors">
                    MQTT Studio
                  </h2>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                      isDark ? 'bg-white/10 text-mist-300' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    PRO
                  </span>
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-mist-300' : 'text-slate-600'
                  }`}
                >
                  Real-time broker explorer, searchable hierarchical topic trees, multi-mode payload
                  inspector (Pretty JSON, Raw, Hex), and simulated load generator.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Multi-broker fleet (EMQX, HiveMQ, Mosquitto, local)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Hierarchical topic tree with message counters & live search
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Interactive publisher with presets, QoS 0/1/2 & retain flags
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Store 6339 telemetry simulator (burst load up to 500+ msg/s)
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Footer Button */}
            <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-cyan-400" />
                <span className={`text-xs font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  {mqttRate > 0 ? (
                    <strong className="text-emerald-400 font-bold">{Math.round(mqttRate)} msg/s active</strong>
                  ) : (
                    'Bridge Ready (ws:3001)'
                  )}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 group-hover:scale-105 group-hover:brightness-110 transition-all">
                <span>Launch MQTT Studio</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Card 2: Kfkax */}
          <div
            onClick={() => onLaunchApp('kafka')}
            className={`group relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 backdrop-blur-xl ${
              isDark
                ? 'border-white/[0.08] bg-[#0d0d1c]/80 hover:border-purple-500/50 hover:bg-[#121124]/90 hover:shadow-purple-500/10'
                : 'border-slate-200 bg-white/90 hover:border-purple-500/60 hover:bg-white hover:shadow-purple-500/10'
            }`}
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />

            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Layers size={28} className="text-white" />
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-purple-400 ring-4 ring-[#0d0d1c] group-hover:animate-ping" />
                </div>

                <span
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                    isDark
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                      : 'border-purple-300 bg-purple-50 text-purple-800'
                  }`}
                >
                  Stream Engine
                </span>
              </div>

              {/* Title & Description */}
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight font-display group-hover:text-purple-400 transition-colors">
                    Kfkax
                  </h2>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                      isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    CLUSTER V2
                  </span>
                </div>
                <p
                  className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-mist-300' : 'text-slate-600'
                  }`}
                >
                  Comprehensive event streaming cockpit with real-time cluster node inspection,
                  partition offset monitoring, consumer group lag analytics, and live topic streams.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Cluster topology & broker node health telemetry
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Topic partition distribution & real-time message stream
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Consumer group lag diagnostics & active rebalancing
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                  <span className={isDark ? 'text-mist-200' : 'text-slate-700'}>
                    Direct TCP socket probe on localhost:8080 with auto-failover
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Footer Button */}
            <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={14} className="text-purple-400" />
                <span className={`text-xs font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  Target: localhost:8080
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 group-hover:scale-105 group-hover:brightness-110 transition-all">
                <span>Launch Kfkax Engine</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div
          className={`mt-10 rounded-2xl border p-5 transition-colors ${
            isDark
              ? 'border-white/[0.06] bg-white/[0.02]'
              : 'border-slate-200 bg-white/60 shadow-2xs'
          }`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                }`}
              >
                <Cpu size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display">Sub-Millisecond Bridge</h4>
                <p className={`mt-0.5 text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  Dual native WebSocket and TCP stream bridges proxying traffic at line rate.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'
                }`}
              >
                <Database size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display">Persistent Workspaces</h4>
                <p className={`mt-0.5 text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  Topic buffers and background subscriptions stay active when switching tools.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display">Adaptive Theming</h4>
                <p className={`mt-0.5 text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                  Handcrafted dark obsidian and clean crisp light modes with configurable fonts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Apple Welcome Experience Modal */}
      <AppleWelcomeModal
        isOpen={showAppleWelcome}
        onClose={() => setShowAppleWelcome(false)}
        onLaunchApp={onLaunchApp}
      />
    </div>
  )
}
