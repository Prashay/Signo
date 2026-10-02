import React, { useState, useEffect } from 'react'
import { X, Sparkles, Radio, Layers, ArrowRight, ShieldCheck, Cpu } from 'lucide-react'

export default function AppleWelcomeModal({ isOpen, onClose, onLaunchApp }) {
  const [greetingIndex, setGreetingIndex] = useState(0)
  const [fade, setFade] = useState(false)
  const [progress, setProgress] = useState(15)

  const greetings = [
    { lang: 'English', text: 'hello' },
    { lang: 'French', text: 'bonjour' },
    { lang: 'Spanish', text: 'hola' },
    { lang: 'Italian', text: 'ciao' },
    { lang: 'German', text: 'hallo' },
    { lang: 'Hindi', text: 'namaste' },
    { lang: 'Japanese', text: 'konnichiwa' },
    { lang: 'Signo OS', text: 'signo' }
  ]

  useEffect(() => {
    if (!isOpen) return

    // Progress animation spanning 2.6 - 3.0 seconds
    setProgress(15)
    const t1 = setTimeout(() => setProgress(42), 600)
    const t2 = setTimeout(() => setProgress(72), 1400)
    const t3 = setTimeout(() => setProgress(92), 2200)
    const t4 = setTimeout(() => setProgress(100), 2800)

    // Language rotation every 1100ms
    const interval = setInterval(() => {
      setFade(true)
      setTimeout(() => {
        setGreetingIndex((prev) => (prev + 1) % greetings.length)
        setFade(false)
      }, 220)
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-500 animate-in fade-in select-none">
      {/* Ambient Apple Radial Aura */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-sky-500/15 to-purple-600/20 blur-[100px] animate-pulse" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:text-white transition-all"
        title="Close Apple Welcome"
      >
        <X size={18} />
      </button>

      <div className="relative flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Signo Apple Emblem */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-2xl bg-indigo-500/30 blur-lg" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M5 16c4.5-9 17.5-9 22 0" stroke="url(#modalGlyph1)" stroke-width="2.6" stroke-linecap="round"/>
              <path d="M9.5 16c3-5 10-5 13 0" stroke="url(#modalGlyph2)" stroke-width="2.6" stroke-linecap="round"/>
              <circle cx="16" cy="16" r="2.8" fill="#ffffff"/>
              <defs>
                <linearGradient id="modalGlyph1" x1="5" y1="11" x2="27" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#818cf8"/>
                  <stop offset="1" stopColor="#38bdf8"/>
                </linearGradient>
                <linearGradient id="modalGlyph2" x1="9" y1="13" x2="23" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c084fc"/>
                  <stop offset="1" stopColor="#818cf8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Animated Cursive "hello" Vector */}
        <svg className="w-72 h-24 mb-2 overflow-visible drop-shadow-[0_2px_16px_rgba(129,140,248,0.5)]" viewBox="0 0 360 120" fill="none">
          <path
            className="stroke-[3.8] stroke-round stroke-cap-round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: 0,
              stroke: 'url(#appleModalHelloGrad)'
            }}
            d="M 36 94 C 33 94 28 90 30 81 C 32 64 54 28 69 28 C 76 28 79 33 76 43 L 59 98 C 57 103 60 105 64 102 C 73 94 84 66 94 54 C 101 46 108 48 106 56 C 101 70 91 95 95 98 C 98 100 104 93 111 82 M 116 80 C 124 67 136 59 146 59 C 154 59 157 64 152 75 L 121 83 C 120 92 125 98 136 98 C 144 98 155 90 163 79 M 125 75 C 136 73 145 69 144 64 C 143 61 137 61 130 65 M 165 98 C 172 98 179 89 185 71 L 202 28 C 204 20 200 17 193 22 C 184 27 172 48 168 63 L 166 95 C 169 98 177 98 185 91 M 198 98 C 205 98 212 89 218 71 L 235 28 C 237 20 233 17 226 22 C 217 27 205 48 201 63 L 199 95 C 202 98 210 98 218 91 M 248 59 C 233 59 222 74 222 87 C 222 95 229 101 240 101 C 257 101 268 85 268 72 C 268 63 259 59 248 59 Z M 245 68 C 253 68 257 74 255 82 C 253 89 245 93 239 92 C 234 90 234 83 237 75 C 240 70 243 68 245 68 Z M 264 69 C 273 63 287 63 298 69"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="appleModalHelloGrad" x1="30" y1="20" x2="300" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff"/>
              <stop offset="0.6" stopColor="#e0e7ff"/>
              <stop offset="1" stopColor="#93c5fd"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Multilingual cycling typography */}
        <div
          className={`h-6 text-sm font-medium tracking-[0.2em] uppercase text-white/60 transition-all duration-300 ${
            fade ? 'opacity-0 translate-y-1 blur-xs' : 'opacity-100 translate-y-0 blur-none'
          }`}
        >
          {greetings[greetingIndex].text}
        </div>

        {/* Minimal Apple Hardware Setup Progress Pill */}
        <div className="mt-8 h-1 w-56 rounded-full bg-white/15 overflow-hidden shadow-inner relative">
          <div
            className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 text-xs text-[#86868b] tracking-tight">
          {progress < 100 ? 'Configuring unified event stream engine...' : 'Signo Platform 2.4 Ready'}
        </p>

        {/* Quick Launch Buttons in Apple Glass Style */}
        <div className="mt-8 grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              onClose()
              if (onLaunchApp) onLaunchApp('mqtt')
            }}
            className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
          >
            <Radio size={22} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">MQTT Studio</div>
            <span className="text-[10px] text-white/50">IoT & Telemetry</span>
          </button>

          <button
            onClick={() => {
              onClose()
              if (onLaunchApp) onLaunchApp('kafka')
            }}
            className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
          >
            <Layers size={22} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Kfkax Engine</div>
            <span className="text-[10px] text-white/50">Kafka Streams</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-white/70 hover:text-white transition-colors"
        >
          <span>Continue to Workspace</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
