/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from '../index';

const babel = (code, { options } = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [[plugin, options]],
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    caller: { name: 'tests', supportsStaticESM: true },
  }).code;

describe('babel plugin', () => {
  it('should work in class components', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
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

  it('should work in functional components', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';
      
      const MyComponent = () => {
        di(Modal);
        return <Modal />;
      };
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work in functional components declaration', () => {
    const input = `
      import React from 'react';
      import { di, mock } from 'react-magnetic-di';
      import Modal from 'modal';
      
      function MyComponent() {
        di(Modal);
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work in functional components expression', () => {
    const input = `
      import React from 'react';
      import { di, mock } from 'react-magnetic-di';
      import Modal from 'modal';
      
      const MyComponent = function () {
        di(Modal);
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work in wrapped functional components', () => {
    const input = `
      import React, { forwardRef } from 'react';
      import { di, mock } from 'react-magnetic-di';
      import Modal from 'modal';
      
      const MyComponent = forwardRef(() => {
        di(Modal);
        return <Modal />;
      });
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should work with locally defined dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      
      const useModalStatus = () => true;
      
      const MyComponent2 = () => {
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

      function MyComponent() {
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

  it('should strip injection if not enabled environment', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
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

  it('should do injection if force enabled', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      function MyComponent() {
        di(Modal);
        return <Modal />;
      }
    `;
    process.env.BABEL_ENV = 'production';
    expect(babel(input, { options: { forceEnable: true } })).toMatchSnapshot();
    process.env.BABEL_ENV = undefined;
  });

  it('should error if used without dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      function MyComponent() {
        di();
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) arguments: must be called with at least one argument.'
    );
  });

  it('should error if all arguments are wrapped', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      function MyComponent() {
        di([Modal]);
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) arguments: must be called with plain identifiers.'
    );
  });

  it('should error if all arguments are not identifiers', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      function MyComponent() {
        di(Modal.Bla);
        return <Modal.Bla />;
      }
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) arguments: must be called with plain identifiers.'
    );
  });

  it('should error if used outside a function or a method', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      di(Modal);
      function MyComponent() {
        return <Modal />;
      }
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) call: must be inside a render function of a component.'
    );
  });

  it('should not error if not a call expression', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      const ModalMock = di.mock(Modal);

      function MyComponent() {
        return <ModalMock />;
      } 
    `;
    expect(babel(input)).toMatchSnapshot();
  });

  it('should error if di component itself', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(MyComponent);
        return <div />;
      }w
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) call: cannot inject self.'
    );
  });
});
