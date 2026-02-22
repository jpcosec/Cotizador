/**
 * Base adapter for translating XState events into context mutations.
 */
export class XStateInteractionBase {
  /**
   * @param {Object} logic Business logic dependency.
   */
  constructor(logic) {
    this.logic = logic;
  }

  /**
   * Shallow-merge a patch into the top-level context.
   * @param {Object} context - Current XState context.
   * @param {Object} [patch={}] - Fields to merge.
   * @returns {Object} New context with patch applied.
   */
  patchContext(context, patch = {}) {
    return {
      ...context,
      ...patch
    };
  }

  /**
   * Merge a patch into `context.definition`.
   * @param {Object} context
   * @param {Object} [patch={}]
   * @returns {Object} New context with updated definition.
   */
  patchDefinition(context, patch = {}) {
    return this.patchContext(context, {
      definition: {
        ...(context.definition || {}),
        ...patch
      }
    });
  }

  /**
   * Merge a patch into `context.overrides`.
   * @param {Object} context
   * @param {Object} [patch={}]
   * @returns {Object} New context with updated overrides.
   */
  patchOverrides(context, patch = {}) {
    return this.patchContext(context, {
      overrides: {
        ...(context.overrides || {}),
        ...patch
      }
    });
  }

  /**
   * Merge a patch into `context.externalContext`.
   * @param {Object} context
   * @param {Object} [patch={}]
   * @returns {Object} New context with updated external context.
   */
  patchExternalContext(context, patch = {}) {
    return this.patchContext(context, {
      externalContext: {
        ...(context.externalContext || {}),
        ...patch
      }
    });
  }

  /**
   * Remove a single key from `context.overrides`.
   * @param {Object} context
   * @param {string} key - Override key to remove.
   * @returns {Object} New context without the specified override.
   */
  removeOverride(context, key) {
    const next = { ...(context.overrides || {}) };
    delete next[key];
    return this.patchContext(context, { overrides: next });
  }

  /**
   * Project context to derived state.
   * Subclasses should override.
   * @param {Object} context
   * @returns {Object}
   */
  project(context) {
    return context;
  }

  /**
   * Reduce one event into a new projected context.
   * Subclasses should override.
   * @param {Object} context
   * @param {Object} _event
   * @returns {Object}
   */
  reduce(context, _event) {
    return this.project(context);
  }
}
