/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from '../index';

const babel = (code, { options, extraPlugins = [] } = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [[plugin, options], ...extraPlugins],
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    caller: { name: 'tests', supportsStaticESM: true },
  }).code;

describe('babel plugin', () => {
  it('should work in class components', () => {
    const input = `
      import React, { Component } from 'react';
      import Modal from 'modal';

      class MyComponent extends Component {
        render() {
          return <Modal />;
        }
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React, { Component } from 'react';
      import Modal from 'modal';
      class MyComponent extends Component {
        render() {
          const [_Modal] = _di([Modal], MyComponent);
          return __jsx(_Modal, null);
        }
      }"
    `);
  });

  it('should work in functional components', () => {
    const input = `
      import React from 'react';
      import Modal from 'modal';
      
      const MyComponent = () => <Modal />;
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      import Modal from 'modal';
      const MyComponent = () => {
        const [_Modal] = _di([Modal], MyComponent);
        return __jsx(_Modal, null);
      };"
    `);
  });

  it('should work in functional components declaration', () => {
    const input = `
      import React from 'react';
      import Modal from 'modal';
      
      function MyComponent() {
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      import Modal from 'modal';
      function MyComponent() {
        const [_Modal] = _di([Modal], MyComponent);
        return __jsx(_Modal, null);
      }"
    `);
  });

  it('should work in functional components expression', () => {
    const input = `
      import React from 'react';
      import Modal from 'modal';
      
      const MyComponent = function () {
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      import Modal from 'modal';
      const MyComponent = function () {
        const [_Modal] = _di([Modal], MyComponent);
        return __jsx(_Modal, null);
      };"
    `);
  });

  it('should work and maintain location if manually declared', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';
      
      export const MyComponent = function () {
        const something = '';
        // comment
        di(myGlobal);
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';
      export const MyComponent = function () {
        const something = '';
        // comment
        const [_Modal, _myGlobal] = di([Modal, myGlobal], MyComponent);
        return __jsx(_Modal, null);
      };"
    `);
  });

  it('should work in wrapped functional components', () => {
    const input = `
      import React, { forwardRef } from 'react';
      import Modal from 'modal';
      
      const MyComponent = forwardRef(() => {
        return <Modal />;
      });
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React, { forwardRef } from 'react';
      import Modal from 'modal';
      const MyComponent = /*#__PURE__*/forwardRef(() => {
        const [_Modal] = _di([Modal], null);
        return __jsx(_Modal, null);
      });"
    `);
  });

  it('should work with locally defined+exported inline dependencies', () => {
    const input = `
      import React from 'react';
      
      export const useModalStatus = () => true;
      export class MyStatus {}
      
      const MyComponent = () => {
        return useModalStatus() || new MyStatus();
      };
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      export const useModalStatus = () => true;
      export class MyStatus {}
      const MyComponent = () => {
        const [_MyStatus, _useModalStatus] = _di([MyStatus, useModalStatus], MyComponent);
        return _useModalStatus() || new _MyStatus();
      };"
    `);
  });

  it('should work with locally defined+exported default dependencies', () => {
    const input = `
      import React from 'react';
      
      export default function useModalStatus() {}
      
      const MyComponent = () => {
        return useModalStatus();
      };
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      export default function useModalStatus() {}
      const MyComponent = () => {
        const [_useModalStatus] = _di([useModalStatus], MyComponent);
        return _useModalStatus();
      };"
    `);
  });

  it('should work with locally defined+exported later dependencies', () => {
    const input = `
      import React from 'react';
      
      function useModalStatus() {}
      function useParentStatus() {}
      
      const MyComponent = () => {
        return useParentStatus() || useModalStatus();
      };

      export { useModalStatus };
      export default useParentStatus;
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      function useModalStatus() {}
      function useParentStatus() {}
      const MyComponent = () => {
        const [_useModalStatus, _useParentStatus] = _di([useModalStatus, useParentStatus], MyComponent);
        return _useParentStatus() || _useModalStatus();
      };
      export { useModalStatus };
      export default useParentStatus;"
    `);
  });

  it('should work with multiple dependencies across multiple components', () => {
    const input = `
      import React, { Component } from 'react';
      import Modal from 'modal';

      export const useModalStatus = () => true;

      function MyComponent() {
        const isOpen = useModalStatus();
        return isOpen && <Modal />;
      }

      class MyComponent2 extends Component {
        render() {
          return <Modal />;
        }
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React, { Component } from 'react';
      import Modal from 'modal';
      export const useModalStatus = () => true;
      function MyComponent() {
        const [_Modal, _useModalStatus] = _di([Modal, useModalStatus], MyComponent);
        const isOpen = _useModalStatus();
        return isOpen && __jsx(_Modal, null);
      }
      class MyComponent2 extends Component {
        render() {
          const [_Modal] = _di([Modal], MyComponent2);
          return __jsx(_Modal, null);
        }
      }"
    `);
  });

  it('should skip injection if file excluded', () => {
    const input = `
      import { useModal } from 'modal';

      export function useMyModal() {
        return useModal();
      }
    `;
    expect(babel(input, { options: { exclude: /noop\.js/ } }))
      .toMatchInlineSnapshot(`
      "import { useModal } from 'modal';
      export function useMyModal() {
        return useModal();
      }"
    `);
  });

  it('should error if arguments are wrapped', () => {
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

  it('should error if arguments are not identifiers', () => {
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

  it('should error if di component itself', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(MyComponent);
        return <div />;
      }
    `;
    expect(() => babel(input)).toThrow(
      'Invalid di(...) call: cannot inject self.'
    );
  });

  it('should add di to all top level functions', () => {
    const input = `
      import React, { memo, forwardRef } from 'react';
      import { Modal } from 'modal';

      function MyComponentFn() {
        return <Modal />;
      }

      const MyComponentWr = memo(function MyComponent() {
        return <Modal />;
      });

      const MyComponentA = () => <Modal />;
      
      const MyComponentAw = memo(() => <Modal />);

      const MyComponentTr = true ? (() => <Modal />) : memo(forwardRef(() => <Modal />));

      class Foo {
        renderModal = () => <Modal />;
        render() {
          return <Modal />;
        }
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React, { memo, forwardRef } from 'react';
      import { Modal } from 'modal';
      function MyComponentFn() {
        const [_Modal] = _di([Modal], MyComponentFn);
        return __jsx(_Modal, null);
      }
      const MyComponentWr = /*#__PURE__*/memo(function MyComponent() {
        const [_Modal] = _di([Modal], MyComponent);
        return __jsx(_Modal, null);
      });
      const MyComponentA = () => {
        const [_Modal] = _di([Modal], MyComponentA);
        return __jsx(_Modal, null);
      };
      const MyComponentAw = /*#__PURE__*/memo(() => {
        const [_Modal] = _di([Modal], null);
        return __jsx(_Modal, null);
      });
      const MyComponentTr = true ? () => {
        const [_Modal] = _di([Modal], null);
        return __jsx(_Modal, null);
      } : /*#__PURE__*/memo( /*#__PURE__*/forwardRef(() => {
        const [_Modal] = _di([Modal], null);
        return __jsx(_Modal, null);
      }));
      class Foo {
        renderModal = () => {
          const [_Modal] = _di([Modal], Foo);
          return __jsx(_Modal, null);
        };
        render() {
          const [_Modal] = _di([Modal], Foo);
          return __jsx(_Modal, null);
        }
      }"
    `);
  });

  it('should not inject locally defined functions', () => {
    const input = `
      import React from 'react';
      
      export const useModalStatus = () => true;
      const parentStatus = () => true;
      
      export const useStatus = () => {
        return useModalStatus() || parentStatus();
      };
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      export const useModalStatus = () => true;
      const parentStatus = () => true;
      export const useStatus = () => {
        const [_useModalStatus] = _di([useModalStatus], useStatus);
        return _useModalStatus() || parentStatus();
      };"
    `);
  });

  it('should not di built-ins', () => {
    const input = `
      import React from 'react';
      
      const useModalStatus = ({
        fooArg = () => 'true'
      }) => {
        return Boolean(fooArg());
      };
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import React from 'react';
      const useModalStatus = ({
        fooArg = () => 'true'
      }) => {
        return Boolean(fooArg());
      };"
    `);
  });

  it('should not di component itself class', () => {
    const input = `
      export default class MyComponent {
        static foo() {
          return MyComponent.bar()
        }
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "export default class MyComponent {
        static foo() {
          return MyComponent.bar();
        }
      }"
    `);
  });

  it('should not di component itself function', () => {
    const input = `
      export function useModalStatus() {
        return useModalStatus();
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "export function useModalStatus() {
        return useModalStatus();
      }"
    `);
  });

  it('should not di injectables', () => {
    const input = `
      import { useState } from 'react';
      import { useModal } from 'modal';
      
      const useModalDi = injectable(useModal, () => {
        return useState({});
      });
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { useState } from 'react';
      import { useModal } from 'modal';
      const useModalDi = injectable(useModal, () => {
        return useState({});
      });"
    `);
  });

  it('should merge with provided dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal, { useModal, config } from 'modal';

      function MyComponent() {
        di(config, myGlobal);
        useModal() 
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal, { useModal, config } from 'modal';
      function MyComponent() {
        const [_Modal, _config, _myGlobal, _useModal] = di([Modal, config, myGlobal, useModal], MyComponent);
        _useModal();
        return __jsx(_Modal, null);
      }"
    `);
  });

  it('shold work with other plugin manipulating imports', () => {
    const input = `
      import { useModal } from 'modal';

      function useMyModal() {
        return useModal();
      }
    `;
    expect(
      babel(input, { extraPlugins: ['transform-es2015-modules-commonjs'] })
    ).toMatchInlineSnapshot(`
      ""use strict";

      var _reactMagneticDi = require("react-magnetic-di");
      var _modal = require("modal");
      function useMyModal() {
        const [_useModal] = (0, _reactMagneticDi.di)([_modal.useModal], useMyModal);
        return _useModal();
      }"
    `);
  });
});

describe('displayName', () => {
  it('should be correct for variable declaration', () => {
    const input = `
      import { withDi } from 'react-magnetic-di';

      const Example = withDi(() => null, []);
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from 'react-magnetic-di';
      const Example = withDi(() => null, []);
      Example.displayName = "Example";"
    `);
  });

  it('should be correct for named export', () => {
    const input = `
      import { withDi } from 'react-magnetic-di';

      export const Example = withDi(() => null, []);
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from 'react-magnetic-di';
      export const Example = withDi(() => null, []);
      Example.displayName = "Example";"
    `);
  });

  it('should not be changed for default export', () => {
    const input = `
      import { withDi } from 'react-magnetic-di';

      export default withDi(() => null, []);
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from 'react-magnetic-di';
      export default withDi(() => null, []);"
    `);
  });

  it('should be correct for variable declaration with renamed import', () => {
    const input = `
      import { withDi as withInjection } from 'react-magnetic-di';

      export const Example = withInjection(() => null, []);
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi as withInjection } from 'react-magnetic-di';
      export const Example = withInjection(() => null, []);
      Example.displayName = "Example";"
    `);
  });

  it('should ignore locations where it is wrapped', () => {
    const input = `
      import { withDi } from 'react-magnetic-di';
      import { withIntl } from 'react-intl';

      export const Example = withIntl(withDi(() => null, []));
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from 'react-magnetic-di';
      import { withIntl } from 'react-intl';
      export const Example = withIntl(withDi(() => null, []));"
    `);
  });

  it('should not be duplicated if set elsewhere', () => {
    const input = `
      import { withDi } from 'react-magnetic-di';

      const Example = withDi(() => null, []);
      Example.displayName = 'CustomName';
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from 'react-magnetic-di';
      const Example = withDi(() => null, []);
      Example.displayName = 'CustomName';"
    `);
  });
});
