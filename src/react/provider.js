import React, { useContext, useMemo, forwardRef } from 'react';
import PropTypes from 'prop-types';

import { diRegistry } from './constants';
import { Context } from './context';
import { addInjectableToMap, getDisplayName, findInjectable } from './utils';

export const DiProvider = ({ children, use, target }) => {
  const { getDependencies } = useContext(Context);

  // memo provider value so gets computed only once
  const value = useMemo(() => {
    // create a map of dependency real -> replacements for fast lookup
    const replacementMap = use.reduce(addInjectableToMap, new Map());
    // support single or multiple targets
    const targets = target && (Array.isArray(target) ? target : [target]);

    return {
      getDependencies(realDeps, targetChild) {
        // First we collect dependencies from parent provider(s) (if any)
        const dependencies = getDependencies(realDeps, targetChild);
        // If no target or target is in the array of targets, map use
        if (!targets || targets.includes(targetChild)) {
          return dependencies.map((dep) => {
            // dep can be either the original or a replacement
            // if another provider at the top has already swapped it
            // so we check if here we need to inject a different one
            // or return the original / parent replacement
            const real = diRegistry.has(dep) ? diRegistry.get(dep).from : dep;
            const replacedInj = findInjectable(
              replacementMap,
              real,
              targetChild
            );
            return replacedInj ? replacedInj.value : dep;
          });
        }
        return dependencies;
      },
    };
  }, [getDependencies]); // ignore use & target props

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

DiProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  target: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.func),
  ]),
  use: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  ).isRequired,
};

export function withDi(Comp, deps, target = null) {
  const WrappedComponent = forwardRef((props, ref) => (
    <DiProvider use={deps} target={target}>
      <Comp ref={ref} {...props} />
    </DiProvider>
  ));
  WrappedComponent.displayName = getDisplayName(Comp, 'withDi');
  return WrappedComponent;
}
