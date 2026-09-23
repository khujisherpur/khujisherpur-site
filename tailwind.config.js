/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1B2A4A',
        paper: '#F5F7F4',
        green: {
          DEFAULT: '#1C8A4C',
          dark: '#0E5C33',
        },
        marigold: '#E3A72E',
      },
      fontFamily: {
        sans: ['var(--font-hind)', 'sans-serif'],
        numeric: ['var(--font-noto-serif-bn)', 'serif'],
      },
    },
  },
  plugins: [],
};
