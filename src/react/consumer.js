import { Context } from './context';
import { globalDi } from './global';

export function di(target, ...deps) {
  // Read context and grab all the dependencies override Providers in the tree
  const { getDependencies } =
    // grab value from alt renderer (eg react-test-renderer)
    (Context._currentRenderer2 && Context._currentValue2) ||
    // grab value from default renderer
    Context._currentValue ||
    globalDi;
  return getDependencies(deps, target);
}
