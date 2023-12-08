module.exports = {
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    es6: true,
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:flowtype/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react', 'flowtype', 'import'],
  rules: {
    'no-shadow': ['error'],
    indent: ['off'],
    'linebreak-style': ['off'],
    quotes: ['off'],
    semi: ['off'],
    'react/no-direct-mutation-state': ['off'],
    'react/display-name': ['off'],
    'react/prop-types': ['off'],
  },
};
