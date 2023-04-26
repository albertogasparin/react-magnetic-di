// @flow strict-local
/* eslint-disable no-unused-vars, react/display-name */

import React, { Component, type AbstractComponent } from 'react';
import { injectable, globalDi, runWithDi } from '../..';

/**
 * Originals
 */

type FunctionalComponentProps = { foo?: string };
const FunctionalComponent = (props: FunctionalComponentProps) =>
  props && <div>bla</div>;

type ClassComponentProps = { bar?: string };
class ClassComponent extends Component<ClassComponentProps> {
  render() {
    return <div>bla</div>;
  }
}

const TypedComponent: AbstractComponent<{}> = () => <div>bla</div>;

const useHook = () => [true];

/**
 * Mocks
 */

const FunctionalMock = () => <div>mock</div>;

class ClassMock extends Component<any> {
  render() {
    return <>mock</>;
  }
}

const useMock = () => [false];

/**
 * injectable
 */

// TODO: Hook return type should be boolean
injectable(useHook, () => '');

// Correct

injectable(FunctionalComponent, FunctionalMock);
injectable(FunctionalComponent, ClassMock);
injectable(ClassComponent, ClassMock);
injectable(ClassComponent, FunctionalMock);
injectable(TypedComponent, FunctionalMock);
injectable(TypedComponent, ClassMock);
injectable(useHook, useMock);

/**
 * globalDi types tests
 */
const globalDep = () => '';
globalDi.use([globalDep]);
globalDi.clear();

/**
 * runWithDi types tests
 */
const runTestFn = () => '';
const runTestAsyncFn = async () => '';

const rsync = runWithDi(() => runTestFn(), [globalDep]);
rsync.split('');

async () => {
  const rasync = await runWithDi(() => runTestAsyncFn(), []);
  rasync.split('');
};
