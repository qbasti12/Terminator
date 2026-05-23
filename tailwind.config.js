/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--theme-background)',
        mantle: 'var(--theme-mantle)',
        crust: 'var(--theme-crust)',
        surface0: 'var(--theme-surface0)',
        surface1: 'var(--theme-surface1)',
        surface2: 'var(--theme-surface2)',
        overlay0: 'var(--theme-overlay0)',
        subtext0: 'var(--theme-subtext0)',
        text: 'var(--theme-text)',
        accent: 'var(--theme-accent)',
        mauve: 'var(--theme-accent)', // alias
        red: 'var(--theme-red)',
        green: 'var(--theme-green)',
        yellow: 'var(--theme-yellow)',
        blue: 'var(--theme-blue)',
        lavender: 'var(--theme-lavender)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
