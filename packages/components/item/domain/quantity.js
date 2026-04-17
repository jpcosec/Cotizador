/**
 * Quantity resolution logic for items.
 *
 * Standalone functions for resolving item quantities based on:
 * - pricing kind (PAX, UNITS, TIME, NONE)
 * - initialization mode (FIXED_AMOUNT, CONTEXT_PAX, CONTEXT_TIME, NONE)
 * - default quantities from item definition
 * - external context (paxGlobal, duracionMin)
 * - user overrides (pax, cantidad, duracionMin)
 *
 * @module quantity
 */

import {
  PricingKind,
  InitializationMode,
  toNumber,
  toInteger,
  overrideFieldForKind,
  fixedAmountForKind
} from './pricing.js';

/**
 * Resolve the quantity from external context (paxGlobal, duracionMin)
 * and default multipliers (e.g. unidadesPorUsuario).
 *
 * @param {PricingKind} kind - The pricing dimension (PAX, UNITS, TIME, NONE)
 * @param {InitializationMode} mode - How to derive the quantity
 * @param {Object} [defaults={}] - Default quantity configuration
 * @param {Object} [context={}] - External context with paxGlobal, duracionMin
 * @returns {number} - The computed quantity
 *
 * @example
 * // Context-based PAX: returns global pax count
 * resolveContextQuantity(PricingKind.PAX, InitializationMode.CONTEXT_PAX, {}, { paxGlobal: 50 })
 * // => 50
 *
 * @example
 * // Context-based UNITS: returns pax * multiplier
 * resolveContextQuantity(
 *   PricingKind.UNITS,
 *   InitializationMode.CONTEXT_PAX,
 *   { unidadesPorUsuario: 3 },
 *   { paxGlobal: 50 }
 * )
 * // => 150
 *
 * @example
 * // Time-based UNITS: returns (hours) * multiplier
 * resolveContextQuantity(
 *   PricingKind.UNITS,
 *   InitializationMode.CONTEXT_TIME,
 *   { unidadesPorHora: 12 },
 *   { duracionMin: 120 }
 * )
 * // => 24 (2 hours * 12)
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
 *
 * Returns structured result with quantity, override status, and field name.
 *
 * @param {PricingKind} kind - The pricing dimension (PAX, UNITS, TIME, NONE)
 * @param {InitializationMode} mode - How to derive the quantity
 * @param {Object} [defaults={}] - Default quantity configuration
 * @param {Object} [context={}] - External context with paxGlobal, duracionMin
 * @param {Object} [overrides={}] - User overrides (pax, cantidad, duracionMin, etc.)
 * @returns {Object} - Object with quantity, isOverridden, overrideField
 * @returns {number} result.quantity - The final computed quantity
 * @returns {boolean} result.isOverridden - Whether user provided an override
 * @returns {string|null} result.overrideField - Field name if overridden (pax/cantidad/duracionMin)
 *
 * @example
 * // User override takes precedence
 * resolveBasketQuantity(
 *   PricingKind.PAX,
 *   InitializationMode.CONTEXT_PAX,
 *   {},
 *   { paxGlobal: 50 },
 *   { pax: 100 }
 * )
 * // => { quantity: 100, isOverridden: true, overrideField: 'pax' }
 *
 * @example
 * // Fixed default (no override)
 * resolveBasketQuantity(
 *   PricingKind.UNITS,
 *   InitializationMode.FIXED_AMOUNT,
 *   { cantidad: 5 },
 *   {},
 *   {}
 * )
 * // => { quantity: 5, isOverridden: false, overrideField: 'cantidad' }
 *
 * @example
 * // Context derivation (no override)
 * resolveBasketQuantity(
 *   PricingKind.PAX,
 *   InitializationMode.CONTEXT_PAX,
 *   {},
 *   { paxGlobal: 50 },
 *   {}
 * )
 * // => { quantity: 50, isOverridden: false, overrideField: 'pax' }
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
 *
 * Business rule: Only one initialization mode can be active per pricing kind.
 * Setting one key deletes conflicting keys:
 * - `cantidad` conflicts with `unidadesPorUsuario`, `unidadesPorHora`
 * - `unidadesPorUsuario` or `unidadesPorHora` conflict with `cantidad`
 * - `duracionMin` conflicts with `minutosPorUsuario`
 * - `minutosPorUsuario` conflicts with `duracionMin`
 *
 * @param {Object} [defaultQuantities={}] - Current default quantities
 * @param {string} key - The field being set (cantidad, unidadesPorUsuario, etc.)
 * @param {number|string} rawValue - The value to set
 * @returns {Object} - Updated defaultQuantities with conflicts resolved
 *
 * @example
 * // Setting cantidad clears unit multipliers
 * applyExclusiveDefaultMode(
 *   { unidadesPorUsuario: 2, unidadesPorHora: 12 },
 *   'cantidad',
 *   5
 * )
 * // => { cantidad: 5 }
 *
 * @example
 * // Negative or zero values remove the key
 * applyExclusiveDefaultMode(
 *   { cantidad: 5 },
 *   'cantidad',
 *   0
 * )
 * // => {}
 *
 * @example
 * // Setting multiplier clears fixed value
 * applyExclusiveDefaultMode(
 *   { cantidad: 10 },
 *   'unidadesPorUsuario',
 *   3
 * )
 * // => { unidadesPorUsuario: 3 }
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
