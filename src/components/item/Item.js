import { RulesCoordinator } from './domain/rulesEngine/coordinator.js';
import { createItemState } from './logic/ItemState.js';
import { createItemProjections } from './logic/ItemProjections.js';
import { mapDefinition } from './logic/ItemMapper.js';
import { resolveSchedule } from './domain/schedule.js';
import { resolvePricingParams, resolveEffectiveValues, resolveQuantityAndTotal, resolveQuantitiesObject, evaluateItemRules, formatDisplayStrings } from './logic/ItemCalculator.js';

export class Item {
  mode; definition; externalContext; overrides; userSetFields;
  derived; rulesCoordinator; ruleResult;

  constructor() {
    Object.assign(this, createItemState(this));
    const descriptors = Object.getOwnPropertyDescriptors(createItemProjections(this));
    for (const key in descriptors) {
      if (!['mode', 'definition', 'externalContext', 'overrides'].includes(key)) {
        Object.defineProperty(this, key, descriptors[key]);
      }
    }
  }

  static fromDefinition(resolvedDef, options = {}) {
    return new Item().initialize({
      mode: 'catalog',
      definition: mapDefinition(resolvedDef),
      externalContext: options.externalContext || {},
      overrides: options.overrides || {}
    });
  }

  static fromSeed(seed) {
    return new Item().initialize(seed);
  }

  initialize(seed = {}) {
    this.mode = seed.mode || 'catalog';
    const def = seed.definition || {};
    this.definition = {
      ...def,
      pricingProfile: { ...def.pricingProfile },
      defaultQuantities: { ...def.defaultQuantities },
      rules: [...(def.rules || [])],
      children: [...(def.children || [])]
    };
    this.externalContext = { ...seed.externalContext };
    this.overrides = { ...seed.overrides };
    this.userSetFields = new Set(seed.userSetFields || []);
    this.rulesCoordinator = new RulesCoordinator('ITEM', this.definition.rules, this.definition.id ?? null);
    return this.calculate();
  }

  calculate() {
    const p = resolvePricingParams(this);
    const eff = resolveEffectiveValues(p, this);
    const qt = resolveQuantityAndTotal(p, eff, this);
    const q = resolveQuantitiesObject(p.kind, qt.quantity);
    const sched = resolveSchedule(this.externalContext, this.overrides);
    const s = formatDisplayStrings(p, qt.quantity, qt.total);

    this.ruleResult = evaluateItemRules(this, q, sched);

    this.derived = {
      profile: p.profile, pricingKind: p.kind, initializationMode: p.initMode,
      rate: p.rate, base: p.base, basketQuantity: qt.quantity, total: qt.total,
      unitDisplay: qt.quantity > 0 ? (qt.total / qt.quantity) : qt.total,
      isAbsorbido: eff.isAbsorbido, isOverridden: qt.isOverridden, overrideField: qt.overrideField,
      catalogDisaggregated: s.catalogDisaggregated, policyHintText: s.policyHintText,
      basketLegendText: s.basketLegendText, pricingHumanText: s.pricingHumanText,
      quantities: q, schedule: sched, lineRateLabel: s.lineRateLabelText, lineRateSubtotal: qt.quantity * p.rate,
      comentarios: this.overrides.comentarios ?? '',
      showPaxControl: p.kind === 'por-persona', showUnitsControl: p.kind === 'por-unidad', showTimeControl: p.kind === 'por-tiempo',
      userSetFields: [...this.userSetFields], isUserSetPax: this.userSetFields.has('pax'),
      isUserSetCantidad: this.userSetFields.has('cantidad'), isUserSetDuracion: this.userSetFields.has('duracionMin')
    };
    return this;
  }
}
