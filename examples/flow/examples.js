// @flow
import React, { useState } from 'react';
import { diMock } from 'react-magnetic-di';

import { Input, useTheme as useThemeInput } from './components/input';
import { useTheme as useThemeLabel } from './components/label';

export const InputExample = diMock(Input, () => {
  return (
    <select>
      <option>Type...?</option>
    </select>
  );
});

export const useThemeInputExample = diMock(useThemeInput, () => {
  return useState<any>({ color: '#E77' });
});

export const useThemeLabelExample = diMock(useThemeLabel, () => {
  return useState<any>({ color: '#FA0' });
});
