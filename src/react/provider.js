import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { KEY } from './constants';
import { Context } from './context';

export class DiProvider extends Component {
  static contextType = Context;

  static propTypes = {
    use: PropTypes.arrayOf(PropTypes.func).isRequired,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  };

  constructor(props) {
    super(props);

    this.useMap = new Map();
    props.use.forEach((d) => this.useMap.set(d[KEY], d));

    this.state = {
      getDependencies: this.getDependencies,
    };
  }

  getDependencies = (realDeps) => {
    const { useMap } = this;
    // First we collect dependencies from parent providers (if any)
    // If a dependency is not defined we return the original
    const dependencies = this.context.getDependencies(realDeps);
    return dependencies.map((dep) => useMap.get(dep) || dep);
  };

  render() {
    const { children } = this.props;
    return <Context.Provider value={this.state}>{children}</Context.Provider>;
  }
}

export function withDi(Comp, deps) {
  const WrappedComponent = () => (
    <DiProvider use={deps}>
      <Comp />
    </DiProvider>
  );
  WrappedComponent.displayName = `withDi(${Comp.displayName || ''})`;
  return WrappedComponent;
}
