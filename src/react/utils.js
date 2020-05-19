import { KEY } from './constants';

let hasWarned = false;
export const warnOnce = (message) => {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.error(message);
    hasWarned = true;
  }
};

export function diMock(originalImpl, mockImpl) {
  mockImpl.displayName =
    mockImpl.displayName || `diMock(${originalImpl.displayName})`;
  mockImpl[KEY] = originalImpl;
  return mockImpl;
}
