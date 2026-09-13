/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mint: '#C7F9CC',
        'mint-dark': '#9ED8A3',
        coral: '#FFC6D9',
        'coral-dark': '#F0A3BE',
        lavender: '#D8D5F9',
        'lavender-dark': '#BFBBE8',
        peach: '#FFE5D9',
        'peach-dark': '#F5CFBE',
        sky: '#BDE0FE',
        'sky-dark': '#A2C8E8',
        butter: '#FFF9C4',
        'butter-dark': '#E8E2A3',
        nintendo: {
          bg: '#FAFAF5',
          card: '#FFFFFF',
          text: '#4A4550',
          muted: '#8E8A95',
          border: '#E5E1EB',
        },
      },
      fontFamily: {
        sans: ['"M PLUS Rounded 1c"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.10)',
        nintendo: '0 6px 0 rgba(0, 0, 0, 0.08)',
        'nintendo-active': '0 2px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
