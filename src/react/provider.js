import React, { useContext, useMemo, forwardRef } from 'react';
import PropTypes from 'prop-types';

import { KEY } from './constants';
import { Context } from './context';
import { getDisplayName } from './utils';

export const DiProvider = ({ children, use, target }) => {
  const { getDependencies } = useContext(Context);

  // memo provider value so gets computed only once
  const value = useMemo(() => {
    // create a map of dependency real -> mock components for fast lookup
    const useMap = use.reduce((m, d) => m.set(d[KEY], d), new Map());
    // support single or multiple targets
    const targets = target && (Array.isArray(target) ? target : [target]);

    return {
      getDependencies(realDeps, targetChild) {
        // First we collect dependencies from parent providers (if any)
        // If a dependency is not defined we return the original
        const dependencies = getDependencies(realDeps, targetChild);
        if (!targetChild || !targets || targets.includes(targetChild)) {
          return dependencies.map((dep) => useMap.get(dep) || dep);
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
  use: PropTypes.arrayOf(PropTypes.func).isRequired,
};

export function withDi(Comp, deps, target = null) {
  const WrappedComponent = forwardRef((props, ref) => (
    <DiProvider use={deps} target={target}>
      <Comp ref={ref} {...props} />
    </DiProvider>
  ));
  WrappedComponent.displayName = `withDi(${getDisplayName(Comp)})`;
  return WrappedComponent;
}
