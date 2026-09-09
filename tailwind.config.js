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
          50: '#fff7f8',
          100: '#fdebf0',
          200: '#fbdbe4',
          300: '#f5bdcd',
          400: '#e48ea3',
          500: '#c97a8b',
          600: '#b85b73',
          700: '#9e445b',
          800: '#84354a',
          900: '#682537',
        },
        rosewood: '#6b2837',
        champagne: {
          50: '#faf7f5',
          100: '#f5eee8',
          200: '#ebdcd2',
          300: '#dcc6b8',
          400: '#c5a896',
          500: '#ab8b76',
          600: '#8f705d',
          700: '#735645',
        },
        gold: {
          light: '#fbf5e6',
          DEFAULT: '#c59b48',
          dark: '#9a7428',
        },
        sage: {
          50: '#f3f7f4',
          100: '#e4ede6',
          200: '#c8dbcd',
          300: '#9bbeab',
          400: '#729c84',
          500: '#527d65',
          600: '#3d634f',
          700: '#2c493a',
        },
        brand: {
          rose: '#c97a8b',
          'rose-dark': '#b85b73',
          'rose-light': '#fdf2f5',
          sage: '#9bbeab',
          'sage-dark': '#3d634f',
          'sage-light': '#edf5f0',
          gold: '#c59b48',
          'gold-light': '#fdf7ea',
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
