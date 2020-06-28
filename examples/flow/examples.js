// @flow
import React, { useState } from 'react';
import { injectable } from 'react-magnetic-di';

import { Input, useTheme as useThemeInput } from './components/input';
import { useTheme as useThemeLabel } from './components/label';

export const InputExample = injectable(Input, () => {
  return (
    <select>
      <option>Type...?</option>
    </select>
  );
});

export const useThemeInputExample = injectable(useThemeInput, () => {
  return useState<any>({ color: '#E77' });
});

export const useThemeLabelExample = injectable(useThemeLabel, () => {
  return useState<any>({ color: '#FA0' });
});
