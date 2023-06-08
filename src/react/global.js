import { PACKAGE_NAME, diRegistry } from './constants';
import { stats } from './stats';
import { assertValidInjectable } from './utils';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps) {
    return realDeps.map((dep) => {
      const replacedInj = replacementMap.get(dep);
      stats.track(replacedInj, dep);
      return replacedInj ? replacedInj.value : dep;
    });
  },

  use(injs) {
    if (replacementMap.size) {
      throw new Error(
        `${PACKAGE_NAME} has replacements configured already. ` +
          `Implicit merging is not supported, so please concatenate injectables. ` +
          `If this is not expected, please file a bug report`
      );
    }
    injs.forEach((inj) => {
      assertValidInjectable(inj);
      const injObj = diRegistry.get(inj);
      if (injObj.track) stats.set(injObj);
      replacementMap.set(injObj.from, injObj);
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
