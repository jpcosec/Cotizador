import { PricingKind, InitializationMode } from './Enums.js';
import { toNumber, toInteger } from './Helpers.js';
import { overrideFieldForKind, fixedAmountForKind } from './PricingDetection.js';

/**
 * Resolve the quantity from external context (paxGlobal, duracionMin)
 * and default multipliers (e.g. unidadesPorUsuario).
 * @param {PricingKind} kind
 * @param {InitializationMode} mode
 * @param {Object} [defaults={}]
 * @param {Object} [context={}] - External context with paxGlobal, duracionMin.
 * @returns {number}
 */
export function resolveContextQuantity(kind, mode, defaults = {}, context = {}) {
  const paxGlobal = toNumber(context.paxGlobal, 0);
  const durationMin = toNumber(context.duracionMin, 0);
  const multiplier = toNumber(context.kitContext?.multiplier, 1);

  let quantity = 0;

  if (mode === InitializationMode.CONTEXT_PAX) {
    if (kind === PricingKind.PAX) quantity = paxGlobal;
    else if (kind === PricingKind.UNITS) quantity = paxGlobal * toNumber(defaults.unidadesPorUsuario, 0);
    else if (kind === PricingKind.TIME) quantity = paxGlobal * toNumber(defaults.minutosPorUsuario, 0);
  } else if (mode === InitializationMode.CONTEXT_TIME) {
    if (kind === PricingKind.UNITS) quantity = (durationMin / 60) * toNumber(defaults.unidadesPorHora, 0);
    else if (kind === PricingKind.TIME) quantity = durationMin;
  }

  return quantity * multiplier;
}

/**
 * Resolve the final basket quantity, considering user overrides first,
 * then fixed defaults, then context-derived values.
 * @param {PricingKind} kind
 * @param {InitializationMode} mode
 * @param {Object} [defaults={}]
 * @param {Object} [context={}]
 * @param {Object} [overrides={}]
 * @returns {{ quantity: number, isOverridden: boolean, overrideField: string|null }}
 */
export function resolveBasketQuantity(kind, mode, defaults = {}, context = {}, overrides = {}) {
  const overrideField = overrideFieldForKind(kind);
  const overrideValue = overrideField ? overrides[overrideField] : null;

  if (overrideField && overrideValue != null) {
    return {
      quantity: toInteger(overrideValue, 0),
      isOverridden: true,
      overrideField
    };
  }

  if (mode === InitializationMode.FIXED_AMOUNT) {
    const multiplier = toNumber(context.kitContext?.multiplier, 1);
    return {
      quantity: toInteger(fixedAmountForKind(kind, defaults) * multiplier, 0),
      isOverridden: false,
      overrideField
    };
  }

  return {
    quantity: toInteger(resolveContextQuantity(kind, mode, defaults, context), 0),
    isOverridden: false,
    overrideField
  };
}

/**
 * Enforce exclusive initialization modes when setting one default key.
 * @param {Object} defaultQuantities
 * @param {string} key
 * @param {number|string} rawValue
 * @returns {Object}
 */
export function applyExclusiveDefaultMode(defaultQuantities = {}, key, rawValue) {
  const value = toNumber(rawValue, 0);
  const next = { ...(defaultQuantities || {}) };

  if (value <= 0) {
    delete next[key];
    return next;
  }

  next[key] = value;

  if (key === 'cantidad') {
    delete next.unidadesPorUsuario;
    delete next.unidadesPorHora;
  }
  if (key === 'unidadesPorUsuario' || key === 'unidadesPorHora') {
    delete next.cantidad;
  }
  if (key === 'duracionMin') {
    delete next.minutosPorUsuario;
  }
  if (key === 'minutosPorUsuario') {
    delete next.duracionMin;
  }

  return next;
}
