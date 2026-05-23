/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#1E1E2E',
        mantle: '#181825',
        crust: '#11111B',
        surface0: '#313244',
        surface1: '#45475A',
        surface2: '#585B70',
        overlay0: '#6C7086',
        subtext0: '#A6ADC8',
        text: '#CDD6F4',
        mauve: '#CBA6F7',
        red: '#F38BA8',
        green: '#A6E3A1',
        yellow: '#F9E2AF',
        blue: '#89B4FA',
        lavender: '#B4BEFE',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
