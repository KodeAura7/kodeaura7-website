export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        // KodeAura7 brand palette — derived from the logo's blue gradient
        // (#1c63f3 -> #102d73). Semantic names replace the old generic
        // Tailwind palette usage (indigo/cyan/violet/purple/emerald/amber/rose/sky)
        // throughout the app so the theme can be tuned from this one place.
        primary: {
          50: '#eef4ff', 100: '#dde7ff', 200: '#b8d0fe', 300: '#8bb3fd',
          400: '#5a8ff9', 500: '#3370f6', 600: '#1c63f3', 700: '#154fc7',
          800: '#123f9c', 900: '#102d73', 950: '#0a1c49'
        },
        secondary: {
          50: '#eafcff', 100: '#c8f6ff', 200: '#92ecff', 300: '#5cdcfb',
          400: '#22c8f0', 500: '#0aa9d6', 600: '#088fb6', 700: '#077695',
          800: '#055c75', 900: '#02475b', 950: '#012d3a'
        },
        accent: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
        },
        success: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22'
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03'
        },
        error: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519'
        },
        info: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
          400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e', 950: '#082f49'
        }
      }
    }
  },
  plugins: []
};
