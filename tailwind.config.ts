import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0914',
        surface: '#1A1928',
        'surface-input': '#13121F',
        divider: '#2E2D45',
        'element-inactive': '#4A4A6A',
        purple: {
          DEFAULT: '#6C63FF',
          light: '#8B85FF',
          dark: '#5A52D5',
        },
        teal: {
          DEFAULT: '#00C9A7',
          light: '#33D4B8',
          dark: '#00A88A',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          light: '#FF8989',
          dark: '#D55A5A',
        },
        amber: {
          DEFAULT: '#FFA94D',
          light: '#FFBA70',
          dark: '#D68C3F',
        },
        text: {
          primary: '#EEEEFF',
          secondary: '#8888AA',
          muted: '#4A4A6A',
        },
      },
      fontFamily: {
        inter: ['Inter_400Regular', 'Inter_500Medium', 'Inter_600SemiBold', 'Inter_700Bold'],
      },
      spacing: {
        '68': '68px',
        '56': '56px',
      },
      borderRadius: {
        '20': '20px',
        '28': '28px',
        '14': '14px',
        '16': '16px',
      },
    },
  },
  plugins: [],
}

export default config
