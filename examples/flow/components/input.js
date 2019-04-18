// @flow
import React, { useState } from 'react';
import { provideDependencies } from 'react-magnetic-di';

function useThemeDI() {
  return useState({ color: '#777' });
}

export function Input() {
  const { useTheme } = Input.dependencies();
  const [style] = useTheme();
  return (
    <input
      style={{ border: `1px solid ${style.color}` }}
      placeholder="Type..."
    />
  );
}

Input.dependencies = provideDependencies({
  useTheme: useThemeDI,
});
