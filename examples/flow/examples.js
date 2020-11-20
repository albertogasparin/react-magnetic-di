// @flow
import React, { useState } from 'react';
import { injectable } from 'react-magnetic-di';

import {
  Input,
  type InputProps,
  useTheme as useThemeInput,
} from './components/input';
import { useTheme as useThemeLabel } from './components/label';

const InputMock = (props: InputProps) =>
  props && (
    <>
      <select>
        <option>Type...?</option>
      </select>
    </>
  );

export const InputExample: typeof Input = injectable(Input, InputMock);

export const useThemeInputExample: typeof useThemeInput = injectable(
  useThemeInput,
  () => useState<any>({ color: '#E77' })
);

export const useThemeLabelExample: typeof useThemeLabel = injectable(
  useThemeLabel,
  () => useState<any>({ color: '#FA0' })
);
