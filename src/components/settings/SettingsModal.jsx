import { X, Moon, Sun, Type, Sliders, RotateCcw, Check, Sparkles, Monitor } from 'lucide-react'
import { useThemeSettings, FONT_OPTIONS, FONT_SIZE_OPTIONS } from '../../context/ThemeSettingsContext.jsx'

export default function SettingsModal() {
  const {
    theme,
    setTheme,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    isSettingsOpen,
    setIsSettingsOpen,
    resetDefaults
  } = useThemeSettings()

  if (!isSettingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in select-none">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/[0.12] bg-[#0e111a]/95 text-white shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-md shadow-indigo-600/25">
              <Sliders size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-white">
                Appearance & System Settings
              </h2>
              <p className="text-[11px] text-mist-400">
                Configure color mode, typography family, and interface display density
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-mist-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Color Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-mist-300">
                Color Mode
              </span>
              <span className="text-[10px] text-mist-500 font-mono">Theme system</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500/80 bg-gradient-to-b from-indigo-950/40 to-black/60 shadow-lg shadow-indigo-600/15 ring-1 ring-indigo-500/50'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Moon size={16} />
                  </div>
                  {theme === 'dark' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs text-white">Dark Theme</div>
                <div className="text-[11px] text-mist-400 mt-0.5">
                  High-contrast deep space palette with luminous neon signals
                </div>

                {/* Swatch Preview */}
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#090b11] p-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#6366f1]" />
                  <div className="h-3 w-3 rounded-full bg-[#06b6d4]" />
                  <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                  <div className="ml-auto font-mono text-[9px] text-mist-400">#07090f</div>
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500/80 bg-gradient-to-b from-indigo-950/40 to-black/60 shadow-lg shadow-indigo-600/15 ring-1 ring-indigo-500/50'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Sun size={16} />
                  </div>
                  {theme === 'light' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs text-white">Light Theme</div>
                <div className="text-[11px] text-mist-400 mt-0.5">
                  Crisp daylight studio palette with slate tones and soft gradients
                </div>

                {/* Swatch Preview */}
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#f8fafc] p-1.5 text-slate-800">
                  <div className="h-3 w-3 rounded-full bg-[#4f46e5]" />
                  <div className="h-3 w-3 rounded-full bg-[#0284c7]" />
                  <div className="h-3 w-3 rounded-full bg-[#059669]" />
                  <div className="ml-auto font-mono text-[9px] text-slate-600">#f8fafc</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Typography Style */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-mist-300">
                Font Family Style
              </span>
              <span className="text-[10px] text-mist-500 font-mono">Typography</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setFontFamily(font.id)}
                  style={{ fontFamily: font.family }}
                  className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                    fontFamily === font.id
                      ? 'border-indigo-500/80 bg-indigo-600/15 shadow-sm ring-1 ring-indigo-500/40 text-white'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-mist-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-white">{font.name}</span>
                    {fontFamily === font.id && (
                      <Check size={13} className="text-cyan-300 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-mist-400 mt-0.5">{font.category}</span>
                  <div className="mt-2 truncate text-[11px] text-mist-300/80 font-normal">
                    {font.sample}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Font Size & Interface Density */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-mist-300">
                Interface Density & Font Scale
              </span>
              <span className="text-[10px] text-mist-500 font-mono">Display scale</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-3 transition-all ${
                    fontSize === opt.id
                      ? 'border-indigo-500/80 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500/40'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-mist-300'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.name}</span>
                  <span className="font-mono text-[10px] text-mist-400 mt-0.5">{opt.size}</span>
                </button>
              ))}
            </div>

            {/* Live Preview Box */}
            <div className="mt-3.5 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-emerald-400/90 shadow-inner">
              <div className="text-[10px] uppercase font-bold text-mist-500 mb-1 font-sans tracking-wider">
                Live Scale Preview
              </div>
              <p>
                [STREAM INFO] Cluster operational on localhost:8080 · 16 partitions active · Ingress: 1.42 MB/s
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4 bg-white/[0.01]">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-mist-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  )
}
