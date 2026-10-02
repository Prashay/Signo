import { useState, useEffect } from 'react'
import SignoHeader from './components/signo/SignoHeader.jsx'
import MqttStudioApp from './components/mqtt/MqttStudioApp.jsx'
import KfkaxApp from './components/kafka/KfkaxApp.jsx'
import SettingsModal from './components/settings/SettingsModal.jsx'
import { ThemeSettingsProvider, useThemeSettings } from './context/ThemeSettingsContext.jsx'

import SignoLandingPage from './components/signo/SignoLandingPage.jsx'

function MainLayout() {
  const [activeApp, setActiveApp] = useState('welcome') // 'welcome' | 'mqtt' | 'kafka'
  const [mqttRate, setMqttRate] = useState(0)
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  useEffect(() => {
    // Notify Apple Bootloader that React is mounted and ready
    if (typeof window !== 'undefined' && typeof window.dismissSignoBoot === 'function') {
      window.dismissSignoBoot()
    }
  }, [])

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors ${
        isDark ? 'bg-[#07090d] text-mist-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Master Signo Platform Bar */}
      <SignoHeader
        activeApp={activeApp}
        onSelectApp={setActiveApp}
        mqttRate={mqttRate}
      />

      {/* Main Apps Viewport: Persistent mounting so background streams are not dropped */}
      <main className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Signo Landing Welcome Hub */}
        <div className={`h-full w-full ${activeApp === 'welcome' ? 'flex flex-col' : 'hidden'}`}>
          <SignoLandingPage onLaunchApp={setActiveApp} mqttRate={mqttRate} />
        </div>

        {/* MQTT Studio Workspace */}
        <div className={`h-full w-full ${activeApp === 'mqtt' ? 'flex flex-col' : 'hidden'}`}>
          <MqttStudioApp onRateChange={setMqttRate} />
        </div>

        {/* Kfkax Engine Workspace */}
        <div className={`h-full w-full ${activeApp === 'kafka' ? 'flex flex-col' : 'hidden'}`}>
          <KfkaxApp />
        </div>
      </main>

      {/* Single Bottom Footer */}
      <footer
        className={`flex items-center justify-center px-4 py-2 text-xs font-medium border-t backdrop-blur-md select-none shrink-0 transition-colors z-20 ${
          isDark
            ? 'border-white/[0.06] bg-[#07090d]/90 text-mist-400'
            : 'border-slate-200 bg-white/95 text-slate-600 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5 tracking-tight">
          <span>designed and developed by</span>
          <a
            href="https://github.com/prashay"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold transition-all hover:underline ${
              isDark
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            @prashant jha
          </a>
          <span className="opacity-40 mx-0.5">|</span>
          <span className="font-mono text-[11px] opacity-80">2026</span>
        </div>
      </footer>

      {/* Global Settings & Appearance Modal */}
      <SettingsModal />
    </div>
  )
}

export default function App() {
  return (
    <ThemeSettingsProvider>
      <MainLayout />
    </ThemeSettingsProvider>
  )
}
