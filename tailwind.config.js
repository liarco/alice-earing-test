module.exports = {
  mode: 'jit',
  purge: [
    './dist/index.html',
    './src/**/*.ts',
    './src/**/*.scss',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
