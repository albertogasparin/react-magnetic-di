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

export function injectable(
  from,
  implementation,
  { displayName, track = true } = {}
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
    track,
    cause: new Error(
      'Injectable created but not used. If this is on purpose, add "{track: false}"'
    ),
  });
  return impl;
}

export function debug(fn) {
  const source = fn.toString();
  const [, args] = source.match(/const \[[^\]]+\] = .*di.*\(\[([^\]]+)/) || [];
  return args;
}
