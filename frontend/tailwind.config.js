/** @type {import('tailwindcss').Config} */
export default {
  // Scan all JS/JSX/TS/TSX files for Tailwind classes (supports incremental TS adoption)
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {
      // ── Typography ──────────────────────────────────────────────
      // Matches UI project (vins/Frontend): Inter for body, DM Serif Display for headings
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['DM Serif Display', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // ── Color Palette ───────────────────────────────────────────
      // Fully adopted from the UI project's design system
      colors: {
        // Core neutrals
        bg: '#f7f6f3',           // Warm paper background
        card: '#ffffff',          // Card surfaces
        border: '#e5e5e5',        // Borders and dividers

        // Text hierarchy
        ink: {
          DEFAULT: '#1f1f1f',     // Primary text
          soft: '#6b6b6b',        // Secondary / muted text
          faint: '#9a9a9a',       // Tertiary / placeholder text
        },

        // Primary accent (warm sage — harmonizes with #f7f6f3 background)
        accent: {
          DEFAULT: '#5a7a5a',     // Primary buttons, links, active states
          light: 'rgba(90, 122, 90, 0.1)',  // Accent backgrounds
          hover: '#4a6a4a',       // Hover state
          dark: '#3d5a3d',        // Active/pressed state
        },

        // Semantic colors
        success: {
          DEFAULT: '#5a9a6b',     // Answered / resolved states
          light: 'rgba(90, 154, 107, 0.1)',
        },
        warning: {
          DEFAULT: '#c4943a',     // Open / pending states
          light: 'rgba(196, 148, 58, 0.1)',
        },
        danger: {
          DEFAULT: '#dc4a4a',     // Errors
          light: 'rgba(220, 74, 74, 0.08)',
        },

        // Legacy sage kept for backward compatibility (will phase out)
        sage: {
          50:  '#f4f7f4',
          100: '#e2ece2',
          200: '#c3d9c3',
          300: '#96bc96',
          400: '#649964',
          500: '#457a45',
          600: '#336133',
          700: '#294e29',
          800: '#223f22',
          900: '#1c341c',
        },

        // Muted background surfaces
        mist: '#f0eeea',
        cream: '#faf9f6',
        admin: {
          bg: '#030307',
          surface: '#0d0d18',
          card: '#0f0f1e',
          purple: '#8b5cf6',
          'purple-bright': '#a78bfa',
          blue: '#3b82f6',
          cyan: '#22d3ee',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          text: '#e4e4f0',
          muted: '#6b6b8a',
        },
      },

      // ── Box Shadows ─────────────────────────────────────────────
      boxShadow: {
        'subtle': '0 2px 12px rgba(0,0,0,0.04)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.06)',
        'float': '0 8px 24px 0 rgba(0,0,0,0.10)',
        'glow-purple': '0 0 24px rgba(139,92,246,0.4)',
        'glow-blue': '0 0 24px rgba(59,130,246,0.4)',
        'glow-cyan': '0 0 24px rgba(34,211,238,0.4)',
        'admin-card': '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow': '0 0 0 3px rgba(90, 122, 90, 0.12), 0 8px 32px rgba(0,0,0,0.06)',
      },

      // ── Transitions ─────────────────────────────────────────────
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },

      // ── Animations ──────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', maxHeight: '0' },
          to: { opacity: '1', maxHeight: '320px' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
};
