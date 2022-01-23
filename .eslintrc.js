module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    'camelcase': 0,
    'no-return-assign': 0,
    'no-extend-native': 0,
    'no-unused-expressions': 0,
    'comma-dangle': 0,
    // allow async-await
    'generator-star-spacing': 0,
    'curly': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
