/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { createActor } from 'xstate';
import { Item } from '../../../item/Item.js';
import { createItemMachine } from '../../../item/machine/itemMachine.js';
import { GenericUnitBase } from './GenericUnitBase.js';
import { RuntimeSignal } from './signals.js';

function clonePlain(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => clonePlain(entry));
  }

  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'function' || typeof entry === 'undefined') {
      continue;
    }
    result[key] = clonePlain(entry);
  }
  return result;
}

export class GenericItemBase extends GenericUnitBase {
  constructor(options = {}) {
    super({
      ...options,
      type: options.type ?? 'item',
    });
    this.item = null;
    this.seed = clonePlain(options.seed ?? {});
  }

  initialize(context = {}, boundaries = {}, initialState = {}) {
    const seed = {
      ...clonePlain(this.seed),
      ...clonePlain(initialState.seed ?? {}),
      externalContext: {
        ...clonePlain(this.seed.externalContext ?? {}),
        ...clonePlain(context),
        ...clonePlain(initialState.externalContext ?? {}),
      },
      overrides: {
        ...clonePlain(this.seed.overrides ?? {}),
        ...clonePlain(initialState.overrides ?? {}),
      },
    };

    super.initialize(seed.externalContext ?? {}, boundaries, initialState);
    this.seed = seed;
    this.item = Item.fromSeed(seed);
    this.state = clonePlain(this.item.toDisplayObject());
    this.derived = {
      pricing: {
        subtotal: this.item.total,
        unitDisplay: this.item.derived.unitDisplay,
      },
      rules: {
        errors: clonePlain(this.item.ruleResult?.errors ?? []),
        warnings: clonePlain(this.item.ruleResult?.warnings ?? []),
        appliedRules: clonePlain(this.item.ruleResult?.appliedRules ?? []),
      },
    };
    this.ui = {
      ...this.ui,
      title: this.item.definition.name || this.ui.title,
      subtitle: this.item.definition.description || this.ui.subtitle,
      badges: [this.item.pricingKind, this.item.mode].filter(Boolean),
    };

    const actor = createActor(createItemMachine(seed));
    this.attachActor(actor);
    actor.start();
    this.refresh();
    return this;
  }

  resetItemContext(contextPatch = {}) {
    const nextSeed = {
      ...clonePlain(this.seed),
      externalContext: clonePlain(contextPatch),
      overrides: clonePlain(this.state.overrides ?? this.seed.overrides ?? {}),
      mode: this.state.mode ?? this.seed.mode ?? 'catalog',
    };

    this.seed = nextSeed;
    this.item = Item.fromSeed(nextSeed);
    const actor = createActor(createItemMachine(nextSeed));
    this.attachActor(actor);
    actor.start();
    this.context = clonePlain(nextSeed.externalContext);
    this.refresh();
    return this;
  }

  onActorUpdate(snapshot) {
    const context = snapshot?.context;
    if (!context) {
      return;
    }

    this.state = clonePlain(context);
    this.context = clonePlain(context.externalContext ?? this.context);
    this.derived = {
      pricing: {
        subtotal: Number(context.total || 0),
        unitDisplay: Number(context.unitDisplay || 0),
      },
      rules: {
        errors: clonePlain(context.ruleErrors ?? []),
        warnings: clonePlain(context.ruleWarnings ?? []),
        appliedRules: clonePlain(context.appliedRules ?? []),
      },
    };
    this.ui = {
      ...this.ui,
      title: context.definition?.name || this.ui.title,
      subtitle: context.definition?.description || this.ui.subtitle,
      badges: [context.pricingKind, context.mode].filter(Boolean),
    };
    this.status = context.available === false ? 'blocked' : 'ready';
    this.refresh();
  }

  receiveSignal(signal = {}) {
    if (!this.hasActorRef) {
      return super.receiveSignal(signal);
    }

    if (signal.type === RuntimeSignal.patchContext) {
      this.sendEvent('SET_CONTEXT', { patch: signal.patch ?? signal.contextPatch ?? {} });
      return this;
    }

    if (signal.type === RuntimeSignal.setContext) {
      this.resetItemContext(signal.patch ?? signal.contextPatch ?? {});
      return this;
    }

    if (signal.type === RuntimeSignal.setOverride) {
      if (this.state.mode !== 'basket') {
        this.sendEvent('ADD_TO_BASKET', {});
      }
      this.sendEvent(RuntimeSignal.setOverride, { key: signal.key, value: signal.value });
      return this;
    }

    if (signal.type === RuntimeSignal.clearOverride) {
      if (this.state.mode !== 'basket') {
        this.sendEvent('ADD_TO_BASKET', {});
      }
      this.sendEvent(RuntimeSignal.clearOverride, { key: signal.key });
      return this;
    }

    if (signal.type === RuntimeSignal.resetOverrides) {
      if (this.state.mode !== 'basket') {
        this.sendEvent('ADD_TO_BASKET', {});
      }
      this.sendEvent(RuntimeSignal.resetOverrides, {});
      return this;
    }

    if (signal.type === RuntimeSignal.setProfileValue) {
      this.sendEvent(RuntimeSignal.setProfileValue, { key: signal.key, value: signal.value });
      return this;
    }

    if (signal.type === RuntimeSignal.setDefaultQuantity) {
      this.sendEvent(RuntimeSignal.setDefaultQuantity, { key: signal.key, value: signal.value });
      return this;
    }

    if (signal.type === RuntimeSignal.clearDefaultQuantity) {
      this.sendEvent(RuntimeSignal.clearDefaultQuantity, { key: signal.key });
      return this;
    }

    if (signal.type === RuntimeSignal.setMode) {
      if (signal.value === 'basket') {
        this.sendEvent('ADD_TO_BASKET', {});
      }
      if (signal.value === 'catalog') {
        this.sendEvent('REMOVE_FROM_BASKET', {});
      }
      return this;
    }

    return super.receiveSignal(signal);
  }

  getProjection() {
    return {
      ...super.getProjection(),
      item: clonePlain(this.state),
      derived: {
        ...clonePlain(this.derived),
        quantities: clonePlain(this.state.quantities ?? {}),
        schedule: clonePlain(this.state.schedule ?? {}),
      },
    };
  }

  getSnapshot() {
    return {
      ...super.getSnapshot(),
      seed: clonePlain(this.seed),
      item: clonePlain(this.state),
    };
  }
}
