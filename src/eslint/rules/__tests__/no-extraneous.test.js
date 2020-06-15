import { RuleTester } from 'eslint';
import rule from '../no-extraneous';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('no-extraneous', rule, {
  valid: [
    // it should ignore components/hooks with more than one occurrence
    `
      import { Fragment } from 'react';
      import { di } from 'react-magnetic-di';
      import { useQuery } from 'react-apollo';

      function MyComponent() {
        di(Fragment, useQuery);
        useQuery();
        return <Fragment />;
      }
    `,
  ],

  invalid: [
    {
      // it should inject imported hooks
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState, useQuery);
          return useQuery();
        }
      `,
      errors: [
        {
          messageId: 'extraneousInjectable',
          type: 'Identifier',
        },
      ],
    },
    {
      // it should inject imported React components
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(Suspense, useState, Query);
          useState();
          return <Suspense />;
        }
      `,
      errors: [
        {
          messageId: 'extraneousInjectable',
          type: 'Identifier',
        },
      ],
    },
  ],
});
