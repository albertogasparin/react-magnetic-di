/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';

import { Context } from '../context';
import { DiProvider, withDi } from '../provider';
import { mock } from '../utils';

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
    const Button = () => 'button';

    it('should return all merged dependencies', () => {
      const children = jest.fn();
      const TextMock = mock(Text, () => '');
      const ButtonMock = mock(Button, () => '');

      mount(
        <DiProvider use={[TextMock]}>
          <DiProvider use={[ButtonMock]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text, Button])).toEqual([TextMock, ButtonMock]);
    });

    it('should return merged dependencies respecting target', () => {
      const children = jest.fn();
      const TextMock = mock(Text, () => '');
      const ButtonMock = mock(Button, () => '');
      const MyComponent = () => null;

      mount(
        <DiProvider target={MyComponent} use={[TextMock]}>
          <DiProvider target={[]} use={[ButtonMock]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text, Button], MyComponent)).toEqual([
        TextMock,
        Button,
      ]);
    });

    it('should pick last dependency if multiple passed of same type', () => {
      const children = jest.fn();
      const TextMock = mock(Text, () => '');
      const TextMock2 = mock(Text, () => '');

      mount(
        <DiProvider use={[TextMock, TextMock2]}>
          <Context.Consumer>{children}</Context.Consumer>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text])).toEqual([TextMock2]);
    });

    it('should get closest dependency if multiple providers using same type', () => {
      const children = jest.fn();
      const TextMock = mock(Text, () => '');
      const TextMock2 = mock(Text, () => '');
      const WrappedConsumer = withDi(
        () => <Context.Consumer>{children}</Context.Consumer>,
        [TextMock2]
      );

      mount(
        <DiProvider use={[TextMock, TextMock2]}>
          <WrappedConsumer />
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text])).toEqual([TextMock2]);
    });
  });
});

describe('withDi', () => {
  it('should wrap component with provider', () => {
    const children = jest.fn(() => null);
    const TextMock = mock(Text, () => '');
    const WrappedComponent = withDi(children, [TextMock]);

    const wrapper = mount(<WrappedComponent />);

    expect(wrapper.find(DiProvider).props()).toEqual({
      children: expect.anything(),
      target: null,
      use: [TextMock],
    });
  });

  it('should wrap component with provider and allow target override', () => {
    const children = jest.fn(() => null);
    const TextMock = mock(Text, () => '');
    const WrappedComponent = withDi(children, [TextMock], children);

    const wrapper = mount(<WrappedComponent />);

    expect(wrapper.find(DiProvider).props()).toEqual({
      children: expect.anything(),
      target: children,
      use: [TextMock],
    });
  });
});
