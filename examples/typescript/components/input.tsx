// @flow
import React, { useState } from 'react';
import { di } from 'react-magnetic-di';

type UseThemeState = { color: string };
export function useTheme() {
  return useState<UseThemeState>({ color: '#777' });
}

export type InputProps = {
  value?: string;
};

export function Input(props: InputProps) {
  di(useTheme);
  const [style] = useTheme();

  return (
    <>
      <input
        style={{ border: `1px solid ${style.color}` }}
        placeholder="Type..."
        {...props}
      />
    </>
  );
}
