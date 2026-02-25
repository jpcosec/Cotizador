/**
 * RulesCoordinator - Evaluate rules at component level
 *
 * Filters rules by (Scope, ComponentID) and evaluates conditions using json-logic-js.
 * Results are cached after first evaluation (not re-evaluated on property changes).
 * Re-evaluation happens when rules list changes or explicit invalidation.
 *
 * @module RulesCoordinator
 */

import jsonLogic from 'json-logic-js';
import { humanizeCondition, humanizePayload } from './humanize.js';

/**
 * RulesCoordinator - Component-level rule evaluation with caching
 *
 * Usage:
 * ```js
 * const coord = new RulesCoordinator('ITEM', allRules, 'ITEM_SALON_CHINOOK_...');
 * const result = coord.evaluate({ pax: 50, hora: '14:00', ... });
 * // → { appliedRules, errors, warnings, available }
 * ```
 */
export class RulesCoordinator {
  /**
   * @param {string} componentType - ITEM, CATEGORY, KIT, CONTAINER, BASKET
   * @param {Array} allRules - All rules from definition
   * @param {string} [componentId] - For filtering (required for ITEM, CATEGORY, KIT, CONTAINER)
   */
  constructor(componentType, allRules = [], componentId = null) {
    this.componentType = componentType;
    this.componentId = componentId;
    this.cached = null;

    // Filter rules at construction time
    // Key insight: Component ID matching happens in the FILTER, not the condition
    this.rules = (allRules || [])
      .filter(r => {
        // Must match component type
        if (!r || r.Scope !== componentType) return false;

        // Must be active
        if (r.Activo === false) return false;

        // For component-specific types, filter by ID
        // (BASKET doesn't need ID filtering)
        if (componentType !== 'BASKET' && componentId) {
          const idField = `ID_${componentType}`;
          // If rule has ID field and it doesn't match, skip it
          if (r[idField] && r[idField] !== componentId) return false;
        }

        return true;
      })
      // Sort by priority (ascending: lower number = higher priority)
      .sort((a, b) => (a.Prioridad || 0) - (b.Prioridad || 0));
  }

  /**
   * Evaluate all filtered rules against a snapshot.
   * Results are cached after first call.
   *
   * @param {Object} snapshot - Component state snapshot
   *   For ITEM: { itemId, pax, cantidad, duracionMin, hora, dia, ... }
   *   For CATEGORY: { categoryId, totalItems, ... }
   *   etc.
   * @returns {Object} { appliedRules, errors, warnings, available }
   */
  evaluate(snapshot) {
    // Return cached result if already evaluated
    if (this.cached !== null) {
      return this.cached;
    }

    const result = {
      appliedRules: [],
      errors: [],
      warnings: [],
      available: true
    };

    // Evaluate each rule
    for (const rule of this.rules) {
      // Evaluate condition
      const conditionMatches = this.evaluateCondition(rule.Condicion_JSON, snapshot);

      if (!conditionMatches) {
        continue;
      }

      // Condition matched - execute action
      const actionResult = {
        id: rule.ID_Regla,
        type: rule.Tipo_Accion,
        priority: rule.Prioridad,
        message: this.extractMessage(rule)
      };

      // Add humanized versions for UI display
      actionResult.humanCondition = humanizeCondition(rule.Condicion_JSON);
      actionResult.humanPayload = humanizePayload(rule.Tipo_Accion, rule.Payload_JSON);

      // Add to applied rules
      result.appliedRules.push(actionResult);

      // Handle action type
      if (rule.Tipo_Accion === 'ERROR') {
        result.errors.push(actionResult);
        result.available = false; // Blocking error
      } else if (rule.Tipo_Accion === 'WARNING') {
        result.warnings.push(actionResult);
        // Non-blocking: available stays true
      }
      // Other action types (MULTIPLY, ADD_FIXED, etc.) have no effect yet
      // They're recorded in appliedRules for UI display
    }

    // Cache result
    this.cached = result;
    return result;
  }

  /**
   * Evaluate a single condition using json-logic-js
   * @private
   */
  evaluateCondition(conditionJson, snapshot) {
    // Explicitly check for false BEFORE checking for falsy values
    if (conditionJson === false || conditionJson === 'false') return false;

    // No condition (null/undefined) = always true
    if (conditionJson == null) return true;

    try {
      const logic = typeof conditionJson === 'string'
        ? JSON.parse(conditionJson)
        : conditionJson;

      // Handle trivial boolean conditions again (in case it was a string)
      if (logic === true || logic === 'true') return true;
      if (logic === false || logic === 'false') return false;

      // Use json-logic-js for evaluation
      return jsonLogic.apply(logic, snapshot);
    } catch (e) {
      console.error(`Error evaluating condition: ${e.message}`, conditionJson);
      return false;
    }
  }

  /**
   * Extract message from payload
   * @private
   */
  extractMessage(rule) {
    try {
      const payload = typeof rule.Payload_JSON === 'string'
        ? JSON.parse(rule.Payload_JSON)
        : rule.Payload_JSON;

      return payload.message || rule.Nombre || 'Rule triggered';
    } catch (e) {
      return rule.Nombre || 'Rule triggered';
    }
  }

  /**
   * Convenience getters
   */
  getAppliedRules() {
    return this.cached?.appliedRules || [];
  }

  isAvailable() {
    return this.cached?.available ?? true;
  }

  getErrors() {
    return this.cached?.errors || [];
  }

  getWarnings() {
    return this.cached?.warnings || [];
  }

  /**
   * Invalidate cache (for testing or when rules change)
   */
  invalidateCache() {
    this.cached = null;
  }
}
