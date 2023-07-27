const createState = () => ({
  unused: new Map(),
  used: new Set(),
  provided: new Set(),
});

export const stats = {
  state: createState(),

  set(injObj) {
    // allow injectable override without flagging as unused
    for (let unusedInj of this.state.unused.keys())
      if (unusedInj.from === injObj.from) this.state.unused.delete(unusedInj);

    this.state.unused.set(
      injObj,
      new Error(
        `Unused "di" injectable: ${injObj.value?.displayName || injObj.value}.`,
        { cause: injObj.cause }
      )
    );
  },

  track(inj) {
    if (!inj) return;
    this.state.unused.delete(inj);
    this.state.used.add(inj);
    this.state.provided.add(inj.from);
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
