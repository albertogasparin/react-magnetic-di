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
  });
});

describe('withDi', () => {
  it('should wrap components with provider', () => {
    const children = jest.fn();
    const TextMock = mock(Text, () => '');
    const WrappedComponent = withDi(
      () => <Context.Consumer>{children}</Context.Consumer>,
      [TextMock]
    );

    const wrapper = mount(<WrappedComponent />);

    expect(wrapper.find(DiProvider).props()).toEqual({
      children: expect.anything(),
      target: undefined,
      use: [TextMock],
    });
  });
});
