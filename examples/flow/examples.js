// @flow
import React, { useState } from 'react';
import { mock } from 'react-magnetic-di';

import { Input, useTheme as useThemeInput } from './components/input';
import { useTheme as useThemeLabel } from './components/label';

export const InputExample = mock(Input, () => {
  return (
    <select>
      <option>Type...?</option>
    </select>
  );
});

export const useThemeInputExample = mock(useThemeInput, () => {
  return useState<any>({ color: '#E77' });
});

export const useThemeLabelExample = mock(useThemeLabel, () => {
  return useState<any>({ color: '#FA0' });
});
