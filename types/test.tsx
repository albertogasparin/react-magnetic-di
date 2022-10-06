/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import React, {
  Component,
  PureComponent,
  useState,
  memo,
  PropsWithChildren,
  ReactNode,
} from 'react';

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

// React components test
//
class ClassTwoProps extends PureComponent<{
  foo: string;
  bar: number;
  children: ReactNode;
}> {
  render = () => <>{this.props.foo}</>;
}
const FuncTwoProps = memo(
  (props: { foo: string; bar: number; children: ReactNode }) => {
    return <>{props.foo}</>;
  }
);

class ClassOtherProp extends Component<{ foo: number }> {
  render = () => <>{this.props.foo}</>;
}
const FuncOtherProp = (props: { foo: number }) => {
  return <>{props.foo}</>;
};

class ClassOneProp extends Component<{ children: ReactNode }> {
  render = () => <></>;
}
const FuncOneProp = (props: { children: ReactNode }) => {
  return <></>;
};

class ClassNoProp extends Component {
  render = () => <></>;
}
const FuncNoProp = () => {
  return <></>;
};

// @ts-expect-error - wrong prop type
injectable(ClassTwoProps, ClassOtherProp);
// @ts-expect-error - wrong prop type
injectable(ClassTwoProps, FuncOtherProp);
// @ts-expect-error - wrong prop type
injectable(FuncTwoProps, ClassOtherProp);
// @ts-expect-error - wrong prop type
injectable(FuncTwoProps, FuncOtherProp);

// Correct
injectable(ClassTwoProps, FuncTwoProps);
injectable(ClassTwoProps, ClassOneProp);
injectable(ClassTwoProps, FuncOneProp);
injectable(ClassTwoProps, ClassNoProp);
injectable(ClassTwoProps, FuncNoProp);
// @ts-expect-error - this should be fine with React18 types
injectable(FuncTwoProps, ClassOneProp);
injectable(FuncTwoProps, FuncOneProp);
// @ts-expect-error - this should be fine with React18 types
injectable(FuncTwoProps, ClassNoProp);
injectable(FuncTwoProps, FuncNoProp);
