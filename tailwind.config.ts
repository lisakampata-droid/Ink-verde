import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { ink: '#111111', ivory: '#F7F5EF', verde: '#244C3A', sage: '#DCE5DD', line: '#D8D5CD' },
      fontFamily: { serif: ['Georgia', 'Times New Roman', 'serif'], sans: ['Arial', 'Helvetica', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
