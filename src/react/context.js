import React from 'react';
import { globalDi } from './global';

export const Context = React.createContext({
  getDependencies: globalDi.getDependencies,
});
