import { KEY } from './constants';

let hasWarned = false;
export function warnOnce(message) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.error('Warning:', message);
    hasWarned = true;
  }
}

export function getDisplayName(Comp, fallback = 'Unknown') {
  return Comp.displayName || Comp.name || fallback;
}

export function injectable(from, implementation) {
  implementation.displayName =
    getDisplayName(implementation, '') || `di(${getDisplayName(from)})`;
  implementation[KEY] = from;
  return implementation;
}

/** @deprecated use injectable instead */
export const mock = injectable;
