import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { KEY } from './constants';
import { Context } from './context';
import { getDisplayName } from './utils';

export class DiProvider extends Component {
  static contextType = Context;

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    target: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.arrayOf(PropTypes.func),
    ]),
    use: PropTypes.arrayOf(PropTypes.func).isRequired,
  };

  constructor(props) {
    super(props);

    this.useMap = new Map();
    props.use.forEach((d) => this.useMap.set(d[KEY], d));
    this.targets =
      props.target &&
      (Array.isArray(props.target) ? props.target : [props.target]);

    this.state = {
      getDependencies: this.getDependencies,
    };
  }

  getDependencies = (realDeps, target) => {
    const { useMap } = this;
    // First we collect dependencies from parent providers (if any)
    // If a dependency is not defined we return the original
    const dependencies = this.context.getDependencies(realDeps, target);
    if (!target || !this.targets || this.targets.includes(target)) {
      return dependencies.map((dep) => useMap.get(dep) || dep);
    } else {
      return dependencies;
    }
  };

  render() {
    const { children } = this.props;
    return <Context.Provider value={this.state}>{children}</Context.Provider>;
  }
}

export function withDi(Comp, deps, target) {
  const WrappedComponent = () => (
    <DiProvider use={deps} target={target}>
      <Comp />
    </DiProvider>
  );
  WrappedComponent.displayName = `withDi(${getDisplayName(Comp)})`;
  return WrappedComponent;
}
