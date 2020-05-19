// @flow
import React, { useState } from 'react';
import { di } from 'react-magnetic-di';

export function useTheme() {
  return useState<any>({ color: '#333' });
}

export function Label() {
  di(useTheme);
  const [style] = useTheme();
  return <div style={style}>Label</div>;
}
