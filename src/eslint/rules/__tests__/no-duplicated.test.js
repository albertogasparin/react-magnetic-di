import { RuleTester } from 'eslint';
import rule from '../no-duplicate';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

var ruleTester = new RuleTester();
ruleTester.run('no-duplicate', rule, {
  valid: [
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        return useState(false);
      }
    `,
    `
      import { useContext } from 'react';
      import { di } from 'react-magnetic-di';
      import { useContext as useMyContext } from './my-stuff';

      function MyComponent() {
        di(useContext, useMyContext);
        useMyContext();
        return useContext();
      }
    `,
  ],

  invalid: [
    {
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';

        function MyComponent() {
          di(useState, useState);
          return useState(false);
        }
      `,
      errors: [
        {
          messageId: 'duplicatedInjectable',
          type: 'Identifier',
        },
      ],
    },
    {
      code: `
        import { useState, useContext } from 'react';
        import { di } from 'react-magnetic-di';

        function MyComponent() {
          di(useContext, useState);
          di(useState);
          return useState(false);
        }
      `,
      errors: [
        {
          messageId: 'duplicatedInjectable',
          type: 'Identifier',
        },
      ],
    },
  ],
});
