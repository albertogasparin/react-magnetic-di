import { readContext } from './context';
import { settings } from './settings';

// This function holds the statically defined dependencies and when we
// execute it during render we merge them with the ones provided from Context
export function provideDependencies(realDeps) {
  return function() {
    if (settings.enabled) {
      // Read context and grab all the dependencies override
      // from all Providers in the tree
      const { getDependencies } = readContext();
      // "this" is the js context that calls this entire function
      // so either the class of functional component
      const contextDeps = getDependencies(this);
      // Merge context provided dependencies with real ones
      return { ...realDeps, ...contextDeps };
    }
    // if nothing happens we just return the real dependencies
    return realDeps;
  };
}
