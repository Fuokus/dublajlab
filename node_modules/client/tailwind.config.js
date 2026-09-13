/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#080b10',
          800: '#0c1017',
          700: '#111820',
          600: '#161e2a',
          500: '#1c2535',
          400: '#253040',
        },
        accent: {
          DEFAULT: '#2dd4a8',
          light: '#5eead4',
          dark: '#14b8a6',
          glow: 'rgba(45, 212, 168, 0.25)',
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'recording': 'recording-pulse 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-horizontal 25s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'recording-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-horizontal': {
          '0%': { transform: 'translateX(-50px) translateY(0)', opacity: '0' },
          '10%': { opacity: '0.05' },
          '90%': { opacity: '0.05' },
          '100%': { transform: 'translateX(100px) translateY(-20px)', opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
