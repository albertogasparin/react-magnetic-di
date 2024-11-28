/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

import React, { Component, forwardRef } from 'react';
import { render } from '@testing-library/react';

import { Context } from '../context';
import { di } from '../consumer';
import { DiProvider, withDi } from '../provider';
import { injectable } from '../injectable';
import { globalDi } from '../global';

describe('DiProvider', () => {
  it('should expose state to consumers', () => {
    const children = jest.fn();

    render(
      <DiProvider use={[]}>
        <Context.Consumer>{children}</Context.Consumer>
      </DiProvider>
    );

    expect(children).toHaveBeenCalledWith({
      getDependencies: expect.any(Function),
    });
  });

  it('should expose stable context', () => {
    const children = jest.fn();
    const App = () => (
      <DiProvider use={[]}>
        <Context.Consumer>{children}</Context.Consumer>
      </DiProvider>
    );

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(children.mock.calls[0][0]).toBe(children.mock.calls[1][0]);
  });

  describe('getDependencies()', () => {
    const Text = () => 'text';
    const Button = forwardRef(() => 'button');

    it('should return all merged dependencies', () => {
      const children = jest.fn();
      const TextDi = injectable(Text, () => '');
      const ButtonDi = injectable(
        Button,
        forwardRef(() => '')
      );

      render(
        <DiProvider use={[TextDi]}>
          <DiProvider use={[ButtonDi]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text, Button])).toEqual([TextDi, ButtonDi]);
    });

    it('should return merged dependencies respecting target', () => {
      const children = jest.fn();
      const TextDi = injectable(Text, () => '');
      const ButtonDi = injectable(Button, () => '');
      const MyComponent = () => null;

      render(
        <DiProvider target={MyComponent} use={[TextDi]}>
          <DiProvider target={[]} use={[ButtonDi]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      // when di(MyComponent, ...)
      expect(getDependencies([Text, Button], MyComponent)).toEqual([
        TextDi,
        Button,
      ]);
      // when di(null, ...)
      expect(getDependencies([Text, Button], null)).toEqual([Text, Button]);
    });

    it('should pick last dependency if multiple passed of same type', () => {
      const children = jest.fn();
      const TextDi = injectable(Text, () => '');
      const TextDi2 = injectable(Text, () => '');

      render(
        <DiProvider use={[TextDi, TextDi2]}>
          <Context.Consumer>{children}</Context.Consumer>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text])).toEqual([TextDi2]);
    });

    it('should get closest dependency if multiple providers using same type', () => {
      const children = jest.fn();
      const TextDi = injectable(Text, () => '');
      const TextDi2 = injectable(Text, () => '');
      const WrappedConsumer = withDi(
        () => <Context.Consumer>{children}</Context.Consumer>,
        [TextDi2]
      );

      render(
        <DiProvider use={[TextDi]}>
          <WrappedConsumer />
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text])).toEqual([TextDi2]);
    });
  });

  it('should set global injection if prop is set', () => {
    jest.spyOn(globalDi, '_fromProvider');

    const children = jest.fn();
    const TextDi = injectable(Text, () => '');

    render(
      <DiProvider use={[TextDi]} global>
        <Context.Consumer>{children}</Context.Consumer>
      </DiProvider>
    );

    expect(globalDi._fromProvider).toHaveBeenCalledWith([TextDi], {
      global: true,
    });
  });

  it('should set global injection if injectable global is set', () => {
    jest.spyOn(globalDi, '_fromProvider');

    const children = jest.fn();
    const TextDi = injectable(Text, () => '', { global: true });

    render(
      <DiProvider use={[TextDi]}>
        <Context.Consumer>{children}</Context.Consumer>
      </DiProvider>
    );

    expect(globalDi._fromProvider).toHaveBeenCalledWith([TextDi], {
      global: undefined,
    });
  });

  it('should remove global injection on unmount', () => {
    jest.spyOn(globalDi, '_remove');

    const children = jest.fn();
    const TextDi = injectable(Text, () => '', { global: true });
    const TextDi2 = injectable(Text, () => '');

    const { unmount } = render(
      <DiProvider use={[TextDi]}>
        <DiProvider use={[TextDi2]} global>
          <Context.Consumer>{children}</Context.Consumer>
        </DiProvider>
      </DiProvider>
    );

    unmount();

    expect(globalDi._remove).toHaveBeenCalledWith([TextDi]);
    expect(globalDi._remove).toHaveBeenCalledWith([TextDi2]);
  });

  it('should remove global injection on error', () => {
    jest.spyOn(globalDi, '_remove');
    const cSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const children = jest.fn().mockImplementation(() => {
      throw new Error('Oops!');
    });
    const TextDi = injectable(Text, () => '', { global: true });
    const TextDi2 = injectable(Text, () => '');
    class ErrorBoundary extends Component {
      componentDidCatch() {
        cSpy.mockRestore();
      }
      render() {
        return this.props.children;
      }
    }

    render(
      <ErrorBoundary>
        <DiProvider use={[TextDi]}>
          <DiProvider use={[TextDi2]} global>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      </ErrorBoundary>
    );

    expect(globalDi._remove).toHaveBeenCalledWith([TextDi]);
    expect(globalDi._remove).toHaveBeenCalledWith([TextDi2]);
  });

  it('should error when a non injectable is used', () => {
    const cSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<DiProvider use={[jest.fn()]}>foo</DiProvider>);
    }).toThrowError();
    cSpy.mockRestore();
  });

  describe('with various replacement types', () => {
    const cases = [1, 'string', null, Symbol('test'), function () {}];
    test.each(cases)('should hanlde dependency value %p', (value) => {
      const spy = jest.fn();
      const Child = () => spy(di(null, value));
      render(
        <DiProvider use={[injectable(value, 'replaced')]}>
          <Child />
        </DiProvider>
      );
      expect(spy).toHaveBeenCalledWith(['replaced']);
    });
  });
});

describe('withDi', () => {
  it('should enhance displayName if component has displayNanme', () => {
    function MyComponent() {}
    const WrappedComponent = withDi(MyComponent, []);

    expect(WrappedComponent.displayName).toEqual('withDi(MyComponent)');
  });

  it('should not set displayName if component has not', () => {
    const WrappedComponent = withDi(() => null, []);

    expect(WrappedComponent.displayName).toEqual('');
  });
});
