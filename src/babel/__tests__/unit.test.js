/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from '../index';

const babel = (
  code,
  { options, assumptions, prePlugins = [], postPlugins = [], presets = [] } = {}
) =>
  transform(code, {
    filename: 'noop.js',
    presets: [
      ['@babel/preset-react', { development: false, pragma: '__jsx' }],
      ...presets,
    ],
    plugins: [...prePlugins, [plugin, options], ...postPlugins],
    assumptions,
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
          const [_Modal] = _di(MyComponent, Modal);
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
        const [_Modal] = _di(MyComponent, Modal);
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
        const [_Modal] = _di(MyComponent, Modal);
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
        const [_Modal] = _di(MyComponent, Modal);
        return __jsx(_Modal, null);
      };"
    `);
  });

  describe('shadowed variables', () => {
    it('simple case: should remove', () => {
      const input = `            
      import LinkifyIt from 'linkify-it';
      const linkify = (state) => {
        // cannot refer to the function location ^ as there is a local variable shadowing it
        const linkify = new LinkifyIt();
      }
    `;
      expect(babel(input)).toMatchInlineSnapshot(`
              "import { di as _di } from "react-magnetic-di";
              import LinkifyIt from 'linkify-it';
              const linkify = state => {
                const [_LinkifyIt] = _di(null, LinkifyIt);
                // cannot refer to the function location ^ as there is a local variable shadowing it
                const linkify = new _LinkifyIt();
              };"
          `);
    });

    it('nested function case: should keep', () => {
      const input = `            
      import LinkifyIt from 'linkify-it';
      const linkify = (state) => {
        useEffect(() => {        
          const linkify = new LinkifyIt();
        });
      }
    `;
      expect(babel(input)).toMatchInlineSnapshot(`
        "import { di as _di } from "react-magnetic-di";
        import LinkifyIt from 'linkify-it';
        const linkify = state => {
          const [_LinkifyIt] = _di(linkify, LinkifyIt);
          useEffect(() => {
            const [_LinkifyIt2] = _di(null, _LinkifyIt);
            const linkify = new _LinkifyIt2();
          });
        };"
      `);
    });

    it('block case: should keep', () => {
      const input = `            
      import LinkifyIt from 'linkify-it';
      const linkify = (state) => {
        if (ff('xx')) {   
           const linkify = new LinkifyIt();
        }
      }
    `;
      expect(babel(input)).toMatchInlineSnapshot(`
        "import { di as _di } from "react-magnetic-di";
        import LinkifyIt from 'linkify-it';
        const linkify = state => {
          const [_LinkifyIt] = _di(linkify, LinkifyIt);
          if (ff('xx')) {
            const linkify = new _LinkifyIt();
          }
        };"
      `);
    });

    it('mixed case: should keep', () => {
      const input = `            
      import LinkifyIt from 'linkify-it';
      import LinkifyThat from 'linkify-it';
      const linkify = (state) => {
        const linkify = new LinkifyIt();
        if (ff('xx')) {   
           const linkify = new LinkifyThat();        
        }
      }
    `;
      expect(babel(input)).toMatchInlineSnapshot(`
        "import { di as _di } from "react-magnetic-di";
        import LinkifyIt from 'linkify-it';
        import LinkifyThat from 'linkify-it';
        const linkify = state => {
          const [_LinkifyIt, _LinkifyThat] = _di(null, LinkifyIt, LinkifyThat);
          const linkify = new _LinkifyIt();
          if (ff('xx')) {
            const linkify = new _LinkifyThat();
          }
        };"
      `);
    });
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
        const [_Modal, _myGlobal] = di(MyComponent, Modal, myGlobal);
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
        const [_Modal] = _di(null, Modal);
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
        const [_MyStatus, _useModalStatus] = _di(MyComponent, MyStatus, useModalStatus);
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
        const [_useModalStatus] = _di(MyComponent, useModalStatus);
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
        const [_useModalStatus, _useParentStatus] = _di(MyComponent, useModalStatus, useParentStatus);
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
        const [_Modal, _useModalStatus] = _di(MyComponent, Modal, useModalStatus);
        const isOpen = _useModalStatus();
        return isOpen && __jsx(_Modal, null);
      }
      class MyComponent2 extends Component {
        render() {
          const [_Modal] = _di(MyComponent2, Modal);
          return __jsx(_Modal, null);
        }
      }"
    `);
  });

  it('should work with dependencies used in nested functions', () => {
    const input = `
      import { useEffect } from 'react';
      import { loadModal } from 'modal';

      function MyComponent () {
        useEffect(() => {
          loadModal();
        });
      }

      const withLoad = () => () => {
        loadModal();
      }

      const withAfter = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                loadModal();
              });
            });
          });
        });
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import { useEffect } from 'react';
      import { loadModal } from 'modal';
      function MyComponent() {
        const [_loadModal, _useEffect] = _di(MyComponent, loadModal, useEffect);
        _useEffect(() => {
          const [_loadModal2] = _di(null, _loadModal);
          _loadModal2();
        });
      }
      const withLoad = () => {
        const [_loadModal] = _di(withLoad, loadModal);
        return () => {
          const [_loadModal2] = _di(null, _loadModal);
          _loadModal2();
        };
      };
      const withAfter = () => {
        const [_loadModal] = _di(withAfter, loadModal);
        requestAnimationFrame(() => {
          const [_loadModal2] = _di(null, _loadModal);
          requestAnimationFrame(() => {
            const [_loadModal3] = _di(null, _loadModal2);
            requestAnimationFrame(() => {
              const [_loadModal4] = _di(null, _loadModal3);
              requestAnimationFrame(() => {
                const [_loadModal5] = _di(null, _loadModal4);
                _loadModal5();
              });
            });
          });
        });
      };"
    `);
  });

  it('should skip auto injection if file excluded regexp', () => {
    const input = `
      import { useModal, config } from 'modal';
      import { di } from 'react-magnetic-di';

      export function useMyModal() {
        return useModal();
      }
      export function useMyModalForced() {
        di();
        useEffect(() => {
          if (config) return;
        })
        return useModal();
      }
    `;
    const options = { exclude: [/noop\.js/] };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import { useModal, config } from 'modal';
      import { di } from 'react-magnetic-di';
      export function useMyModal() {
        return useModal();
      }
      export function useMyModalForced() {
        const [_config, _useModal] = di(useMyModalForced, config, useModal);
        useEffect(() => {
          if (_config) return;
        });
        return _useModal();
      }"
    `);
  });

  it('should skip injection if file excluded string', () => {
    const input = `
      import { useModal } from 'modal';

      export function useMyModal() {
        return useModal();
      }
    `;
    const options = { exclude: ['noop.js'] };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import { useModal } from 'modal';
      export function useMyModal() {
        return useModal();
      }"
    `);
  });

  it('should strip injection if not enabled environment', () => {
    const input = `
      import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';

      function MyComponent() {
        di(myGlobal);
        return <Modal />;
      }
    `;
    const options = { enabledEnvs: ['development'] };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import React, { Component } from 'react';
      import { di } from 'react-magnetic-di';
      import Modal from 'modal';
      function MyComponent() {
        return __jsx(Modal, null);
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

  it('should skip processing the file if di() already processed', () => {
    const input = `
      import { di as _di } from "react-magnetic-di";
      import React from 'react';
      import Modal from 'modal';

      function MyComponent() {
        const [_Modal] = _di(MyComponent, Modal);
        return <_Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import React from 'react';
      import Modal from 'modal';
      function MyComponent() {
        const [_Modal] = _di(MyComponent, Modal);
        return __jsx(_Modal, null);
      }"
    `);
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
        const [_Modal] = _di(MyComponentFn, Modal);
        return __jsx(_Modal, null);
      }
      const MyComponentWr = /*#__PURE__*/memo(function MyComponent() {
        const [_Modal] = _di(MyComponent, Modal);
        return __jsx(_Modal, null);
      });
      const MyComponentA = () => {
        const [_Modal] = _di(MyComponentA, Modal);
        return __jsx(_Modal, null);
      };
      const MyComponentAw = /*#__PURE__*/memo(() => {
        const [_Modal] = _di(null, Modal);
        return __jsx(_Modal, null);
      });
      const MyComponentTr = true ? () => {
        const [_Modal] = _di(null, Modal);
        return __jsx(_Modal, null);
      } : /*#__PURE__*/memo( /*#__PURE__*/forwardRef(() => {
        const [_Modal] = _di(null, Modal);
        return __jsx(_Modal, null);
      }));
      class Foo {
        renderModal = () => {
          const [_Modal] = _di(Foo, Modal);
          return __jsx(_Modal, null);
        };
        render() {
          const [_Modal] = _di(Foo, Modal);
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
        const [_useModalStatus] = _di(useStatus, useModalStatus);
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

  it('should not di computed properties keys', () => {
    const input = `
      import { FOO, BAR, moo } from 'foo';
      const baz = {
        [FOO.A]: 1,
        get [FOO.B]() {},
        get [FOO.C]() {
          return {
            get [FOO.C]() {}
          };
        },
        get [BAR]() {
          return FOO.C;
        },
        set [BAR](v) {
          return BAR(v);
        },
        set [moo()](v) {
          return moo(v);
        }
      };
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import { FOO, BAR, moo } from 'foo';
      const baz = {
        [FOO.A]: 1,
        get [FOO.B]() {},
        get [FOO.C]() {
          const [_FOO] = _di(null, FOO);
          return {
            get [_FOO.C]() {}
          };
        },
        get [BAR]() {
          const [_FOO] = _di(null, FOO);
          return _FOO.C;
        },
        set [BAR](v) {
          const [_BAR] = _di(null, BAR);
          return _BAR(v);
        },
        set [moo()](v) {
          const [_moo] = _di(null, moo);
          return _moo(v);
        }
      };"
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

  it('should not di if di-ignore comment is found', () => {
    const input = `
      import { useState } from 'react';
      
      const useModalStatus = () => {
        // di-ignore
        return useState();
      };

      const useModalStatus2 = () =>
        // di-ignore
        useState();

      function useM3 () {
        /* di-ignore */
        useState()
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { useState } from 'react';
      const useModalStatus = () => {
        // di-ignore
        return useState();
      };
      const useModalStatus2 = () =>
      // di-ignore
      useState();
      function useM3() {
        /* di-ignore */
        useState();
      }"
    `);
  });

  it('should merge with provided dependencies', () => {
    const input = `
      import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal, { useModal, config } from 'modal';

      function MyComponent() {
        di(config);
        di(myGlobal);
        useModal(config, myGlobal);
        return <Modal />;
      }
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import React from 'react';
      import { di } from 'react-magnetic-di';
      import Modal, { useModal, config } from 'modal';
      function MyComponent() {
        const [_Modal, _config, _myGlobal, _useModal] = di(MyComponent, Modal, config, myGlobal, useModal);
        _useModal(_config, _myGlobal);
        return __jsx(_Modal, null);
      }"
    `);
  });

  it('shold work with other plugin manipulating imports', () => {
    const input = `
      import { useModal } from 'modal';

      function useMyModal() {
        return (() => {
          return useModal();
        })
      }
    `;
    expect(
      babel(input, {
        postPlugins: ['@babel/plugin-transform-modules-commonjs'],
      })
    ).toMatchInlineSnapshot(`
      ""use strict";

      var _reactMagneticDi = require("react-magnetic-di");
      var _modal = require("modal");
      function useMyModal() {
        const [_useModal] = (0, _reactMagneticDi.di)(useMyModal, _modal.useModal);
        return () => {
          const [_useModal2] = (0, _reactMagneticDi.di)(null, _useModal);
          return _useModal2();
        };
      }"
    `);
  });

  it('shold work with other plugin manipulating default arguments', () => {
    const input = `
      import { useModal } from 'modal';

      function useMyModal({ hook = useModal }) {
        return hook();
      }
    `;
    expect(
      babel(input, {
        postPlugins: ['@babel/plugin-transform-parameters'],
      })
    ).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import { useModal } from 'modal';
      function useMyModal(_ref) {
        let {
          hook = useModal
        } = _ref;
        const [_useModal] = _di(useMyModal, useModal);
        return hook();
      }"
    `);
  });

  it('shold work with other plugin manipulating classes', () => {
    const input = `
    import Modal, { config } from 'modal';

    function createClass() {
      return class MyModal extends Modal {
        static displayName = 'MyModal';
        getConfig() {
          return config;
        }
      }
      return MyModal;
    }
    `;
    expect(
      babel(input, {
        assumptions: { setPublicClassFields: true },
        prePlugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties'],
        ],
      })
    ).toMatchInlineSnapshot(`
      "import { di as _di } from "react-magnetic-di";
      import Modal, { config } from 'modal';
      function createClass() {
        var _class;
        const [_Modal, _config] = _di(createClass, Modal, config);
        return _class = class MyModal extends _Modal {
          getConfig() {
            const [_config2] = _di(MyModal, _config);
            return _config2;
          }
        }, _class.displayName = 'MyModal', _class;
        return MyModal;
      }"
    `);
  });

  it('shold work with typescript preset', () => {
    const input = `
    import { di } from 'react-magnetic-di';
    import { useModal } from 'modal';

    export const withModal = (Comp) => {
      return (() => {
        di(Comp);
        useModal();
        return <Comp />;
      }) as any
    }
    `;
    expect(
      babel(input, {
        presets: [
          ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
        ],
      })
    ).toMatchInlineSnapshot(`
      "import { di } from 'react-magnetic-di';
      import { useModal } from 'modal';
      export const withModal = Comp => {
        const [_useModal] = di(withModal, useModal);
        return () => {
          const [_Comp, _useModal2] = di(null, Comp, _useModal);
          _useModal2();
          return __jsx(_Comp, null);
        };
      };"
    `);
  });

  it('should add jest.mock if matching any defaultMockedModules pattern', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal from 'modal';
    const ModalDi = injectable(Modal, () => '');
    `;
    const options = {
      mockModules: 'jest',
      defaultMockedModules: ['modal'],
    };
    expect(babel(input, { options, presets: ['jest'] })).toMatchInlineSnapshot(`
      "_getJestObj().mock("modal");
      function _getJestObj() {
        const {
          jest
        } = require("@jest/globals");
        _getJestObj = () => jest;
        return jest;
      }
      import { injectable } from 'react-magnetic-di';
      import Modal from 'modal';
      const ModalDi = injectable(Modal, () => '');"
    `);
  });

  it('should add jest.mock if explicit module flag', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal from 'modal';
    const ModalDi = injectable(Modal, () => '', {
      module: true
    });
    `;
    const options = { mockModules: 'jest' };
    expect(babel(input, { options, presets: ['jest'] })).toMatchInlineSnapshot(`
      "_getJestObj().mock("modal");
      function _getJestObj() {
        const {
          jest
        } = require("@jest/globals");
        _getJestObj = () => jest;
        return jest;
      }
      import { injectable } from 'react-magnetic-di';
      import Modal from 'modal';
      const ModalDi = injectable(Modal, () => '', {
        module: true
      });"
    `);
  });

  it('should add one jest.mock if multiple injectables are defined for the same source', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal, { useModal } from 'modal';
    const ModalDi = injectable(Modal, () => '');
    const useModalDi = injectable(useModal, () => '');
    `;
    const options = {
      mockModules: 'jest',
      defaultMockedModules: { include: [/modal/] },
    };
    expect(babel(input, { options, presets: ['jest'] })).toMatchInlineSnapshot(`
      "_getJestObj().mock("modal");
      function _getJestObj() {
        const {
          jest
        } = require("@jest/globals");
        _getJestObj = () => jest;
        return jest;
      }
      import { injectable } from 'react-magnetic-di';
      import Modal, { useModal } from 'modal';
      const ModalDi = injectable(Modal, () => '');
      const useModalDi = injectable(useModal, () => '');"
    `);
  });

  it('should not add jest.mock if multiple imports not all injected', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal, { useModal } from 'modal';
    const ModalDi = injectable(Modal, () => '');
    const ModalDi2 = injectable(Modal, () => '');
    `;
    const options = {
      mockModules: 'jest',
      defaultMockedModules: { include: [/modal/] },
    };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import { injectable } from 'react-magnetic-di';
      import Modal, { useModal } from 'modal';
      const ModalDi = injectable(Modal, () => '');
      const ModalDi2 = injectable(Modal, () => '');"
    `);
  });

  it('should add jest.mock when module flag is true even if multiple imports not all injected ', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal, { useModal } from 'modal';
    const ModalDi = injectable(Modal, () => '', { module: true });
    const useModalDi = injectable(useModal, () => '');
    `;
    const options = { mockModules: 'jest' };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import { injectable } from 'react-magnetic-di';
      import Modal, { useModal } from 'modal';
      jest.mock("modal");
      const ModalDi = injectable(Modal, () => '', {
        module: true
      });
      const useModalDi = injectable(useModal, () => '');"
    `);
  });

  it('should not add jest.mock if module flag is false', () => {
    const input = `
    import { injectable } from 'react-magnetic-di';
    import Modal, { useModal } from 'modal';
    const ModalDi = injectable(Modal, () => '', { 
      module: false
    });
    const useModalDi = injectable(useModal, () => '');
    `;
    const options = {
      mockModules: 'jest',
      defaultMockedModules: { include: [/modal/] },
    };
    expect(babel(input, { options })).toMatchInlineSnapshot(`
      "import { injectable } from 'react-magnetic-di';
      import Modal, { useModal } from 'modal';
      const ModalDi = injectable(Modal, () => '', {
        module: false
      });
      const useModalDi = injectable(useModal, () => '');"
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
