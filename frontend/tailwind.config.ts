import type { Config } from 'tailwindcss'

/**
 * War News Intelligence Dashboard — Design Token System
 * Authoritative Tailwind configuration for all UI components.
 * Maintained by Vibe Unit UX Team. See docs/projects/war-dashboard/design/
 */
const config: Config = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        war: {
          red:    '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green:  '#22c55e',
          blue:   '#3b82f6',
          purple: '#a855f7',
        },
        confidence: {
          verified: {
            bg:     '#052e16',
            text:   '#22c55e',
            border: '#166534',
          },
          likely: {
            bg:     '#1a1200',
            text:   '#eab308',
            border: '#713f12',
          },
          unverified: {
            bg:     '#1c0a00',
            text:   '#f97316',
            border: '#7c2d12',
          },
          rumor: {
            bg:     '#1c0000',
            text:   '#ef4444',
            border: '#7f1d1d',
          },
        },
        surface: {
          base:     '#020617',
          elevated: '#0f172a',
          card:     '#1e293b',
          border:   '#334155',
          overlay:  'rgba(15,23,42,0.8)',
        },
        text: {
          primary:   '#ffffff',
          secondary: '#cbd5e1',
          muted:     '#64748b',
          inverse:   '#0f172a',
        },
        map: {
          pin:        '#3b82f6',
          strike:     '#ef4444',
          unit:       '#f97316',
          checkpoint: '#eab308',
          safe:       '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        ticker: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ticker-sm': ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.1em',  fontWeight: '700' }],
        'ticker-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.08em', fontWeight: '700' }],
        'ticker-lg': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0.06em', fontWeight: '800' }],
        'badge-xs':  ['0.625rem', { lineHeight: '1rem',    letterSpacing: '0.05em', fontWeight: '600' }],
        'badge-sm':  ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.04em', fontWeight: '600' }],
        'alert-title': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'alert-meta':  ['0.75rem',   { lineHeight: '1.125rem', fontWeight: '400' }],
      },
      letterSpacing: {
        'ticker':   '0.08em',
        'badge':    '0.06em',
        'widest-2': '0.15em',
      },
      spacing: {
        'card-x':    '1rem',
        'card-y':    '0.75rem',
        'badge-x':   '0.5rem',
        'badge-y':   '0.125rem',
        'ticker-h':  '2.5rem',
        'sidebar-w': '20rem',
        'panel-w':   '24rem',
        '18':  '4.5rem',
        '88':  '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'badge':     '0.25rem',
        'card':      '0.5rem',
        'panel':     '0.75rem',
        'map-popup': '0.5rem',
        'marker':    '50%',
        'pill':      '9999px',
      },
      boxShadow: {
        'glow-red':    '0 0 12px rgba(239,68,68,0.4)',
        'glow-orange': '0 0 12px rgba(249,115,22,0.4)',
        'glow-yellow': '0 0 12px rgba(234,179,8,0.4)',
        'glow-green':  '0 0 12px rgba(34,197,94,0.35)',
        'glow-blue':   '0 0 12px rgba(59,130,246,0.4)',
        'glow-purple': '0 0 12px rgba(168,85,247,0.4)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        'panel':       '0 8px 32px rgba(0,0,0,0.6)',
        'ticker':      '0 2px 8px rgba(0,0,0,0.5)',
        'map-popup':   '0 4px 16px rgba(0,0,0,0.6)',
        'marker':      '0 2px 6px rgba(0,0,0,0.5)',
        'breaking':    '0 0 0 3px rgba(239,68,68,0.3), 0 0 20px rgba(239,68,68,0.2)',
      },
      keyframes: {
        'ticker-scroll': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'breaking-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'marker-drop': {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '70%':  { transform: 'translateY(3px)',   opacity: '1' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'counter-tick': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '20%':  { transform: 'translateY(0)',      opacity: '1' },
          '80%':  { transform: 'translateY(0)',      opacity: '1' },
          '100%': { transform: 'translateY(100%)',   opacity: '0' },
        },
      },
      animation: {
        'ticker':       'ticker-scroll 30s linear infinite',
        'ticker-fast':  'ticker-scroll 15s linear infinite',
        'breaking':     'breaking-pulse 1.5s ease-in-out infinite',
        'marker-drop':  'marker-drop 0.4s ease-out forwards',
        'shimmer':      'shimmer 2s linear infinite',
        'counter-tick': 'counter-tick 0.3s ease-in-out',
      },
      zIndex: {
        'map':        '0',
        'map-marker': '10',
        'map-popup':  '20',
        'sidebar':    '30',
        'panel':      '40',
        'ticker':     '50',
        'modal':      '60',
        'toast':      '70',
        'breaking':   '80',
      },
      backdropBlur: {
        'xs':    '2px',
        'panel': '12px',
      },
      transitionDuration: {
        'fast':   '100ms',
        'normal': '200ms',
        'slow':   '350ms',
      },
    },
  },
  plugins: [],
}

export default config
