// @flow
import React, { useState, type Node } from 'react';
import { di } from 'react-magnetic-di';

export function useTheme() {
  return useState<any>({ color: '#333' });
}

export type LabelProps = {| children?: Node |};

export function Label({ children = 'Label' }: LabelProps) {
  di(useTheme);
  const [style] = useTheme();
  return <div style={style}>{children}</div>;
}
