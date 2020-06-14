import { RuleTester } from 'eslint';
import rule from '../order';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

var ruleTester = new RuleTester();
ruleTester.run('order', rule, {
  valid: [
    `
      import { setState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(setState);
        return setState(false);
      }
    `,
    `
      import { setState, useContext } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(setState);
        // comment
        di(useContext);
        return setState(false);
      }
    `,
  ],

  invalid: [
    {
      code: `
        import { setState } from 'react';
        import { di } from 'react-magnetic-di';
  
        function MyComponent() {
          let result;
          di(setState);
          return setState(false);
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
