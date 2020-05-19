import { readContext } from './context';
import { settings } from './settings';
import { warnOnce } from './utils';

export function di(deps) {
  if (settings.enabled) {
    // check if babel plugin has been added
    if (Array.isArray(deps)) {
      // Read context and grab all the dependencies override
      // from all Providers in the tree
      const { getDependencies } = readContext();
      return getDependencies(deps);
    } else {
      warnOnce(
        `Seems like you are using react-magnetic-di without babel plugin. ` +
          `Please add 'react-magnetic-di/babel' to your babel config to enabled dependency injection. ` +
          'Without that, di(...) is a no-op.'
      );
    }
  }

  return deps;
}
