/* eslint-env jest */

import React, { useState } from 'react';
import { mount } from 'enzyme';
import { di, DiProvider } from 'react-magnetic-di';

import { Input, useTheme } from '../input';

const mountWithDi = (node, dependencies = []) =>
  mount(node, {
    wrappingComponent: DiProvider,
    wrappingComponentProps: { use: dependencies },
  });

const useThemeMock = di.mock(useTheme, () => {
  return useState({ color: '#B00' });
});

describe('Input', () => {
  it('should render with theme', () => {
    const wrapper = mountWithDi(<Input />, [useThemeMock]);
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<input style=\\"border: 1px solid #b00;\\" placeholder=\\"Type...\\">"`
    );
  });
});
