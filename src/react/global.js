import { KEY } from './constants';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps) {
    return realDeps.map((dep) => replacementMap.get(dep) || dep);
  },

  use(deps) {
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
