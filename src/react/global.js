import { KEY, PACKAGE_NAME } from './constants';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps) {
    return realDeps.map((dep) => replacementMap.get(dep) || dep);
  },

  use(deps) {
    if (replacementMap.size) {
      throw new Error(
        `There are already replacements configured for ${PACKAGE_NAME}. ` +
          `Implicit merging is not supported, so please concatenate them before calling globalDi.use(). ` +
          `If this is not expected, ensure you call globalDi.clear() after each test`
      );
    }
    deps.forEach((d) => {
      replacementMap.set(d[KEY], d);
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
