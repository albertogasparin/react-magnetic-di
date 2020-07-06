import { RuleTester } from 'eslint';
import rule from '../order';
import { genericCases } from './utils';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('order', rule, {
  valid: [
    // it should pass generic cases
    ...genericCases,

    // should pass if injection at the top
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        return useState(false);
      }
    `,
    // should pass if multiple injections sparated by comments
    `
      import { useState, useContext } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        // comment
        di(useContext);
        return useState(false);
      }
    `,
  ],

  invalid: [
    {
      // should fail if a declaration is before injection
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
  
        function MyComponent() {
          let result;
          di(useState);
          return useState(false);
        }
      `,
      errors: [
        {
          messageId: 'wrongOrder',
          type: 'ExpressionStatement',
        },
      ],
    },
  ],
});
