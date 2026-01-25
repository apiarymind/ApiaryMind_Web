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
        // Theme Engine Colors - wszystkie kolory używają zmiennych CSS, które są dynamicznie wstrzykiwane
        primary: 'var(--theme-color-primary, #FFC107)',
        secondary: 'var(--theme-color-secondary)',
        accent: 'var(--theme-color-accent, #F4B524)',
        success: 'var(--theme-color-success, #4CAF50)',
        danger: 'var(--theme-color-danger, #F44336)',
        
        // Legacy colors (zachowane dla kompatybilności, ale używają zmiennych)
        'text-dark': 'var(--text-primary, #3E2723)',
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
        // Theme Engine Background - używają zmiennych CSS
        'dark-pattern': "var(--theme-bg-image-dark, url('/assets/bg-dark-pattern.png'))",
        'light-pattern': "var(--theme-bg-image-light, url('/assets/bg-light-pattern.png'))",
        'theme-background': 'var(--theme-bg-image)',
      },
      backgroundColor: {
        // Theme Engine Glass Colors
        'glass-dark': 'var(--theme-card-bg-dark, rgba(0, 0, 0, 0.4))',
        'glass-light': 'var(--theme-card-bg-light, rgba(255, 255, 255, 0.92))'
      },
      boxShadow: {
        // Enhanced shadows for light mode (Android-like elevation)
        'light-card': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'light-card-lg': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'light-card-xl': '0 12px 32px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.08)',
        'light-button': '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
        'light-button-hover': '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.08)',
        'light-input': '0 2px 4px rgba(0, 0, 0, 0.05)', // Zwiększona nieprzezroczystość
        'theme-card': 'var(--theme-card-bg)',
      },
      borderColor: {
        // Theme Engine Border Colors
        'glass-dark': 'var(--theme-card-border-dark, rgba(255, 255, 255, 0.1))',
        'glass-light': 'var(--theme-card-border-light, rgba(0, 0, 0, 0.05))',
        'theme-card': 'var(--theme-card-border)',
      },
      borderRadius: {
        'theme-card': 'var(--theme-card-radius, 12px)',
      },
      borderWidth: {
        'theme-card': 'var(--theme-card-border-width, 1px)',
      },
      backdropBlur: {
        'theme-card': 'var(--theme-card-blur, 10px)',
      },
      boxShadow: {
        'theme-card': 'var(--theme-card-shadow)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
