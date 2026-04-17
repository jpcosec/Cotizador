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
 * Format a numeric value as Chilean peso currency string (e.g. "$1.200").
 * @param {number} value
 * @returns {string}
 */
export function money(value) {
  return `$${toInteger(value, 0).toLocaleString('es-CL')}`;
}
