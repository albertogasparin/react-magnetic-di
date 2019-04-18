import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Context } from './context';

export class DependencyProvider extends Component {
  static contextType = Context;

  static propTypes = {
    target: PropTypes.func,
    use: PropTypes.objectOf(PropTypes.any).isRequired,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  };

  constructor(props) {
    super(props);

    this.state = {
      getDependencies: this.getDependencies,
    };
  }

  getDependencies = componentType => {
    const { target, use } = this.props;
    // First we collect dependencies from parent providers (if any)
    // If none, we get the default context value
    const dependencies = this.context.getDependencies(componentType);
    // Only assign own provider deps if no target
    // or target is the same component that is calling provide()
    if (!target || componentType === target) {
      Object.assign(dependencies, use);
    }
    return dependencies;
  };

  render() {
    const { children } = this.props;
    return <Context.Provider value={this.state}>{children}</Context.Provider>;
  }
}
