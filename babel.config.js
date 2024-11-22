'use strict';

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      { targets: { chrome: '80' }, modules: false, loose: true },
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
  plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
  env: {
    test: {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
};
