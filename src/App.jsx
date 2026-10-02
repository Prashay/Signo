import { useState } from 'react'
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
