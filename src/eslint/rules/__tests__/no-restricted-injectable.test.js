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
        import { Suspense, useState } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(Suspense, () => null);
        expect(render(useState)).toBe(useState);
      `,
      options: [{ paths: [{ name: 'react', importNames: ['useState'] }] }],
    },
    {
      // should pass if package is not the same
      code: `
        import { Component } from 'react-sweet-state';
        import { useState } from '@di/react';
        import { injectable } from 'react-magnetic-di';

        injectable(Component, () => null);
        injectable(useState, () => null);
      `,
      options: [{ paths: [{ name: 'react' }] }],
    },
    {
      // should pass if not injectable
      code: `
        import { useState } from 'react';

        expect(useState).toBe(useState);
      `,
      options: [{ paths: [{ name: 'react' }] }],
    },
    {
      // should pass if allowed when targeted
      code: `
        import { useState } from 'react';
        import { injectable } from 'react-magnetic-di';
        
        injectable(useState, () => [], { target: [Foo] });
      `,
      options: [{ paths: [{ name: 'react', allowTargeted: true }] }],
    },
  ],

  invalid: [
    {
      // should fail if whole module is not allowed
      code: `
        import { Suspense } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(Suspense, () => null);
      `,
      options: [{ paths: [{ name: 'react' }] }],
      errors: [{ type: 'CallExpression', messageId: 'restricted' }],
    },
    {
      // should fail if whole module is not allowed targeted
      code: `
        import { Suspense } from 'react';
        import { injectable } from 'react-magnetic-di';

        injectable(Suspense, () => null, { target: Foo });
      `,
      options: [{ paths: [{ name: 'react' }] }],
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
