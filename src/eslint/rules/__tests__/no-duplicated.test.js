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
    // is should pass if only one occurrence
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        return useState(false);
      }
    `,
    // is should pass if only one occurrence when renamed
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
    // is should pass if multiple occurrences on different components
    `
      import { useContext } from 'react';
      import { di } from 'react-magnetic-di';
      import { useContext as useMyContext } from './my-stuff';

      function MyComponent() {
        di(useContext, useMyContext);
        useMyContext();
        return useContext();
      }

      function MyComponentTwo() {
        di(useContext);
        return useContext();
      }
    `,
  ],

  invalid: [
    {
      // is should error if two occurrences on same di
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
      // is should error if two occurrences on different di
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
