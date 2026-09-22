/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Light mode surfaces
        'surface-light': {
          base:    '#F8FAFC',
          card:    '#FFFFFF',
          subtle:  '#F1F5F9',
          overlay: '#E2E8F0',
        },
        // Dark mode surfaces
        'surface-dark': {
          base:    '#0B1220',
          card:    '#111827',
          subtle:  '#1A2535',
          overlay: '#243044',
        },
        // Brand
        'brand-blue':   '#2563EB',
        'brand-cyan':   '#06B6D4',
        'brand-navy':   '#0F172A',
        'brand-slate':  '#64748B',
        // Status
        'status-success': '#10B981',
        'status-warning': '#F59E0B',
        'status-error':   '#EF4444',
        'status-info':    '#3B82F6',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'card': '0.875rem',
        'modal': '1rem',
      },
      boxShadow: {
        'card-light': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-dark':  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'dropdown':   '0 10px 40px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.25s ease',
        'shimmer': 'shimmer 1.6s ease infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:  { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
};
