// @flow
import React, { useState, type Node } from 'react';

type UseThemeState = { color: string };
export function useTheme(): $Call<typeof useState, UseThemeState> {
  return useState<any>({ color: '#333' });
}

type LabelProps = {|
  children?: Node,
|};

export function Label({ children = 'Label' }: LabelProps): Node {
  const [style] = useTheme();
  return <div style={style}>{children}</div>;
}
