const createState = () => ({
  unused: new Map(),
  used: new Set(),
  provided: new Set(),
});

export const stats = {
  state: createState(),

  set(inj) {
    // allow injectable override without flagging as unused
    for (let unusedInj of this.state.unused.keys())
      if (unusedInj.from === inj.from) this.state.unused.delete(unusedInj);

    this.state.unused.set(
      inj,
      new Error(
        `Unused "di" injectable: ${inj.value?.displayName || inj.value}.`,
        { cause: inj.cause }
      )
    );
  },

  track(inj) {
    if (!inj) return;
    this.state.unused.delete(inj);
    this.state.used.add(inj);
    this.state.provided.add(inj.from);
    // reset to avoid potential memory leaks via stack traces
    inj.cause = null;
  },

  reset() {
    this.state = createState();
  },

  unused() {
    return Array.from(this.state.unused.entries()).map(([inj, error]) => ({
      get: () => inj.value,
      error: () => error,
    }));
  },
};
