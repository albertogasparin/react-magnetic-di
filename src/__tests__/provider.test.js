/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';

import { Context } from '../context';
import { DependencyProvider } from '../provider';

describe('DependencyProvider', () => {
  it('should expose state to consumers', () => {
    const children = jest.fn();

    mount(
      <DependencyProvider use={{ Text: '' }}>
        <Context.Consumer>{children}</Context.Consumer>
      </DependencyProvider>
    );

    expect(children).toHaveBeenCalledWith({
      getDependencies: expect.any(Function),
    });
  });

  describe('getDependencies()', () => {
    const Text = () => 'text';
    const Button = () => 'button';
    const Target = ({ children: c }) => c;

    it('should return all merged dependencies', () => {
      const children = jest.fn();

      mount(
        <DependencyProvider use={{ Text }}>
          <DependencyProvider use={{ Button }}>
            <Context.Consumer>{children}</Context.Consumer>
          </DependencyProvider>
        </DependencyProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies()).toEqual({ Text, Button });
      expect(getDependencies(Target)).toEqual({ Text, Button });
    });

    it('should return target specific dependencies', () => {
      const children = jest.fn();

      mount(
        <DependencyProvider use={{ Text }}>
          <DependencyProvider target={Target} use={{ Button }}>
            <Context.Consumer>{children}</Context.Consumer>
          </DependencyProvider>
        </DependencyProvider>
      );
      const { getDependencies } = children.mock.calls[0][0];
      expect(getDependencies()).toEqual({ Text });
      expect(getDependencies(Target)).toEqual({ Text, Button });
    });
  });
});
