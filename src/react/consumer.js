import { Context } from './context';
import { globalDi } from './global';

function di(deps, target) {
  // check if babel plugin has been added othrewise this is a noop
  if (Array.isArray(deps)) {
    // Read context and grab all the dependencies override Providers in the tree
    const { getDependencies } =
      // grab value from alt renderer (eg react-test-renderer)
      (Context._currentRenderer2 && Context._currentValue2) ||
      // grab value from default renderer
      Context._currentValue ||
      globalDi;
    return getDependencies(deps, target);
  }
}

export { di };
