import { KEY } from './constants';

let hasWarned = false;
export function warnOnce(message) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.error('Warning:', message);
    hasWarned = true;
  }
}

export function getDisplayName(Comp, wrapper = '') {
  const name = Comp.displayName || Comp.name;
  return !name || !wrapper ? name : `${wrapper}(${name})`;
}

export function injectable(from, implementation) {
  implementation.displayName =
    getDisplayName(implementation) || getDisplayName(from, 'di');
  implementation[KEY] = from;
  return implementation;
}

/** @deprecated use injectable instead */
export const mock = injectable;
