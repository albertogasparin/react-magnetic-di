'use strict';

module.exports = {
  extends: '../babel.config.js',
  presets: ['@babel/preset-env', '@babel/preset-react'],
  overrides: [
    {
      test: /\.(js|jsx)$/,
      presets: ['@babel/preset-flow'],
    },
    {
      test: /\.(ts|tsx)$/,
      presets: ['@babel/preset-typescript'],
    },
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['../src/babel', { enabledEnvs: ['development', 'test', undefined] }],
  ],
};
