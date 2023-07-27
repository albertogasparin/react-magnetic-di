import { PACKAGE_NAME } from './constants';
import { addInjectableToMap, findInjectable } from './utils';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps, targetChild) {
    return realDeps.map((dep) => {
      const replacedInj = findInjectable(replacementMap, dep, targetChild);
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
    injs.forEach((inj) => addInjectableToMap(replacementMap, inj));
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
