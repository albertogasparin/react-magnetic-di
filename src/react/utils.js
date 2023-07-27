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
    replacementMap.get(injObj.from).unshift(injObj);
  } else {
    replacementMap.set(injObj.from, [injObj]);
  }
  return replacementMap;
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
  const injectables = replacementMap.get(dep) || [];
  const candidates = [];
  // loop all injectables for the dep, ranking targeted ones higher
  for (const inj of injectables) {
    if (!inj.targets) candidates.push(inj);
    if (inj.targets?.includes(targetChild)) candidates.unshift(inj);
  }
  stats.track(candidates[0]);
  return candidates[0] || null;
}
