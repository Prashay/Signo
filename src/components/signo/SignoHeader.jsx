import { Wifi, Layers, Sparkles, CheckCircle2, Moon, Sun, Settings, LayoutGrid } from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function SignoHeader({ activeApp, onSelectApp, mqttRate = 0 }) {
  const { theme, toggleTheme, setIsSettingsOpen } = useThemeSettings()
  const isDark = theme === 'dark'
  const isMacElectron = typeof window !== 'undefined' && window.electron?.platform === 'darwin'

  return (
    <header
      className={`flex h-13 items-center justify-between border-b px-4 select-none z-30 transition-colors ${
        isMacElectron ? 'pl-20' : ''
      } ${
        isDark
          ? 'border-white/10 bg-[#07090d]/95 text-mist-100 backdrop-blur-md'
          : 'border-slate-200 bg-white/95 text-slate-800 backdrop-blur-md shadow-xs'
      }`}
    >
      {/* Brand & Suite title */}
      <button
        type="button"
        onClick={() => onSelectApp('welcome')}
        className="flex items-center gap-3 text-left group focus:outline-none"
        title="Go to Signo Welcome Overview"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles size={16} className="text-white animate-pulse" />
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-ink-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display text-sm font-bold tracking-wider group-hover:text-indigo-400 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              SIGNO
            </span>
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-widest ${
                isDark ? 'bg-white/10 text-mist-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Platform
            </span>
          </div>
          <div className={`text-[10px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Unified Streaming & Broker Console
          </div>
        </div>
      </button>

      {/* App Switcher Tabs */}
      <div
        className={`flex items-center rounded-xl p-1 border shadow-inner transition-colors ${
          isDark
            ? 'bg-[#0f121d] border-white/10'
            : 'bg-slate-100 border-slate-200'
        }`}
      >
        {/* Overview Tab */}
        <button
          type="button"
          onClick={() => onSelectApp('welcome')}
          className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeApp === 'welcome'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/30'
              : isDark
              ? 'text-mist-400 hover:text-mist-100 hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <LayoutGrid
            size={14}
            className={activeApp === 'welcome' ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-300'}
          />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectApp('mqtt')}
          className={`group flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeApp === 'mqtt'
              ? 'bg-signal text-white shadow-sm shadow-signal/30'
              : isDark
              ? 'text-mist-400 hover:text-mist-100 hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Wifi
            size={14}
            className={activeApp === 'mqtt' ? 'text-white' : 'text-signal/70 group-hover:text-signal'}
          />
          <span>MQTT Studio</span>
          {mqttRate > 0 && (
            <span className="rounded-full bg-black/25 px-1.5 py-0.2 font-mono text-[10px] text-emerald-300">
              {Math.round(mqttRate)}/s
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectApp('kafka')}
          className={`group flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
            activeApp === 'kafka'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
              : isDark
              ? 'text-mist-400 hover:text-mist-100 hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Layers
            size={14}
            className={activeApp === 'kafka' ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}
          />
          <span>Kfkax</span>
          <span
            className={`rounded px-1.5 py-0.2 font-mono text-[9px] border ${
              isDark
                ? 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                : 'bg-purple-100 text-purple-800 border-purple-300'
            }`}
          >
            Stream Engine
          </span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* Right meta info & Appearance Controls */}
      <div className="flex items-center gap-2.5">
        <div
          className={`hidden sm:flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-mono ${
            isDark
              ? 'border-white/5 bg-[#0c1017] text-mist-400'
              : 'border-slate-200 bg-slate-100 text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1 text-emerald-500 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Core: 7200
          </span>
          <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
          <span className={isDark ? 'text-mist-300' : 'text-slate-600'}>Target Node: 8080</span>
        </div>

        {/* Quick Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all shadow-sm ${
            isDark
              ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-white'
              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? (
            <Sun size={15} className="text-amber-300" />
          ) : (
            <Moon size={15} className="text-indigo-600" />
          )}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all shadow-sm ${
            isDark
              ? 'border-white/10 bg-white/5 text-mist-200 hover:bg-indigo-600/20 hover:border-indigo-500/40 hover:text-indigo-200'
              : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="Theme, Font & Interface Settings"
        >
          <Settings size={14} className={isDark ? 'text-mist-300' : 'text-slate-600'} />
          <span className="hidden md:inline">Settings</span>
        </button>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl border cursor-pointer ${
            isDark
              ? 'border-white/5 bg-white/5 text-mist-300'
              : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
          title="Fleet Health: Operational"
        >
          <CheckCircle2 size={15} className="text-emerald-500" />
        </span>
      </div>
    </header>
  )
}
