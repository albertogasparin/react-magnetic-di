/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';

import { injectable } from 'react-magnetic-di';

/**
 * injectable types tests
 */

// Primitive hook test
//
const useHookPrim1 = () => 'foo';
// @ts-expect-error - wrong return type
injectable(useHookPrim1, () => true);
// correct
injectable(useHookPrim1, () => 'bar');

// Tuple hook simple test
const useHookTuple1 = () => useState(true);
// @ts-expect-error - wrong return type
injectable(useHookTuple1, () => true);
// @ts-expect-error - wrong array index type
injectable(useHookTuple1, () => ['1']);
injectable(
  useHookTuple1,
  // @ts-expect-error - wrong return type
  jest.fn(() => ({}))
);
// correct
injectable(useHookTuple1, () => [true, () => {}]);

// Turple hook object test
//
const useHookTuple2 = (): [{ foo: 1 }, { bar: (v: number) => number }] => [
  { foo: 1 },
  { bar: (v = 1) => v },
];
// @ts-expect-error - wrong object key
injectable(useHookTuple2, () => [{ bar: 1 }]);
// @ts-expect-error - wrong object key on second
injectable(useHookTuple2, () => [{ foo: 1 }, { bar: 1 }]);
injectable(
  useHookTuple2,
  // @ts-expect-error - wrong return type
  jest.fn(() => ({}))
);
const t2fn = () => [{ foo: 1 }, { bar: () => 1 }];
// @ts-expect-error - t2fn return type is array, not tuple :(
injectable(useHookTuple2, t2fn);
// correct
injectable(useHookTuple2, () => [{ foo: 1 }]);
injectable(useHookTuple2, () => [{ foo: 1 }, { bar: () => 1 }]);

// Object hook test
//
const useHookObj1 = () => ({
  foo: 1,
  baz: [{ baz: 'a' }],
  bar: (v = 1) => v,
});
// @ts-expect-error - wrong return type
injectable(useHookObj1, () => []);
// @ts-expect-error - wrong object type
injectable(useHookObj1, () => ({ foo: '1' }));
// @ts-expect-error - wrong object type
injectable(useHookObj1, () => ({ foo: 2, baz: ['1'] }));
// @ts-expect-error - wrong nested object type
injectable(useHookObj1, () => ({ foo: 2, baz: [{ baz: 1 }] }));
// @ts-expect-error - wrong function return type
injectable(useHookObj1, () => ({ foo: 2, bar: () => '' }));

// correct
injectable(useHookObj1, () => ({ foo: 2 }));
injectable(useHookObj1, () => ({ foo: 2, baz: [{}] }));
injectable(useHookObj1, () => ({ foo: 2, baz: [{ baz: 'c' }] }));
injectable(useHookObj1, () => ({ foo: 2, bar: () => 2 }));
