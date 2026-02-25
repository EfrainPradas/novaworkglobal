/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NovaWork Global Brand Colors
        primary: {
          DEFAULT: '#1F5BAA', // Primary Blue
          50: '#eef6fc',
          100: '#d9e9f8',
          200: '#bcd9f3',
          300: '#8fc3ec',
          400: '#5ca2e2',
          500: '#3682d5',
          600: '#1F5BAA', // Main Brand Color
          700: '#1a488a',
          800: '#193e72',
          900: '#10375C', // Midnight Blue
        },
        'brand-teal': { // Keeping for backward compat if needed, but should be phased out
          200: '#B2CBD2',
          500: '#2E7886',
          600: '#0B5F6D',
        },
        'brand-ink': '#10375C', // Midnight Blue for ink
        'brand-surface': '#F8F9FA',
        accent: {
          DEFAULT: '#4DA8DA', // Sky Blue as Accent
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#4DA8DA', // Sky Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        navy: {
          DEFAULT: '#10375C', // Midnight Blue
          light: '#1a488a',
          lighter: '#1F5BAA',
        },
        teal: { // Legacy support mapping to Sky Blue tones
          DEFAULT: '#4DA8DA',
          50: '#f0f9ff',
          500: '#4DA8DA',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          DEFAULT: '#4DA8DA', // Sky Blue
          light: '#f8f9fa',
          dark: '#10375C',
        },
        success: '#28a745',
        warning: '#F6C45E',
        danger: '#dc3545',
        info: '#4DA8DA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Body Copy
        heading: ['Montserrat', 'sans-serif'], // Headers
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
      },
    },
  },
  plugins: [],
}
