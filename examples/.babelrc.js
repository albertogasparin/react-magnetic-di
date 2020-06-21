'use strict';

module.exports = {
  extends: '../babel.config.js',
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-flow'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      'module-resolver',
      { alias: { 'react-magnetic-di/macro': './src/babel/macro.js' } },
    ],
    '../src/babel',
    'macros',
  ],
};
