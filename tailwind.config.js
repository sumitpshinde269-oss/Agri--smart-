/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22',
        },
        amber: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        stone: {
          50:  '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917', 950: '#0c0a09',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out',
        'slide-up':     'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:      { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: 0, transform: 'translateX(20px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        bounceGentle: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
