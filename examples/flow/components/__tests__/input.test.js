/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

import React, { useState } from 'react';
import { render } from '@testing-library/react';
import { DiProvider, injectable } from 'react-magnetic-di';

import { Input, useTheme } from '../input';

const renderWithDi = (node, dependencies = []) =>
  render(node, {
    wrapper: (p) => <DiProvider use={dependencies} {...p} />,
  });

const useThemeDi = injectable(useTheme, () => {
  return useState({ color: '#B00' });
});

describe('Input', () => {
  it('should render with theme', () => {
    const { container } = renderWithDi(<Input />, [useThemeDi]);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <input
          placeholder="Type..."
          style="border: 1px solid rgb(187, 0, 0);"
        />
      </div>
    `);
  });
});
