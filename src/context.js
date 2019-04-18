import React from 'react';

const Context = React.createContext({
  getDependencies() {
    return {};
  },
});

// Reading context value from owner as suggested by gaearon
// https://github.com/facebook/react/pull/13861#issuecomment-430356644
// plus a fix to make it work with enzyme shallow
const readContext = () => {
  const {
    // React < 16.8
    ReactCurrentOwner: { currentDispatcher } = {},
    // React >= 16.8+
    ReactCurrentDispatcher: { current } = {},
  } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const dispatcher = current || currentDispatcher;
  return dispatcher
    ? dispatcher.readContext(Context.Consumer)
    : Context.Consumer._currentValue;
};

export { Context, readContext };
