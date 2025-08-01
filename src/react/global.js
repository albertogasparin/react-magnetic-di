import { PACKAGE_NAME, diRegistry } from './constants';
import {
  addInjectableToMap,
  removeInjectableFromMap,
  findInjectable,
} from './utils';

const replacementMap = new Map();

export const globalDi = {
  getDependencies(realDeps, targetChild) {
    if (replacementMap.size) {
      for (let i = 0; i < realDeps.length; i++) {
        const replacedInj = findInjectable(
          replacementMap,
          realDeps[i],
          targetChild
        );
        if (replacedInj) realDeps[i] = replacedInj.value;
      }
    }

    return realDeps;
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

  _fromProvider(injs, props = {}) {
    injs.forEach((inj) => {
      if (props.global || diRegistry.get(inj).global)
        addInjectableToMap(replacementMap, inj);
    });
  },

  _remove(injs) {
    injs.forEach((inj) => removeInjectableFromMap(replacementMap, inj));
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
      typeof result.then === 'function'
    ) {
      // dont use finally as it "multiplies" rejected promises
      result.then(globalDi.clear, globalDi.clear);
    } else {
      globalDi.clear();
    }
  }
}
