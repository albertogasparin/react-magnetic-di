import React from 'react';

const Context = React.createContext({
  getDependencies(deps) {
    return deps;
  },
});

// Reading context value from owner as suggested by gaearon
// https://github.com/facebook/react/pull/13861#issuecomment-430356644
// plus a fix to make it work with enzyme shallow
const readContext = () => {
  const {
    ReactCurrentDispatcher: { current } = {},
  } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  return current
    ? current.readContext(Context.Consumer)
    : Context.Consumer._currentValue;
};

export { Context, readContext };
