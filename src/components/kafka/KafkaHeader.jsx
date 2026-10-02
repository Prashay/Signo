import { useState } from 'react'
import {
  Sparkles,
  Server,
  Activity,
  Plus,
  Search,
  ChevronDown,
  Bell,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaHeader({
  activeCluster,
  isProbing = false,
  onProbeCluster,
  onGoDashboard,
  onOpenConfig
}) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const isOnline = activeCluster?.status === 'online'
  const isChecking = activeCluster?.status === 'checking' || isProbing
  const host = activeCluster?.servers?.[0]?.host || 'localhost'
  const port = activeCluster?.servers?.[0]?.port || '8080'

  return (
    <header
      className={`flex h-14 items-center justify-between border-b px-5 backdrop-blur-xl select-none z-20 transition-colors ${
        isDark
          ? 'border-white/[0.08] bg-[#090b11]/90 text-mist-100'
          : 'border-slate-200 bg-white/95 text-slate-800 shadow-xs'
      }`}
    >
      {/* Brand & Cluster Quick Info */}
      <div className="flex items-center gap-4">
        <button
          onClick={onGoDashboard}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          {/* Glowing icon */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div
              className={`flex h-full w-full items-center justify-center rounded-[11px] ${
                isDark ? 'bg-[#0c0e17]' : 'bg-white'
              }`}
            >
              <Zap
                size={16}
                className={isDark ? 'text-cyan-300' : 'text-indigo-600'}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-display text-sm font-bold tracking-tight ${
                  isDark
                    ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-700 bg-clip-text text-transparent'
                }`}
              >
                Kfkax
              </span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-medium border ${
                  isDark
                    ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}
              >
                v0.7.2
              </span>
            </div>
            <div className={`text-[10px] font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
              Distributed Stream Engine
            </div>
          </div>
        </button>

        {/* Dynamic Cluster Connection Status Pill */}
        <div
          className={`hidden md:flex items-center gap-2 rounded-xl border px-3 py-1 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/[0.03] text-mist-200'
              : 'border-slate-200 bg-slate-100 text-slate-800'
          }`}
        >
          {isChecking ? (
            <RefreshCw size={11} className="animate-spin text-amber-400" />
          ) : isOnline ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
          ) : (
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
          )}

          <span className="font-semibold">{activeCluster?.name || 'local'}</span>
          <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
          <span
            className={`font-mono text-[11px] font-medium ${
              isOnline
                ? isDark ? 'text-cyan-300' : 'text-indigo-600'
                : isDark ? 'text-rose-400' : 'text-rose-600'
            }`}
          >
            {host}:{port}
          </span>

          {isChecking ? (
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold ${
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Checking...
            </span>
          ) : isOnline ? (
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold ${
                isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeCluster?.latency || '4ms'}
            </span>
          ) : (
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold ${
                isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              Offline (Docker Disconnected)
            </span>
          )}

          {/* Quick Check / Re-probe button */}
          <button
            type="button"
            onClick={() => onProbeCluster && onProbeCluster(activeCluster)}
            disabled={isChecking}
            title={`Check connection to ${host}:${port}`}
            className={`ml-1 flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition-all ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-mist-300 hover:text-white border border-white/10'
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
            }`}
          >
            <RefreshCw size={10} className={isChecking ? 'animate-spin text-amber-400' : ''} />
            <span>Check</span>
          </button>
        </div>

        {/* Standalone / Simulation engine badge */}
        <div
          title="Kfkax operates independently in standalone client-simulation mode. Even when Docker is stopped, you can design clusters, create topics, produce payloads, and view schemas."
          className={`hidden xl:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] transition-colors ${
            isDark
              ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
              : 'border-indigo-200 bg-indigo-50 text-indigo-800'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
          <span className="font-semibold">Standalone Mode</span>
          <span className={`text-[10px] font-mono px-1 rounded ${isDark ? 'bg-indigo-900/50 text-indigo-200' : 'bg-indigo-100 text-indigo-900'}`}>
            Ready Offline
          </span>
        </div>
      </div>

      {/* Middle: Command Search Bar */}
      <div
        className={`hidden lg:flex items-center w-80 rounded-xl border px-3 py-1.5 text-xs transition-all ${
          isDark
            ? 'border-white/10 bg-white/[0.02] text-mist-400 focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]'
            : 'border-slate-200 bg-slate-100 text-slate-700 focus-within:border-indigo-500 focus-within:bg-white'
        }`}
      >
        <Search size={14} className={isDark ? 'text-mist-500 mr-2 shrink-0' : 'text-slate-400 mr-2 shrink-0'} />
        <input
          type="text"
          placeholder="Search topics, partitions, consumer groups..."
          className={`w-full bg-transparent text-xs outline-none ${
            isDark ? 'text-mist-200 placeholder-mist-500' : 'text-slate-900 placeholder-slate-400'
          }`}
        />
        <kbd
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
            isDark
              ? 'border-white/10 bg-white/5 text-mist-400'
              : 'border-slate-300 bg-white text-slate-500 shadow-xs'
          }`}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right Controls - NOTE: Duplicate settings button and theme button removed per user request. Global settings live on SignoHeader */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenConfig}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all ${
            isDark
              ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-200 hover:from-indigo-600/30 hover:to-violet-600/30'
              : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Sliders size={13} />
          <span>Configure Cluster</span>
        </button>

        <div className={`flex items-center gap-1.5 border-l pl-2.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
              isDark
                ? 'border-white/5 bg-white/[0.03] text-mist-400 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="Cluster Alerts"
          >
            <Bell size={14} />
          </button>
          
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 font-semibold text-xs text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20 cursor-pointer">
            K
          </div>
        </div>
      </div>
    </header>
  )
}

