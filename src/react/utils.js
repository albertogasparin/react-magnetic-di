import { KEY } from './constants';

let hasWarned = false;
export const warnOnce = (message) => {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.error('Warning:', message);
    hasWarned = true;
  }
};

export function mock(original, mockImpl) {
  mockImpl.displayName =
    mockImpl.displayName || `di(${original.displayName || original.name})`;
  mockImpl[KEY] = original;
  return mockImpl;
}
