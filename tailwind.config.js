/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#ffccd8',
          300: '#ffa2b8',
          400: '#f86d93',
          500: '#ed3b72',
          600: '#db205b',
          700: '#b81246',
          800: '#99123c',
          900: '#801337',
        },
        rosewood: '#682d38',
        champagne: {
          50: '#faf8f5',
          100: '#f4efe8',
          200: '#e8dcce',
          300: '#d7c2aa',
          400: '#c4a383',
          500: '#b58b65',
          600: '#9b7150',
          700: '#7d5940',
        },
        gold: {
          light: '#f5e6c8',
          DEFAULT: '#d4af37',
          dark: '#aa820a',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e5ebe5',
          200: '#ccd8cc',
          300: '#a7bda7',
          400: '#7e9e7e',
          500: '#618261',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        sans: ['"Montserrat"', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 9s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(3deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-3deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
      }
    },
  },
  plugins: [],
}
