/**
 * Calculation logic for Item.
 *
 * @module ItemCalculator
 */

import {
  PricingKind,
  toNumber,
  toInteger,
  normalizeProfile,
  detectPricingKind,
  detectInitializationMode,
  rateForKind
} from '../domain/pricing.js';
import { resolveBasketQuantity } from '../domain/quantity.js';
import {
  formatCatalogTerms,
  policyHint,
  legendForBasket,
  profileHumanText,
  lineRateLabel
} from '../domain/formatting.js';
import { resolveSchedule } from '../domain/schedule.js';

/**
 * Resolves pricing parameters from definition.
 * @param {Object} state
 * @returns {Object}
 */
export const resolvePricingParams = (state) => {
  const profile = normalizeProfile(state.definition.pricingProfile || {});
  const kind = detectPricingKind(profile);
  return {
    profile,
    kind,
    initMode: detectInitializationMode(kind, state.definition.defaultQuantities || {}),
    rate: rateForKind(profile, kind),
    base: toNumber(profile.baseFijo, 0)
  };
};

/**
 * Resolves effective rate and base considering kit context.
 * @param {Object} params
 * @param {Object} state
 * @returns {Object}
 */
export const resolveEffectiveValues = (params, state) => {
  const isAbsorbido = state.externalContext.kitContext?.tipoPrecio === 'ABSORBIDO';
  return {
    isAbsorbido,
    effectiveRate: isAbsorbido ? 0 : params.rate,
    effectiveBase: isAbsorbido ? 0 : params.base
  };
};

/**
 * Resolves basket quantity and total price.
 * @param {Object} params
 * @param {Object} effective
 * @param {Object} state
 * @returns {Object}
 */
export const resolveQuantityAndTotal = (params, effective, state) => {
  const res = resolveBasketQuantity(
    params.kind, params.initMode, state.definition.defaultQuantities || {},
    state.externalContext, state.overrides
  );
  return {
    quantity: res.quantity,
    isOverridden: res.isOverridden,
    overrideField: res.overrideField,
    total: toInteger(effective.effectiveBase + res.quantity * effective.effectiveRate, 0)
  };
};

/**
 * Resolves quantities object for different pricing kinds.
 * @param {PricingKind} kind
 * @param {number} quantity
 * @returns {Object}
 */
export const resolveQuantitiesObject = (kind, quantity) => ({
  pax: kind === PricingKind.PAX ? quantity : 0,
  cantidad: kind === PricingKind.UNITS ? quantity : 0,
  duracionMin: kind === PricingKind.TIME ? quantity : 0
});

/**
 * Evaluates rules for the item.
 * @param {Object} state
 * @param {Object} quantities
 * @param {Object} schedule
 * @returns {Object}
 */
export const evaluateItemRules = (state, quantities, schedule) => {
  state.rulesCoordinator.invalidateCache();
  return state.rulesCoordinator.evaluate({
    item: {
      id: state.definition.id,
      pax: quantities.pax,
      cantidad: quantities.cantidad,
      duracion: quantities.duracionMin,
      hora: schedule.hora,
      horaMin: schedule.horaMin,
      horaFinMin: schedule.horaMin + quantities.duracionMin,
      dia: schedule.dia,
    }
  });
};

/**
 * Formats all display strings for the item.
 * @param {Object} p - params
 * @param {number} q - quantity
 * @param {number} t - total
 * @returns {Object}
 */
export const formatDisplayStrings = (p, q, t) => ({
  catalogDisaggregated: formatCatalogTerms(p.base, p.kind, p.initMode, p.rate, {}),
  policyHintText: policyHint(p.kind, p.initMode, {}),
  basketLegendText: legendForBasket(p.base, p.kind, q, p.rate, t),
  pricingHumanText: profileHumanText(p.base, p.kind, p.rate),
  lineRateLabelText: lineRateLabel(p.kind, p.initMode)
});
