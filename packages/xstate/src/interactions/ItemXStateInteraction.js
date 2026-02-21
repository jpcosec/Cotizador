import { ItemLogic } from '../../../pricing/src/ItemLogic.js';
import { XStateInteractionBase } from './XStateInteractionBase.js';

export class ItemXStateInteraction extends XStateInteractionBase {
  constructor(logic = new ItemLogic()) {
    super(logic);
  }

  project(context) {
    const view = this.logic.evaluate({
      definition: context.definition,
      externalContext: context.externalContext,
      overrides: context.overrides,
      mode: context.mode
    });

    return {
      ...context,
      profile: view.profile,
      quantities: view.quantities,
      schedule: view.schedule,
      comentarios: view.comentarios,
      pricingKind: view.pricingKind,
      initializationMode: view.initializationMode,
      pricingHuman: view.pricingHuman,
      pricingPerQuantityHuman: view.catalogDisaggregated,
      total: view.total,
      catalogPriceDisaggregated: view.catalogDisaggregated,
      catalogFormulaHuman: view.catalogDisaggregated,
      initPolicyHuman: view.policyHint,
      basketLegend: view.basketLegend,
      isOverridden: view.isOverridden,
      lineRateLabel: view.lineRateLabel,
      lineRateValue: view.rate,
      lineRateSubtotal: view.lineRateSubtotal,
      lineBaseValue: view.base,
      unitDisplay: view.unitDisplay,
      showPaxControl: view.showPaxControl,
      showUnitsControl: view.showUnitsControl,
      showTimeControl: view.showTimeControl,
      available: view.available,
      appliedRules: view.appliedRules
    };
  }

  reduce(context, event) {
    if (!event || !event.type) return this.project(context);

    if (event.type === 'SET_MODE') {
      return this.project(this.patchContext(context, { mode: event.mode || 'catalog' }));
    }

    if (event.type === 'SET_EXTERNAL_CONTEXT') {
      return this.project(this.patchExternalContext(context, event.externalContext || {}));
    }

    if (event.type === 'SET_PROFILE_VALUE') {
      const definition = context.definition || {};
      const pricingProfile = {
        ...(definition.pricingProfile || {}),
        [event.key]: Number.isFinite(Number(event.value)) ? Number(event.value) : 0
      };
      return this.project(this.patchDefinition(context, { pricingProfile }));
    }

    if (event.type === 'SET_DEFAULT_QUANTITY_VALUE') {
      const defaults = this.logic.applyExclusiveDefaultMode(
        context.definition?.defaultQuantities || {},
        event.key,
        event.value
      );
      return this.project(this.patchDefinition(context, { defaultQuantities: defaults }));
    }

    if (event.type === 'CLEAR_DEFAULT_QUANTITY_VALUE') {
      const defaults = { ...(context.definition?.defaultQuantities || {}) };
      delete defaults[event.key];
      return this.project(this.patchDefinition(context, { defaultQuantities: defaults }));
    }

    if (event.type === 'SET_OVERRIDE') {
      return this.project(this.patchOverrides(context, { [event.key]: event.value }));
    }

    if (event.type === 'CLEAR_OVERRIDE') {
      return this.project(this.removeOverride(context, event.key));
    }

    if (event.type === 'RESET_OVERRIDES') {
      return this.project(this.patchContext(context, { overrides: {} }));
    }

    return this.project(context);
  }
}
