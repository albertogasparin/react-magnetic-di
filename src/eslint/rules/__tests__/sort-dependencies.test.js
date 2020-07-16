import { RuleTester } from 'eslint';
import rule from '../sort-dependencies';
import { genericCases } from './utils';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('sort-dependencies', rule, {
  valid: [
    // it should pass generic cases
    ...genericCases,

    // is should pass if only one argument
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        return null;
      }
    `,
    // is should pass if multiple arguments
    `
      import { useContext, useState } from 'react';
      import { di } from 'react-magnetic-di';
      import { useContext as useMyContext, MyStuff, MyStuff2 } from './my-stuff';

      function MyComponent() {
        di(MyStuff, MyStuff2, useContext, useMyContext, useState);
        return null;
      }
    `,
    // should group components (first) and hooks/functions (second)
    `
      import { useContext, useState } from 'react';
      import { di } from 'react-magnetic-di';
      import { MyStuff, ZooStuff, fetch } from './my-stuff';

      export const MyComponent = ({ src, useSmall = true }) => {
        di(MyStuff, ZooStuff, fetch, useContext, useState);
        return <MyStuff src={src} useSmall={useSmall} />;
      }
    `,
  ],

  invalid: [
    {
      // it should re-order inline
      code: `
        import { useContext, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query, useQuery, OtherQuery } from 'react-apollo';

        function MyComponent() {
          di(OtherQuery, useState, Query, useQuery, useContext);
          return null;
        }
      `,
      errors: [
        {
          messageId: 'unsortedInjectable',
          type: 'Identifier',
        },
        {
          messageId: 'unsortedInjectable',
          type: 'Identifier',
        },
      ],
      output: `
        import { useContext, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query, useQuery, OtherQuery } from 'react-apollo';

        function MyComponent() {
          di(OtherQuery, Query, useContext, useQuery, useState);
          return null;
        }
      `,
    },
    {
      // it should re-order new lines
      code: `
        import { useContext, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query, OtherQuery } from 'react-apollo';

        function MyComponent() {
          di(
            Query,
            useContext,
            useState,
            OtherQuery
          );
          return null;
        }
      `,
      errors: [
        {
          messageId: 'unsortedInjectable',
          type: 'Identifier',
        },
      ],
      output: `
        import { useContext, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query, OtherQuery } from 'react-apollo';

        function MyComponent() {
          di(
            OtherQuery,
            Query,
            useContext,
            useState
          );
          return null;
        }
      `,
    },
  ],
});
