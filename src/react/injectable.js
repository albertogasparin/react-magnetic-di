import { diRegistry } from './constants';
import { getDisplayName, warnOnce } from './utils';

export function injectable(
  from,
  implementation,
  { displayName, target, track = true, global = false } = {}
) {
  let impl = implementation;
  if (typeof impl === 'function') {
    impl.displayName =
      displayName || getDisplayName(impl) || getDisplayName(from, 'di');
  } else if (typeof impl !== 'object') {
    impl = {
      [Symbol.toPrimitive]() {
        return implementation;
      },
    };
  }

  if (diRegistry.has(impl) && diRegistry.get(impl).from !== from) {
    warnOnce(
      `You are trying to use replacement "${
        displayName || impl.displayName
      }" on multiple injectables. ` +
        `That will override only the last dependency, as each replacement is uniquely linked.`
    );
  }
  diRegistry.set(impl, {
    value: implementation,
    from,
    targets: target && (Array.isArray(target) ? target : [target]),
    track,
    global,
    cause: track
      ? new Error(
          'Injectable created but not used. If this is on purpose, add "{track: false}"'
        )
      : null,
  });
  return impl;
}
