import { KEY } from './constants';

export const stats = {
  state: {
    unused: new Map(),
    used: new Set(),
    missing: new Map(),
    provided: new Set(),
  },

  set(replacedDep) {
    this.state.unused.set(
      replacedDep,
      new Error(
        `Unused di injectable: ${replacedDep.displayName || replacedDep}`
      )
    );
  },

  track(replacedDep, dep) {
    if (replacedDep) {
      this.state.unused.delete(replacedDep);
      this.state.used.add(replacedDep);
      this.state.missing.delete(dep);
      this.state.provided.add(dep);
    } else if (!dep[KEY] && !this.state.provided.has(dep)) {
      this.state.missing.set(
        dep,
        new Error(`Unreplaced di dependency: ${dep.displayName || dep}`)
      );
    }
  },

  reset() {
    for (let key in this.state) {
      this.state[key].clear();
    }
  },

  unused() {
    return Array.from(this.state.unused.entries()).map(
      ([injectable, error]) => ({
        get: () => injectable,
        error: () => error,
      })
    );
  },

  missing() {
    return Array.from(this.state.missing.entries()).map(
      ([dependency, error]) => ({
        get: () => dependency,
        error: () => error,
      })
    );
  },
};
