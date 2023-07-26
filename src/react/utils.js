import { diRegistry } from './constants';

let hasWarned = false;
export function warnOnce(message) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.warn('Warning:', message);
    hasWarned = true;
  }
}

export function assertValidInjectable(dep) {
  if (!diRegistry.has(dep))
    throw new Error(
      `Seems like you are trying to use "${dep}" as injectable, but magnetic-di needs the return value of "injectable()"`
    );
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

export function isTargeted(inj, subject) {
  return inj && (!inj.targets || inj.targets.includes(subject));
}
