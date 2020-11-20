'use strict';

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      { targets: { edge: '16' }, modules: false, loose: true },
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  env: {
    test: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
};
