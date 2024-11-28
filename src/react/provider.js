import React, { forwardRef, Component } from 'react';
import PropTypes from 'prop-types';

import { diRegistry } from './constants';
import { Context } from './context';
import { addInjectableToMap, getDisplayName, findInjectable } from './utils';
import { globalDi } from './global';

export class DiProvider extends Component {
  static contextType = Context;

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    global: PropTypes.bool,
    target: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.arrayOf(PropTypes.func),
    ]),
    use: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    ).isRequired,
  };

  componentDidCatch(err) {
    globalDi._remove(this.props.use);
    throw err;
  }

  componentWillUnmount() {
    globalDi._remove(this.props.use);
  }

  value = undefined;
  getValue() {
    if (this.value) return this.value;

    const { use, target, global } = this.props;
    const { getDependencies } = this.context;

    // create a map of dependency real -> replacements for fast lookup
    const replacementMap = use.reduce((acc, inj) => {
      addInjectableToMap(acc, inj);
      return acc;
    }, new Map());
    // supports global di if needed
    globalDi._fromProvider(use, { global });
    // support single or multiple targets
    const targets =
      target && new WeakSet(Array.isArray(target) ? target : [target]);

    this.value = {
      getDependencies(realDeps, targetChild) {
        // First we collect dependencies from parent provider(s) (if any)
        const dependencies = getDependencies(realDeps, targetChild);
        // If no target or target is in the array of targets, map use
        if (!targets || targets.has(targetChild)) {
          for (let i = 0; i < dependencies.length; i++) {
            // dep can be either the original or a replacement
            // if another provider at the top has already swapped it
            // so we check if here we need to inject a different one
            // or return the original / parent replacement
            const dep = dependencies[i];
            const real = diRegistry.has(dep) ? diRegistry.get(dep).from : dep;
            const replacedInj = findInjectable(
              replacementMap,
              real,
              targetChild
            );
            if (replacedInj) dependencies[i] = replacedInj.value;
          }
        }
        return dependencies;
      },
    };
    return this.value;
  }

  render() {
    return (
      <Context.Provider value={this.getValue()}>
        {this.props.children}
      </Context.Provider>
    );
  }
}

export function withDi(Comp, deps, target = null) {
  const WrappedComponent = forwardRef((props, ref) => (
    <DiProvider use={deps} target={target}>
      <Comp ref={ref} {...props} />
    </DiProvider>
  ));
  WrappedComponent.displayName = getDisplayName(Comp, 'withDi');
  return WrappedComponent;
}
