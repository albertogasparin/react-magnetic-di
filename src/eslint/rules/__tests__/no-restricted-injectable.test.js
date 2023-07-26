import { RuleTester } from 'eslint';
import rule from '../no-restricted-injectable';
import { genericCases } from './utils';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('no-restricted-injectable', rule, {
  valid: [
    // it should pass generic cases
    ...genericCases,

    // should pass if import is not restricted
    `
      import { useModal } from 'modal';
      import { injectable } from 'react-magnetic-di';

      injectable(useModal, () => {})
    `,
    {
      // should pass if import name is not restricted
      code: `
        import { Suspense } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(Suspense, () => null)
      `,
      options: [{ paths: [{ name: 'react', importNames: ['useState'] }] }],
    },
  ],

  invalid: [
    {
      // should fail if whole module is not allowed
      code: `
        import { Suspense } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(Suspense, () => null)
      `,
      options: [
        {
          paths: [{ name: 'react' }],
        },
      ],
      errors: [{ type: 'CallExpression', messageId: 'restricted' }],
    },
    {
      // should fail if specific import name is not allowed
      code: `
        import { useState } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(useState, () => null)
      `,
      options: [
        {
          paths: [
            {
              name: 'react',
              importNames: ['useState'],
              message:
                'For instance `const useLoading = () => useState(false)`',
            },
          ],
        },
      ],
      errors: [{ type: 'CallExpression', message: /For instance/ }],
    },
  ],
});
