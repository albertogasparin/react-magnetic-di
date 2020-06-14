import { RuleTester } from 'eslint';
import rule from '../exhaustive-inject';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('exhaustive-inject', rule, {
  valid: [
    // it should ignore built-in react components
    `
      import { Fragment } from 'react';
      import { di } from 'react-magnetic-di';
      import { useQuery } from 'react-apollo';

      function MyComponent() {
        di(useQuery);
        useQuery();
        return <Fragment />;
      }
    `,
    // it should ignore not stateful react hooks
    `
      import { useMemo, useContext } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useContext);
        useMemo();
        return useContext();
      }
    `,
    {
      // it should ignore components specified in options
      code: `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      options: [{ ignore: ['Query'] }],
    },
    {
      // it should ignore hooks specified in options
      code: `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          useMemo();
          return useQuery();
        }
      `,
      options: [{ ignore: ['useQuery'] }],
    },
  ],

  invalid: [
    {
      // it should inject imported hooks
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return useQuery();
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState, useQuery);
          useState();
          return useQuery();
        }
      `,
    },
    {
      // it should inject imported React components
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState, Query);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
    },
    {
      // it should inject stateful react hooks
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(Query);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(Query, useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
    },
  ],
});
