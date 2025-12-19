/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lato)', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        primary: '#FFC107', // Gold
        'text-dark': '#3E2723', // Dark Chocolate for light mode text
        brown: {
          900: 'var(--bg-primary)',
          800: 'var(--bg-secondary)',
          700: 'var(--bg-tertiary)',
        },
        amber: {
          50: 'var(--text-primary)',
          100: 'var(--text-secondary)',
          200: 'var(--text-muted)',
          300: '#F9DA81',
          400: 'var(--amber-400)',
          500: 'var(--amber-500)',
        }
      },
      backgroundImage: {
        'dark-pattern': "url('/assets/bg-dark-pattern.png')",
        'light-pattern': "url('/assets/bg-light-pattern.png')",
      },
      backgroundColor: {
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
        'glass-light': 'rgba(255, 255, 255, 0.7)',
      },
      borderColor: {
        'glass-dark': 'rgba(255, 255, 255, 0.1)',
        'glass-light': 'rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
