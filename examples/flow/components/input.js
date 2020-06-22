// @flow
import React, { useState } from 'react';
import { di } from 'react-magnetic-di';

export function useTheme() {
  return useState<any>({ color: '#777' });
}

type InputProps = {|
  value?: string,
|};

export function Input(props: InputProps) {
  di(useTheme);
  const [style] = useTheme();

  return (
    <input
      style={{ border: `1px solid ${style.color}` }}
      placeholder="Type..."
      {...props}
    />
  );
}
