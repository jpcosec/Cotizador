/**
 * Formatting functions for pricing display.
 * Extracted from ItemLogic for use in templates and UI components.
 * All functions are pure and stateless.
 */

import { PricingKind, InitializationMode, toNumber, toInteger } from './pricing.js';

/**
 * Format a numeric value as Chilean peso currency string (e.g. "$1.200").
 * @param {number} value
 * @returns {string}
 */
export function money(value) {
  return `$${toInteger(value, 0).toLocaleString('es-CL')}`;
}

/**
 * Build a human-readable pricing formula string for catalog display.
 * Example: "$400 fijo + 3 und/pax x $1"
 * @param {number} base - Fixed base cost.
 * @param {PricingKind} kind
 * @param {InitializationMode} mode
 * @param {number} rate - Per-unit rate.
 * @param {Object} defaults - Default quantities for label formatting.
 * @returns {string}
 */
export function formatCatalogTerms(base, kind, mode, rate, defaults) {
  const parts = [];
  if (base > 0) parts.push(`${money(base)} fijo`);

  if (kind === PricingKind.NONE) {
    return parts.join(' + ') || '$0';
  }

  if (kind === PricingKind.PAX) {
    if (mode === InitializationMode.FIXED_AMOUNT) {
      parts.push(`${toInteger(defaults.pax, 0)} pax x ${money(rate)}`);
    } else {
      parts.push(`${money(rate)} por pax`);
    }
    return parts.join(' + ');
  }

  if (kind === PricingKind.UNITS) {
    if (mode === InitializationMode.FIXED_AMOUNT) {
      parts.push(`${toInteger(defaults.cantidad, 0)} und x ${money(rate)}`);
    } else if (mode === InitializationMode.CONTEXT_PAX) {
      parts.push(`${toNumber(defaults.unidadesPorUsuario, 0)} und/pax x ${money(rate)}`);
    } else if (mode === InitializationMode.CONTEXT_TIME) {
      parts.push(`${toNumber(defaults.unidadesPorHora, 0)} und/h x ${money(rate)}`);
    } else {
      parts.push(`${money(rate)} por unidad`);
    }
    return parts.join(' + ');
  }

  if (kind === PricingKind.TIME) {
    if (mode === InitializationMode.FIXED_AMOUNT) {
      parts.push(`${toInteger(defaults.duracionMin, 0)} min x ${money(rate)}`);
    } else if (mode === InitializationMode.CONTEXT_PAX) {
      parts.push(`${toNumber(defaults.minutosPorUsuario, 0)} min/pax x ${money(rate)}`);
    } else {
      parts.push(`${money(rate)} por minuto`);
    }
    return parts.join(' + ');
  }

  return parts.join(' + ') || '$0';
}

/**
 * Generate a short policy hint describing the initialization rule.
 * Example: "3 und/persona" or "10 min/persona".
 * @param {PricingKind} kind
 * @param {InitializationMode} mode
 * @param {Object} [defaults={}]
 * @returns {string} Empty string if no hint applies.
 */
export function policyHint(kind, mode, defaults = {}) {
  if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_PAX) {
    return `${toNumber(defaults.unidadesPorUsuario, 0)} und/persona`;
  }
  if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_TIME) {
    return `${toNumber(defaults.unidadesPorHora, 0)} und/hora`;
  }
  if (kind === PricingKind.TIME && mode === InitializationMode.CONTEXT_PAX) {
    return `${toNumber(defaults.minutosPorUsuario, 0)} min/persona`;
  }
  return '';
}

/**
 * Build a human-readable breakdown legend for basket display.
 * Example: "$400 + (60 und x $1) = $460"
 * @param {number} base - Fixed base cost.
 * @param {PricingKind} kind
 * @param {number} quantity
 * @param {number} rate
 * @param {number} total
 * @returns {string}
 */
export function legendForBasket(base, kind, quantity, rate, total) {
  if (kind === PricingKind.NONE) return `${money(base)} fijo`;

  const qtyLabel = kind === PricingKind.PAX
    ? `${quantity} pax`
    : kind === PricingKind.UNITS
      ? `${quantity} und`
      : `${quantity} min`;

  return `${money(base)} + (${qtyLabel} x ${money(rate)}) = ${money(total)}`;
}

/**
 * Build a human-readable profile description for pricing display.
 * Example: "$400 fijo + $1 por pax"
 * @param {number} base - Fixed base cost.
 * @param {PricingKind} kind
 * @param {number} rate - Per-unit rate.
 * @returns {string}
 */
export function profileHumanText(base, kind, rate) {
  const parts = [];
  if (base > 0) parts.push(`${money(base)} fijo`);
  if (kind === PricingKind.PAX && rate > 0) parts.push(`${money(rate)} por pax`);
  if (kind === PricingKind.UNITS && rate > 0) parts.push(`${money(rate)} por unidad`);
  if (kind === PricingKind.TIME && rate > 0) parts.push(`${money(rate)} por minuto`);
  return parts.join(' + ') || '$0';
}

/**
 * Map pricing kind to a human-readable rate label for line items.
 * Example: PAX → "Pax", UNITS → "Unidades", TIME → "Duracion"
 * @param {PricingKind} kind
 * @returns {string}
 */
export function lineRateLabel(kind, initMode = null) {
  // For items priced by quantity but controlled by pax, show "per Pax"
  if (kind === PricingKind.UNITS && initMode === InitializationMode.CONTEXT_PAX) {
    return 'por Pax';
  }
  
  if (kind === PricingKind.PAX) return 'Pax';
  if (kind === PricingKind.UNITS) return 'Unidades';
  if (kind === PricingKind.TIME) return 'Duracion';
  return 'Rate';
}
