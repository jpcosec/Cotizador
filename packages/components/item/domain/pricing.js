/**
 * Enum for the variable pricing dimension of an item.
 * Determines which quantity axis drives the per-unit cost.
 * @enum {string}
 */
export const PricingKind = {
  NONE: 'NONE',
  PAX: 'PAX',
  UNITS: 'UNITS',
  TIME: 'TIME'
};

/**
 * Enum for how the initial quantity is resolved.
 * - NONE: no variable quantity.
 * - FIXED_AMOUNT: quantity comes from a hardcoded default.
 * - CONTEXT_PAX: quantity derived from the global pax count.
 * - CONTEXT_TIME: quantity derived from the event duration.
 * @enum {string}
 */
export const InitializationMode = {
  NONE: 'NONE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  CONTEXT_PAX: 'CONTEXT_PAX',
  CONTEXT_TIME: 'CONTEXT_TIME'
};

/**
 * Coerce a value to a finite number, returning fallback if NaN/Infinity.
 * @param {*} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Coerce a value to the nearest integer, returning fallback if invalid.
 * @param {*} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function toInteger(value, fallback = 0) {
  return Math.round(toNumber(value, fallback));
}

/**
 * Normalize a raw pricing profile into canonical field names.
 * Supports both camelCase (`baseFijo`) and schema-style (`Costo_Base_Fijo`) keys.
 * @param {Object} [raw={}]
 * @returns {{ baseFijo: number, porPersona: number, porUnidad: number, porMinuto: number }}
 */
export function normalizeProfile(raw = {}) {
  return {
    baseFijo: toNumber(raw.baseFijo ?? raw.Costo_Base_Fijo ?? 0),
    porPersona: toNumber(raw.porPersona ?? raw.Costo_Unitario_Pax ?? 0),
    porUnidad: toNumber(raw.porUnidad ?? raw.Costo_Unitario_Item ?? 0),
    porMinuto: toNumber(raw.porMinuto ?? raw.Costo_Unitario_Tiempo ?? 0)
  };
}

/**
 * Determine the pricing kind from a normalized profile.
 * Priority: PAX > UNITS > TIME > NONE.
 * @param {{ porPersona: number, porUnidad: number, porMinuto: number }} profile
 * @returns {PricingKind}
 */
export function detectPricingKind(profile) {
  if (toNumber(profile.porPersona, 0) > 0) return PricingKind.PAX;
  if (toNumber(profile.porUnidad, 0) > 0) return PricingKind.UNITS;
  if (toNumber(profile.porMinuto, 0) > 0) return PricingKind.TIME;
  return PricingKind.NONE;
}

/**
 * Determine how the initial quantity should be resolved based on the
 * pricing kind and the available default quantity fields.
 * @param {PricingKind} kind
 * @param {Object} [defaults={}] - Default quantity configuration.
 * @returns {InitializationMode}
 */
export function detectInitializationMode(kind, defaults = {}) {
  if (kind === PricingKind.NONE) return InitializationMode.NONE;

  if (kind === PricingKind.PAX) {
    if (toNumber(defaults.pax, 0) > 0) return InitializationMode.FIXED_AMOUNT;
    return InitializationMode.CONTEXT_PAX;
  }

  if (kind === PricingKind.UNITS) {
    if (toNumber(defaults.cantidad, 0) > 0) return InitializationMode.FIXED_AMOUNT;
    if (toNumber(defaults.unidadesPorUsuario, 0) > 0) return InitializationMode.CONTEXT_PAX;
    if (toNumber(defaults.unidadesPorHora, 0) > 0) return InitializationMode.CONTEXT_TIME;
    return InitializationMode.NONE;
  }

  if (kind === PricingKind.TIME) {
    if (toNumber(defaults.duracionMin, 0) > 0) return InitializationMode.FIXED_AMOUNT;
    if (toNumber(defaults.minutosPorUsuario, 0) > 0) return InitializationMode.CONTEXT_PAX;
    return InitializationMode.CONTEXT_TIME;
  }

  return InitializationMode.NONE;
}

/**
 * Extract the per-unit rate from the profile for the given pricing kind.
 * @param {{ porPersona: number, porUnidad: number, porMinuto: number }} profile
 * @param {PricingKind} kind
 * @returns {number}
 */
export function rateForKind(profile, kind) {
  if (kind === PricingKind.PAX) return toNumber(profile.porPersona, 0);
  if (kind === PricingKind.UNITS) return toNumber(profile.porUnidad, 0);
  if (kind === PricingKind.TIME) return toNumber(profile.porMinuto, 0);
  return 0;
}

/**
 * Map a pricing kind to the override field name used in the overrides object.
 * @param {PricingKind} kind
 * @returns {'pax'|'cantidad'|'duracionMin'|null}
 */
export function overrideFieldForKind(kind) {
  if (kind === PricingKind.PAX) return 'pax';
  if (kind === PricingKind.UNITS) return 'cantidad';
  if (kind === PricingKind.TIME) return 'duracionMin';
  return null;
}

/**
 * Get the fixed default quantity for the given pricing kind.
 * @param {PricingKind} kind
 * @param {Object} [defaults={}]
 * @returns {number}
 */
export function fixedAmountForKind(kind, defaults = {}) {
  if (kind === PricingKind.PAX) return toNumber(defaults.pax, 0);
  if (kind === PricingKind.UNITS) return toNumber(defaults.cantidad, 0);
  if (kind === PricingKind.TIME) return toNumber(defaults.duracionMin, 0);
  return 0;
}
