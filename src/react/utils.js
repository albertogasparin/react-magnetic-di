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

export function mock(original, mockImpl) {
  mockImpl.displayName =
    getDisplayName(mockImpl, '') || `di(${getDisplayName(original)})`;
  mockImpl[KEY] = original;
  return mockImpl;
}
