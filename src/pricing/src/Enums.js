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
