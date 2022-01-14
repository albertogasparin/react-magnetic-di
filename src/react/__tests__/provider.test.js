/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

import React, { forwardRef } from 'react';
import { mount } from 'enzyme';

import { Context } from '../context';
import { DiProvider, withDi } from '../provider';
import { injectable } from '../utils';

describe('DiProvider', () => {
  it('should expose state to consumers', () => {
    const children = jest.fn();

    mount(
      <DiProvider use={[]}>
        <Context.Consumer>{children}</Context.Consumer>
      </DiProvider>
    );

    expect(children).toHaveBeenCalledWith({
      getDependencies: expect.any(Function),
    });
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

      mount(
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

      mount(
        <DiProvider target={MyComponent} use={[TextDi]}>
          <DiProvider target={[]} use={[ButtonDi]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text, Button], MyComponent)).toEqual([
        TextDi,
        Button,
      ]);
    });

    it('should pick last dependency if multiple passed of same type', () => {
      const children = jest.fn();
      const TextDi = injectable(Text, () => '');
      const TextDi2 = injectable(Text, () => '');

      mount(
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

      mount(
        <DiProvider use={[TextDi, TextDi2]}>
          <WrappedConsumer />
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text])).toEqual([TextDi2]);
    });
  });
});

describe('withDi', () => {
  it('should wrap component with provider', () => {
    const children = jest.fn(() => null);
    const TextDi = injectable(Text, () => '');
    const WrappedComponent = withDi(children, [TextDi]);

    const wrapper = mount(<WrappedComponent />);

    expect(wrapper.find(DiProvider).props()).toEqual({
      children: expect.anything(),
      target: null,
      use: [TextDi],
    });
  });

  it('should wrap component with provider and allow target override', () => {
    const children = jest.fn(() => null);
    const TextDi = injectable(Text, () => '');
    const WrappedComponent = withDi(children, [TextDi], children);

    const wrapper = mount(<WrappedComponent />);

    expect(wrapper.find(DiProvider).props()).toEqual({
      children: expect.anything(),
      target: children,
      use: [TextDi],
    });
  });

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
