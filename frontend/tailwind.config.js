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
        // CareerTipsAI Brand Colors
        primary: {
          DEFAULT: '#076370', // Teal primary
          50: '#e6f4f5',
          100: '#b3dde1',
          200: '#80c6cc',
          300: '#4dafb8',
          400: '#1a98a3',
          500: '#076370', // Main brand color
          600: '#064f5a',
          700: '#043b43',
          800: '#03272d',
          900: '#011316',
        },
        accent: {
          DEFAULT: '#F6C45E', // Golden/Yellow accent
          50: '#FEF9EC',
          100: '#FDF3DC',
          200: '#FCE7BA',
          300: '#FADB97',
          400: '#F8CF75',
          500: '#F6C45E', // Main accent color
          600: '#E5A72F',
          700: '#C18A1A',
          800: '#9D6E0F',
          900: '#7A5109',
          light: '#FDF3DC',
          dark: '#E5A72F',
        },
        navy: {
          DEFAULT: '#031D40', // Dark navy
          light: '#0A2F5C',
          lighter: '#14427A',
        },
        teal: {
          DEFAULT: '#509EB5', // Light teal
          50: '#E8F5F8',
          100: '#D1EBF1',
          200: '#A3D7E3',
          300: '#76C3D5',
          400: '#509EB5',
          500: '#509EB5', // Main teal color
          600: '#3A7C91',
          700: '#2D5F70',
          800: '#1F4350',
          900: '#12262F',
          light: '#7CB9CD',
          dark: '#3A7C91',
        },
        secondary: {
          DEFAULT: '#6c757d',
          light: '#f8f9fa',
          dark: '#212529',
        },
        success: '#28a745',
        warning: '#F6C45E', // Using brand accent
        danger: '#dc3545',
        info: '#509EB5', // Using brand teal
      },
      fontFamily: {
        sans: ['Manrope', 'Nunito Sans', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
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
