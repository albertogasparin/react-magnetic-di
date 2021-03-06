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
  if (implementation[KEY] && implementation[KEY] !== from) {
    warnOnce(
      `You are trying to use replacement "${implementation.displayName}" on multiple injectables. ` +
        `That will override only the last dependency, as each replacement is uniquely linked.`
    );
  }
  implementation[KEY] = from;
  return implementation;
}

/** @deprecated use injectable instead */
export const mock = injectable;
