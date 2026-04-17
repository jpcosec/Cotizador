import { PricingKind, InitializationMode } from './Enums.js';
import { money, toInteger, toNumber } from './Helpers.js';

/**
 * Build a human-readable pricing formula string for catalog display.
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

  if (kind === PricingKind.NONE) return parts.join(' + ') || '$0';

  if (kind === PricingKind.PAX) {
    if (mode === InitializationMode.FIXED_AMOUNT) parts.push(`${toInteger(defaults.pax, 0)} pax x ${money(rate)}`);
    else parts.push(`${money(rate)} por pax`);
    return parts.join(' + ');
  }

  if (kind === PricingKind.UNITS) {
    if (mode === InitializationMode.FIXED_AMOUNT) parts.push(`${toInteger(defaults.cantidad, 0)} und x ${money(rate)}`);
    else if (mode === InitializationMode.CONTEXT_PAX) parts.push(`${toNumber(defaults.unidadesPorUsuario, 0)} und/pax x ${money(rate)}`);
    else if (mode === InitializationMode.CONTEXT_TIME) parts.push(`${toNumber(defaults.unidadesPorHora, 0)} und/h x ${money(rate)}`);
    else parts.push(`${money(rate)} por unidad`);
    return parts.join(' + ');
  }

  if (kind === PricingKind.TIME) {
    if (mode === InitializationMode.FIXED_AMOUNT) parts.push(`${toInteger(defaults.duracionMin, 0)} min x ${money(rate)}`);
    else if (mode === InitializationMode.CONTEXT_PAX) parts.push(`${toNumber(defaults.minutosPorUsuario, 0)} min/pax x ${money(rate)}`);
    else parts.push(`${money(rate)} por minuto`);
    return parts.join(' + ');
  }

  return parts.join(' + ') || '$0';
}

/**
 * Generate a short policy hint describing the initialization rule.
 * @param {PricingKind} kind
 * @param {InitializationMode} mode
 * @param {Object} [defaults={}]
 * @returns {string}
 */
export function policyHint(kind, mode, defaults = {}) {
  if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_PAX) return `${toNumber(defaults.unidadesPorUsuario, 0)} und/persona`;
  if (kind === PricingKind.UNITS && mode === InitializationMode.CONTEXT_TIME) return `${toNumber(defaults.unidadesPorHora, 0)} und/hora`;
  if (kind === PricingKind.TIME && mode === InitializationMode.CONTEXT_PAX) return `${toNumber(defaults.minutosPorUsuario, 0)} min/persona`;
  return '';
}

/**
 * Build a human-readable breakdown legend for basket display.
 * @param {number} base
 * @param {PricingKind} kind
 * @param {number} quantity
 * @param {number} rate
 * @param {number} total
 * @returns {string}
 */
export function legendForBasket(base, kind, quantity, rate, total) {
  if (kind === PricingKind.NONE) return `${money(base)} fijo`;
  const qtyLabel = kind === PricingKind.PAX ? `${quantity} pax` : kind === PricingKind.UNITS ? `${quantity} und` : `${quantity} min`;
  return `${money(base)} + (${qtyLabel} x ${money(rate)}) = ${money(total)}`;
}

/**
 * Resolve the schedule (day and hour) from overrides or external context.
 * @param {Object} [externalContext={}]
 * @param {Object} [overrides={}]
 * @returns {{ dia: number, hora: string }}
 */
export function resolveSchedule(externalContext = {}, overrides = {}) {
  return { dia: overrides.dia ?? externalContext.dia ?? 1, hora: overrides.hora ?? externalContext.hora ?? '09:00' };
}

/**
 * Evaluate business rules against a state snapshot.
 * @param {Array} [rules=[]]
 * @param {Object} snapshot
 * @returns {{ appliedRules: string[], available: boolean }}
 */
export function evaluateRules(rules = [], snapshot) {
  const appliedRules = [];
  let available = true;
  for (const rule of rules) {
    if (!rule || !rule.active) continue;
    if (rule.type === 'MAX_PAX' && snapshot.quantities.pax > toNumber(rule.value, Infinity)) { appliedRules.push(rule.label || 'MAX_PAX violated'); if (rule.blocking) available = false; continue; }
    if (rule.type === 'MIN_PAX' && snapshot.quantities.pax < toNumber(rule.value, -Infinity)) { appliedRules.push(rule.label || 'MIN_PAX violated'); if (rule.blocking) available = false; continue; }
    if (rule.type === 'ONLY_HOUR_RANGE') {
      const min = String(rule.min || '00:00'); const max = String(rule.max || '23:59'); const hour = String(snapshot.schedule.hora || '00:00');
      if (hour < min || hour > max) { appliedRules.push(rule.label || 'hour out of range'); if (rule.blocking) available = false; }
    }
  }
  return { appliedRules, available };
}
