/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          nav: '#232f3e',
          navHover: '#37475a',
          orange: '#ff9900',
          bg: '#f2f3f3',
          panel: '#ffffff',
          blue: '#0073bb',
          text: '#16191f'
        }
      }
    },
  },
  plugins: [],
}
