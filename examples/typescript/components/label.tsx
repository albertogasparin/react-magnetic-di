// @flow
import React, { type ReactNode, useState } from 'react';
import { di } from 'react-magnetic-di';

type UseThemeState = { color: string };
export function useTheme() {
  return useState<UseThemeState>({ color: '#333' });
}

type LabelProps = {
  children?: ReactNode;
};

export function Label({ children = 'Label' }: LabelProps) {
  di(useTheme);
  const [style] = useTheme();
  return <div style={style}>{children}</div>;
}
