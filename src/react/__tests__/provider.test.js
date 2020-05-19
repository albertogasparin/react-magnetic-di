/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';

import { Context } from '../context';
import { DiProvider } from '../provider';
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

      mount(
        <DiProvider use={[mock(Text, () => '')]}>
          <DiProvider use={[mock(Button, () => '')]}>
            <Context.Consumer>{children}</Context.Consumer>
          </DiProvider>
        </DiProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies([Text, Button])).toEqual([
        expect.any(Function),
        expect.any(Function),
      ]);
    });
  });
});
