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

export const InputExample = injectable(Input, InputMock);

export const useThemeInputExample = injectable(useThemeInput, () =>
  useState({ color: '#E77' })
);

export const useThemeLabelExample = injectable(useThemeLabel, () =>
  useState({ color: '#FA0' })
);
