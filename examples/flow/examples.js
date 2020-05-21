// @flow
import React, { useState } from 'react';
import { di, withDi } from 'react-magnetic-di';

import { Input, useTheme as useThemeInput } from './components/input';
import { useTheme as useThemeLabel } from './components/label';

export const InputExample = di.mock(Input, () => {
  return (
    <select>
      <option>Type...?</option>
    </select>
  );
});

export const useThemeInputExample = di.mock(useThemeInput, () => {
  return useState<any>({ color: '#E77' });
});

export const InputExample2 = withDi(Input, [useThemeInputExample]);

export const useThemeLabelExample = di.mock(useThemeLabel, () => {
  return useState<any>({ color: '#FA0' });
});
