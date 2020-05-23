import { KEY } from './constants';

let hasWarned = false;
export function warnOnce(message) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.error('Warning:', message);
    hasWarned = true;
  }
}

export function getDisplayName(Comp) {
  return Comp.displayName || Comp.name || 'Unknown';
}

export function mock(original, mockImpl) {
  mockImpl.displayName =
    mockImpl.displayName || `di(${getDisplayName(original)})`;
  mockImpl[KEY] = original;
  return mockImpl;
}
