import React from 'react';

export const Context = React.createContext({
  getDependencies(deps) {
    return deps;
  },
});
