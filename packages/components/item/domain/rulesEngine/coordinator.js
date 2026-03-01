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
   * @param {Array}  allRules      - Pre-filtered rules from resolveItemDefinition()
   * @param {string} [componentId] - Used only when rules are NOT pre-filtered (optional guard)
   */
  constructor(componentType, allRules = [], componentId = null) {
    this.componentType = componentType;
    this.componentId = componentId;
    this.cached = null;

    // Secondary guard: filter by Scope, Activo, and ID_Componente.
    // In production, resolveItemDefinition() already pre-filters; this guard
    // catches any stray rules when the coordinator is used directly in tests.
    this.rules = (allRules || [])
      .filter(r => {
        if (!r || r.Scope !== componentType) return false;
        if (r.Activo === false) return false;
        // ID_Componente is the FK field name in REGLAS_NEGOCIO (not ID_ITEM/ID_CATEGORY)
        if (componentId && r.ID_Componente && r.ID_Componente !== componentId) return false;
        return true;
      })
      .sort((a, b) => (a.Prioridad || 0) - (b.Prioridad || 0));
  }

  /**
   * Evaluate all filtered rules against a snapshot.
   * The snapshot must use the `item.*` namespace that matches REGLAS_NEGOCIO.csv:
   *
   *   snapshot = {
   *     item: {
   *       id:         string,   // { "var": "item.id" }
   *       pax:        number,   // { "var": "item.pax" }
   *       cantidad:   number,   // { "var": "item.cantidad" }
   *       duracion:   number,   // { "var": "item.duracion" }
   *       hora:       string,   // { "var": "item.hora" }   'HH:MM'
   *       horaMin:    number,   // minutes from midnight
   *       horaFinMin: number,   // hora start + duration
   *       dia:        number,   // day number (1..N)
   *     }
   *   }
   *
   * Acumulable semantics: when a rule has Acumulable=false and it fires,
   * no further rules of the same Tipo_Accion are evaluated.
   *
   * @param {Object} snapshot
   * @returns {{ appliedRules, errors, warnings, available }}
   */
  evaluate(snapshot) {
    if (this.cached !== null) return this.cached;

    const result = { appliedRules: [], errors: [], warnings: [], available: true };
    let errorsDone = false;
    let warningsDone = false;

    for (const rule of this.rules) {
      const type = rule.Tipo_Accion;

      // Skip if a prior non-accumulating rule of the same type already fired
      if (type === 'ERROR'   && errorsDone)   continue;
      if (type === 'WARNING' && warningsDone) continue;

      if (!this.evaluateCondition(rule.Condicion_JSON, snapshot)) continue;

      const entry = {
        id:             rule.ID_Regla,
        type,
        priority:       rule.Prioridad,
        message:        this.extractMessage(rule),
        humanCondition: humanizeCondition(rule.Condicion_JSON),
        humanPayload:   humanizePayload(type, rule.Payload_JSON),
      };

      result.appliedRules.push(entry);

      if (type === 'ERROR') {
        result.errors.push(entry);
        result.available = false;
        if (rule.Acumulable === false) errorsDone = true;
      } else if (type === 'WARNING') {
        result.warnings.push(entry);
        if (rule.Acumulable === false) warningsDone = true;
      }
      // Other action types (MULTIPLY, ADD_FIXED, etc.) are recorded but have no
      // UI availability effect at the RESTRICCION_UI stage.
    }

    this.cached = result;
    return result;
  }

  /** @private */
  evaluateCondition(conditionJson, snapshot) {
    if (conditionJson === false || conditionJson === 'false') return false;
    if (conditionJson == null) return true;

    try {
      const logic = typeof conditionJson === 'string'
        ? JSON.parse(conditionJson)
        : conditionJson;

      if (logic === true || logic === 'true') return true;
      if (logic === false || logic === 'false') return false;

      return jsonLogic.apply(logic, snapshot);
    } catch (e) {
      console.error(`RulesCoordinator: error evaluating condition: ${e.message}`, conditionJson);
      return false;
    }
  }

  /** @private */
  extractMessage(rule) {
    try {
      const payload = typeof rule.Payload_JSON === 'string'
        ? JSON.parse(rule.Payload_JSON)
        : rule.Payload_JSON;
      return payload?.message || rule.Nombre || 'Rule triggered';
    } catch (e) {
      return rule.Nombre || 'Rule triggered';
    }
  }

  getAppliedRules() { return this.cached?.appliedRules || []; }
  isAvailable()     { return this.cached?.available ?? true; }
  getErrors()       { return this.cached?.errors || []; }
  getWarnings()     { return this.cached?.warnings || []; }
  invalidateCache() { this.cached = null; }
}
