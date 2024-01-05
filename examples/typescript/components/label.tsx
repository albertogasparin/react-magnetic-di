import React, { type ReactNode, useState } from 'react';

type UseThemeState = { color: string };
export function useTheme() {
  return useState<UseThemeState>({ color: '#333' });
}

type LabelProps = {
  children?: ReactNode;
};

export function Label({ children = 'Label' }: LabelProps) {
  const [style] = useTheme();
  return <div style={style}>{children}</div>;
}
