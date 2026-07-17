/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          dark: '#15803d',
          light: '#22c55e',
        },
        gold: {
          DEFAULT: '#facc15',
          dark: '#eab308',
        },
        bg: {
          DEFAULT: '#111827',
          card: '#1f2937',
          soft: '#1a2333',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        popIn: 'popIn 0.18s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
