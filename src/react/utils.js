import { diRegistry } from './constants';
import { stats } from './stats';

let hasWarned = false;
export function warnOnce(message) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.warn('Warning:', message);
    hasWarned = true;
  }
}

export function addInjectableToMap(replacementMap, inj) {
  const injObj = diRegistry.get(inj);
  if (!injObj) {
    throw new Error(
      `Seems like you are trying to use "${inj}" as injectable, but magnetic-di needs the return value of "injectable()"`
    );
  }

  if (injObj.track) stats.set(injObj);

  if (replacementMap.has(injObj.from)) {
    replacementMap.get(injObj.from).add(injObj);
  } else {
    replacementMap.set(injObj.from, new Set([injObj]));
  }
  return replacementMap;
}

export function removeInjectableFromMap(replacementMap, inj) {
  const injObj = diRegistry.get(inj);
  const injectables = replacementMap.get(injObj.from) || new Set();
  if (injectables.size === 1) {
    replacementMap.delete(injObj.from);
  } else {
    injectables.delete(injObj);
  }
}

export function getDisplayName(Comp, wrapper = '') {
  const name = Comp.displayName || Comp.name;
  return !name || !wrapper ? name : `${wrapper}(${name})`;
}

export function debug(fn) {
  const source = fn.toString();
  const [, args] = source.match(/const \[[^\]]+\] = .*di.*\(\[([^\]]+)/) || [];
  return args;
}

export function findInjectable(replacementMap, dep, targetChild) {
  const injectables = replacementMap.get(dep) || new Set();
  // loop all injectables for the dep, with targeted ones preferred
  let anyCandidate = null;
  let targetCandidate = null;
  for (const inj of injectables) {
    if (!inj.targets) anyCandidate = inj;
    if (inj.targets?.includes(targetChild)) targetCandidate = inj;
  }
  const candidate = targetCandidate || anyCandidate;
  stats.track(candidate);
  return candidate;
}
