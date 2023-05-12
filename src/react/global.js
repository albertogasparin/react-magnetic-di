import { KEY, PACKAGE_NAME } from './constants';
import { stats } from './stats';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps) {
    return realDeps.map((dep) => {
      const replacedDep = replacementMap.get(dep);
      stats.track(replacedDep, dep);
      return replacedDep || dep;
    });
  },

  use(deps) {
    if (replacementMap.size) {
      throw new Error(
        `${PACKAGE_NAME} has replacements configured already. ` +
          `Implicit merging is not supported, so please concatenate injectables. ` +
          `If this is not expected, please file a bug report`
      );
    }
    deps.forEach((d) => {
      if (d[KEY].track) stats.set(d);
      replacementMap.set(d[KEY].from, d);
    });
  },

  clear() {
    replacementMap.clear();
  },
};

export function runWithDi(thunk, deps) {
  globalDi.use(deps);
  let result;
  try {
    result = thunk();
    return result;
  } finally {
    // autocleanup dependences if either async or sync
    if (
      result &&
      typeof result === 'object' &&
      typeof result.then === 'function' &&
      typeof result.finally === 'function'
    ) {
      result.finally(globalDi.clear);
    } else {
      globalDi.clear();
    }
  }
}
