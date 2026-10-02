/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        ink: {
          950: '#07090d',
          900: '#0c1017',
          850: '#111822',
          800: '#171f2b',
          700: '#1e2836',
          600: '#2a3648'
        },
        mist: {
          100: '#e8eef6',
          300: '#9aa8bc',
          400: '#7b8ca3',
          500: '#5c6e86'
        },
        signal: {
          DEFAULT: '#4c8dff',
          dim: '#2d5fbd',
          glow: '#7eb0ff'
        }
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(76,141,255,0.25)'
      }
    }
  },
  plugins: []
}
