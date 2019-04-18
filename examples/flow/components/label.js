// @flow
import React, { useState } from 'react';
import { provideDependencies } from 'react-magnetic-di';

function useThemeDI() {
  return useState({ color: '#333' });
}

export function Label() {
  const { useTheme } = Label.dependencies();
  const [style] = useTheme();
  return <div style={style}>Label</div>;
}

Label.dependencies = provideDependencies({
  useTheme: useThemeDI,
});
