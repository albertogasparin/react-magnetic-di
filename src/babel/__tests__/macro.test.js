/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from 'babel-plugin-macros';

const moduleAlias = {
  alias: { 'react-magnetic-di/macro': './src/babel/macro.js' },
};

const babel = (code, { options, env } = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [
      ['module-resolver', moduleAlias],
      [plugin, options],
    ],
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
        import { di } from 'react-magnetic-di/macro';
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

  it('should work with renamed import and functional components', () => {
    const input = `
        import React from 'react';
        import { di as injectable, withDi } from 'react-magnetic-di/macro';
        import Modal from 'modal';

        const MyComponent = withDi(() => {
          injectable(Modal);
          return <Modal />;
        }, []);
      `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should strip injection if not enabled environment', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di/macro';
      import Modal from 'modal';

      function MyComponent() {
        di(Modal);
        return <Modal />;
      }
    `;
    process.env.BABEL_ENV = 'production';
    expect(babel(input)).toMatchSnapshot();
    process.env.BABEL_ENV = undefined;
  });
});
