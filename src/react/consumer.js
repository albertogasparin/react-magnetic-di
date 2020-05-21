import { Context } from './context';
import { warnOnce, mock } from './utils';

function di(deps) {
  // check if babel plugin has been added
  if (Array.isArray(deps)) {
    // Read context and grab all the dependencies override
    // from all Providers in the tree
    const { getDependencies = (v) => v } = Context._currentValue || {};
    return getDependencies(deps);
  } else {
    warnOnce(
      `Seems like you are using react-magnetic-di without babel plugin. ` +
        `Please add 'react-magnetic-di/babel' to your babel config to enabled dependency injection. ` +
        'Without that, di(...) is a no-op.'
    );
  }
}

di.mock = mock;

export { di };
