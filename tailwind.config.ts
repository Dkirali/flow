/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F0E1A',
        surface: '#1E1D30',
        input: '#13121F',
        divider: '#2E2D45',
        muted: '#4A4A6A',
        brand: '#6C63FF',
        income: '#00C9A7',
        expense: '#FF6B6B',
        warning: '#FFA94D',
        'text-primary': '#EEEEFF',
        'text-secondary': '#8888AA',
        'text-muted': '#4A4A6A',
      },
      fontFamily: {
        'inter-regular': ['Inter-Regular'],
        'inter-medium': ['Inter-Medium'],
        'inter-semibold': ['Inter-SemiBold'],
        'inter-bold': ['Inter-Bold'],
      },
      borderRadius: {
        'card': '20px',
        'button': '28px',
        'chip': '22px',
        'input': '14px',
      },
    },
  },
  plugins: [],
}
