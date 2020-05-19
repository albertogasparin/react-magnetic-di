// @flow
import React, { useState, useMemo } from 'react';
import { di } from 'react-magnetic-di';

export function useTheme() {
  return useState<any>({ color: '#777' });
}

export function Input() {
  di(useTheme);

  useMemo(() => {
    di(useTheme);
  });

  const [style] = useTheme();
  return (
    <input
      style={{ border: `1px solid ${style.color}` }}
      placeholder="Type..."
    />
  );
}
