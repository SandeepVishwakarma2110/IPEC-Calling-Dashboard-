export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { navy: { DEFAULT: '#1b2a4a', 800: '#16223c', 700: '#223459', 100: '#e6eaf2' }, maroon: '#8b1e2d', gold: '#c9a24b' },
    fontFamily: { sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'], serif: ['"Source Serif 4"', 'Georgia', 'serif'] },
  } },
  plugins: [],
};
