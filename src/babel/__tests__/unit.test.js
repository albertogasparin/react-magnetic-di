/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from '../index';

expect.addSnapshotSerializer({
  test(value) {
    return typeof value == 'string' && value.includes('[0m');
  },
  print(value, serialize, indent) {
    const cleanError = value
      .replace(/(\/[\w.-]+){2,}:/, '')
      .replace(/\[(\d+)m/gm, '')
      .replace(/[^\w\d\s()[\]{}.-/|^>]/gm, '');
    return indent(serialize(cleanError));
  },
});

const babel = (code, esm = true, pluginOptions = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [[plugin, pluginOptions]],
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    // compact: true,
    caller: { name: 'tests', supportsStaticESM: esm },
  }).code;

describe('babel plugin', () => {
  it('should work in class components', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      export class MyComponent extends Component {
        render() {
          di(Modal);
          return <Modal />;
        }
      }
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work in functional components', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';
      
      export const MyComponent = () => {
        di(Modal);
        return <Modal />;
      };
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work in functional components hoisted', () => {
    const input = `
      import React from 'react';
      import { di, mock } from 'react-magnetic-di';
      import Modal from 'modal';
      
      export function MyComponent() {
        di(Modal);
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work with locally defined dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      
      const useModalStatus = () => true;
      
      export const MyComponent2 = () => {
        di(useModalStatus);
        const status = useModalStatus();
        return status;
      };
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work with multiple dependencies across multiple components', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      const useModalStatus = () => true;

      export function MyComponent() {
        di(Modal, useModalStatus);
        const isOpen = useModalStatus();
        return isOpen && <Modal />;
      }

      class MyComponent2 extends Component {
        render() {
          di(Modal);
          return <Modal />;
        }
      };
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should error if used without dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      export function MyComponent() {
        di();
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrowErrorMatchingSnapshot();
  });

  it('should error if all arguments are wrapped', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      export function MyComponent() {
        di([Modal]);
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrowErrorMatchingSnapshot();
  });

  it('should error if all arguments are not identifiers', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      export function MyComponent() {
        di(Modal.Bla);
        return <Modal.Bla />;
      }
    `;
    expect(() => babel(input)).toThrowErrorMatchingSnapshot();
  });

  it('should error if used outside a function or a method', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      di(Modal);
      export function MyComponent() {
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrowErrorMatchingSnapshot();
  });

  it('should not error if not a call expression', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      const ModalMock = di.mock(Modal);

      export function MyComponent() {
        return <ModalMock />;
      } 
    `;
    expect(babel(input)).toMatchSnapshot();
  });
});
