/**
 * Business rules evaluation for item availability and constraints.
 *
 * Checks MAX_PAX, MIN_PAX, and ONLY_HOUR_RANGE rules against a state snapshot.
 * Blocking rules set availability to false when violated.
 */

import { toNumber } from './pricing.js';

/**
 * Evaluate business rules against a state snapshot.
 * Supports MAX_PAX, MIN_PAX, and ONLY_HOUR_RANGE rule types.
 * Blocking rules set `available` to false.
 *
 * @param {Array<{ id: string, type: string, active: boolean, blocking: boolean, label?: string, value?: number, min?: string, max?: string }>} [rules=[]]
 * @param {{ quantities: Object, schedule: Object }} snapshot
 * @param {Object} snapshot.quantities - Contains pax, cantidad, duracionMin
 * @param {Object} snapshot.schedule - Contains dia and hora (HH:MM format)
 * @returns {{ appliedRules: string[], available: boolean }}
 */
export function evaluateRules(rules = [], snapshot) {
  const appliedRules = [];
  let available = true;

  for (const rule of rules) {
    if (!rule || !rule.active) continue;

    if (rule.type === 'MAX_PAX' && snapshot.quantities.pax > toNumber(rule.value, Infinity)) {
      appliedRules.push(rule.label || 'MAX_PAX violated');
      if (rule.blocking) available = false;
      continue;
    }

    if (rule.type === 'MIN_PAX' && snapshot.quantities.pax < toNumber(rule.value, -Infinity)) {
      appliedRules.push(rule.label || 'MIN_PAX violated');
      if (rule.blocking) available = false;
      continue;
    }

    if (rule.type === 'ONLY_HOUR_RANGE') {
      const min = String(rule.min || '00:00');
      const max = String(rule.max || '23:59');
      const hour = String(snapshot.schedule.hora || '00:00');
      if (hour < min || hour > max) {
        appliedRules.push(rule.label || 'hour out of range');
        if (rule.blocking) available = false;
      }
    }
  }

  return { appliedRules, available };
}
