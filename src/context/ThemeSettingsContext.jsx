import { createContext, useContext, useEffect, useState } from 'react'

export const FONT_OPTIONS = [
  {
    id: 'ibm-plex',
    name: 'IBM Plex Sans',
    category: 'Technical & Clean',
    family: '"IBM Plex Sans", system-ui, sans-serif',
    sample: 'Active telemetry stream { seq: 1042, rate: "120/s" }'
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Modern UI & Neutral',
    family: '"Inter", system-ui, sans-serif',
    sample: 'Optimized high-density interface and dashboards'
  },
  {
    id: 'sora',
    name: 'Sora',
    category: 'Geometric Display',
    family: '"Sora", system-ui, sans-serif',
    sample: 'Futuristic streaming platform & console'
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    category: 'Developer Monospace',
    family: '"Fira Code", "IBM Plex Mono", monospace',
    sample: 'const stream = broker.connect("localhost:8080")'
  },
  {
    id: 'system',
    name: 'System Default',
    category: 'Native OS Typography',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sample: 'Native platform rendering and accessibility'
  }
]

export const FONT_SIZE_OPTIONS = [
  { id: 'compact', name: 'Compact', size: '13px', scale: '92%', label: '13px · High density' },
  { id: 'normal', name: 'Standard', size: '14px', scale: '100%', label: '14px · Default' },
  { id: 'large', name: 'Comfortable', size: '16px', scale: '114%', label: '16px · Relaxed' },
  { id: 'xlarge', name: 'Large', size: '18px', scale: '128%', label: '18px · Large display' }
]

const ThemeSettingsContext = createContext(null)

export function ThemeSettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('signo_theme') || 'dark'
  })

  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('signo_font_family') || 'ibm-plex'
  })

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('signo_font_size') || 'normal'
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Apply Theme
  useEffect(() => {
    localStorage.setItem('signo_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  // Apply Font Family
  useEffect(() => {
    localStorage.setItem('signo_font_family', fontFamily)
    const selected = FONT_OPTIONS.find((f) => f.id === fontFamily) || FONT_OPTIONS[0]
    document.documentElement.style.setProperty('--app-font-family', selected.family)
    document.body.style.fontFamily = selected.family
  }, [fontFamily])

  // Apply Font Size
  useEffect(() => {
    localStorage.setItem('signo_font_size', fontSize)
    const selected = FONT_SIZE_OPTIONS.find((s) => s.id === fontSize) || FONT_SIZE_OPTIONS[1]
    document.documentElement.style.fontSize = selected.size
    document.documentElement.style.setProperty('--app-font-size', selected.size)
  }, [fontSize])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const resetDefaults = () => {
    setTheme('dark')
    setFontFamily('ibm-plex')
    setFontSize('normal')
  }

  return (
    <ThemeSettingsContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        isSettingsOpen,
        setIsSettingsOpen,
        resetDefaults
      }}
    >
      {children}
    </ThemeSettingsContext.Provider>
  )
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext)
  if (!context) {
    throw new Error('useThemeSettings must be used within ThemeSettingsProvider')
  }
  return context
}
