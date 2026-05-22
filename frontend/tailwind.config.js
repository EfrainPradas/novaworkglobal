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
        // Ascendia Brand Colors (deep evergreen palette)
        primary: {
          DEFAULT: '#0E4B2B', // Ascendia Primary
          50: '#EAF4EC',
          100: '#D5E9D9',
          200: '#A8D4B0',
          300: '#6BB87E',
          400: '#4F8F55',
          500: '#357A3E',
          600: '#0E4B2B', // Main Brand Color
          700: '#07371E',
          800: '#052A16',
          900: '#031D0F', // Deep Evergreen
        },
        'brand-teal': { // Mapped to Ascendia green tones
          200: '#A8D4B0',
          500: '#4F8F55',
          600: '#0E4B2B',
        },
        'brand-ink': '#101917', // Ascendia ink
        'brand-surface': '#F6F7F5',
        accent: {
          DEFAULT: '#4F8F55', // Ascendia Secondary Green
          50: '#F4FAF5',
          100: '#EAF4EC',
          200: '#D5E9D9',
          300: '#A8D4B0',
          400: '#6BB87E',
          500: '#4F8F55', // Ascendia Secondary
          600: '#357A3E',
          700: '#0E4B2B',
          800: '#07371E',
          900: '#031D0F',
        },
        navy: { // Mapped to Ascendia dark greens
          DEFAULT: '#031D0F', // Deep Evergreen
          light: '#07371E',
          lighter: '#0E4B2B',
        },
        teal: { // Mapped to Ascendia green tones
          DEFAULT: '#4F8F55',
          50: '#F4FAF5',
          500: '#4F8F55',
          600: '#357A3E',
          700: '#0E4B2B',
        },
        secondary: {
          DEFAULT: '#4F8F55', // Ascendia Secondary
          light: '#F6F7F5',
          dark: '#031D0F',
        },
        success: '#28a745',
        warning: '#F6C45E',
        danger: '#dc3545',
        info: '#4A7DB8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Body Copy
        heading: ['Montserrat', 'sans-serif'], // Headers
        serif: ['Fraunces', 'Georgia', 'serif'], // Landing page headings
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
