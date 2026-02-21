export class XStateInteractionBase {
  constructor(logic) {
    this.logic = logic;
  }

  patchContext(context, patch = {}) {
    return {
      ...context,
      ...patch
    };
  }

  patchDefinition(context, patch = {}) {
    return this.patchContext(context, {
      definition: {
        ...(context.definition || {}),
        ...patch
      }
    });
  }

  patchOverrides(context, patch = {}) {
    return this.patchContext(context, {
      overrides: {
        ...(context.overrides || {}),
        ...patch
      }
    });
  }

  patchExternalContext(context, patch = {}) {
    return this.patchContext(context, {
      externalContext: {
        ...(context.externalContext || {}),
        ...patch
      }
    });
  }

  removeOverride(context, key) {
    const next = { ...(context.overrides || {}) };
    delete next[key];
    return this.patchContext(context, { overrides: next });
  }

  project(context) {
    return context;
  }

  reduce(context, _event) {
    return this.project(context);
  }
}
