'use strict';

module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false }],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-class-properties', './src/babel'],
  env: {
    test: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
};
