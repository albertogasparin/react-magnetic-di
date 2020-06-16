/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from 'babel-plugin-macros';

const babel = (code, { options, env } = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [[plugin, options]],
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    caller: { name: 'tests', supportsStaticESM: true },
    envName: env,
  }).code;

describe('macro plugin', () => {
  it('should work in class components', () => {
    const input = `
        import React, { Component } from 'react';
        import di from './src/babel/macro';
        import Modal from 'modal';
  
        class MyComponent extends Component {
          render() {
            di(Modal);
            return <Modal />;
          }
        }
      `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work with renamed default and functional components', () => {
    const input = `
        import React from 'react';
        import injectable from './src/babel/macro';
        import Modal from 'modal';

        const MyComponent = () => {
          injectable(Modal);
          return <Modal />;
        };
      `;
    expect(babel(input)).toMatchSnapshot();
  });
});
