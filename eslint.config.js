'use strict';

const eslint = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const importPlugin = require('eslint-plugin-import');
const babelParser = require('@babel/eslint-parser');
const globals = require('globals');

module.exports = [
  {
    ignores: ['**/node_modules/**', 'lib/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    ...eslint.configs.recommended,
  },
  {
    files: ['src/**/*.{js,jsx}'],
    ...reactPlugin.configs.flat.recommended,
  },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: true,
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-shadow': 'error',
      indent: 'off',
      'linebreak-style': 'off',
      quotes: 'off',
      semi: 'off',
      'react/no-direct-mutation-state': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
    },
  },
  // Local magnetic-di rules for example apps
  {
    files: ['examples/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      magneticDi: require('./src/eslint'),
    },
    rules: {
      'magneticDi/order': 'error',
      'magneticDi/no-duplicate': 'error',
      'magneticDi/no-extraneous': 'error',
      'magneticDi/no-restricted-injectable': [
        'error',
        { paths: [{ name: 'react' }] },
      ],
      'magneticDi/sort-dependencies': 'error',
    },
  },
  {
    files: ['examples/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: true,
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
  },
  // Replaces /* eslint-env jest */ (ignored in flat config until ESLint 10)
  {
    files: [
      'src/**/__tests__/**/*.{js,jsx}',
      'src/**/*.test.{js,jsx}',
      'examples/**/__tests__/**/*.{js,jsx,ts,tsx}',
      'examples/**/*.test.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        ...globals.jest,
      },
    },
  },
];
