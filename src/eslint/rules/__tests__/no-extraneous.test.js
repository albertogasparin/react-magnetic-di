import { RuleTester } from 'eslint';
import rule from '../no-extraneous';
import { genericCases } from './utils';

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
    // it should pass generic cases
    ...genericCases,

    // it should pass with components/hooks with more than one occurrence
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
      // it should fail if hook dependency is not used
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState, useQuery);
          useState();
          return <div />;
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
      // it should fail if component dependency is not used
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState, Query);
          useState();
          return <div />;
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
