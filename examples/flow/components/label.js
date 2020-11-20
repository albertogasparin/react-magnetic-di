// @flow
import React, { useState, type Node } from 'react';
import { di } from 'react-magnetic-di';

type UseThemeState = { color: string };
export function useTheme(): $Call<typeof useState, UseThemeState> {
  return useState<any>({ color: '#333' });
}

type LabelProps = {|
  children?: Node,
|};

export function Label({ children = 'Label' }: LabelProps): Node {
  di(useTheme);
  const [style] = useTheme();
  return <div style={style}>{children}</div>;
}
