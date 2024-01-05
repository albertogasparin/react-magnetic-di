// @flow
import React, { useState, type Node } from 'react';

type UseThemeState = { color: string };
export function useTheme(): $Call<typeof useState, UseThemeState> {
  return useState<any>({ color: '#777' });
}

export type InputProps = {|
  value?: string,
|};

export function Input(props: InputProps): Node {
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
