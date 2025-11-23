/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
}
