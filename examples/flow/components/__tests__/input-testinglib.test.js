/* eslint-env jest */

import React, { useState } from 'react';
import { render } from '@testing-library/react';
import { di, DiProvider } from 'react-magnetic-di';

import { Input, useTheme } from '../input';

const renderWithDi = (node, dependencies = []) =>
  render(node, {
    wrapper: (p) => <DiProvider use={dependencies} {...p} />,
  });

const useThemeMock = di.mock(useTheme, () => {
  return useState({ color: '#B00' });
});

describe('Input', () => {
  it('should render with theme', () => {
    const { container } = renderWithDi(<Input />, [useThemeMock]);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <input
          placeholder="Type..."
          style="border: 1px solid #b00;"
        />
      </div>
    `);
  });
});
