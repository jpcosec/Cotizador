// Pipeline orchestration for quotation recalculation.
// Splits recalculation into discrete steps aligned with rule stages.
//
// LEVEL 1: Item-level functions (for basket mutations)
// LEVEL 2: Full basket function (for validation/resume)

import { expandCompositions } from './calculations/expand.js';
import { resolveDefaults } from './calculations/defaults.js';
import { calculateLinePrice } from './calculations/pricing.js';
import { applyLineAdjustments, applyGlobalAdjustments } from './calculations/rules.js';
import { applyManualAdjustments, getGlobalManualAdjustments } from './manual.js';
import { calculateTaxes } from './taxes.js';
import { getRulesForStageAndHook, evaluateCondition } from '../RulesEngine/RulesEngine.js';

// ========== LEVEL 1: Item-level Recalculation ==========

/**
 * Expand compositions for a line (if it's a composition parent).
 * @param {object} linea - The line to expand
 * @param {object} store - The data store
 * @returns {array} The line(s) after expansion (may be [linea] if no expansion)
 */
export function expandItemCompositions(linea, store) {
  const expanded = expandCompositions([linea], store);
  return expanded;
}

/**
 * Resolve Q/T/P defaults for a line.
 * Uses CANTIDAD_DEFAULT rules if available.
 * @param {object} linea - The line to resolve
 * @param {number} paxGlobal - Global pax value
 * @param {object} store - The data store
 */
export function resolveItemDefaults(linea, paxGlobal, store) {
  // First, base defaults from category
  resolveDefaults(linea, paxGlobal, store);

  // TODO: Apply CANTIDAD_DEFAULT rules if needed to modify Q/T/P
  // For now, base defaults are sufficient
}

/**
 * Calculate the base price for a line (_netoBase).
 * @param {object} linea - The line to price
 * @param {object} store - The data store
 */
export function recalculateItemPrice(linea, store) {
  calculateLinePrice(linea, store);
}

/**
 * Apply item-level rules (RESTRICCION_UI, AJUSTE_LINEA).
 * Returns errors and adjusted values.
 * @param {object} linea - The line to check/adjust
 * @param {object} store - The data store
 * @returns {{ linea, errors: [], adjustments: [] }}
 */
export function applyItemRules(linea, store) {
  const errors = [];

  // Check RESTRICCION_UI rules for this item
  const restriccionRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
  for (const rule of restriccionRules) {
    if (!evaluateCondition(rule.Condicion_JSON, { linea })) continue;
    if (rule.Tipo_Accion === 'ERROR') {
      errors.push({
        ruleId: rule.ID_Regla,
        message: rule.Mensaje || rule.ID_Regla,
        blocking: true,
      });
    }
  }

  // Apply AJUSTE_LINEA rules (auto-adjust this line's price)
  applyLineAdjustments([linea], store);

  return {
    linea,
    errors,
    adjustments: linea._ajustes || [],
  };
}

/**
 * Aggregate basket totals and apply global rules and manual adjustments.
 * @param {array} lineas - All line items
 * @param {array} ajustesManuales - Manual adjustments from user
 * @param {object} store - The data store
 * @returns {{ subtotal, taxes, total, messages }}
 */
export function aggregateBasketTotals(lineas, ajustesManuales, store) {
  const messages = [];

  // Apply AJUSTE_GLOBAL rules
  applyGlobalAdjustments(lineas, messages, store);

  // Apply manual adjustments (line-level overrides, discounts)
  applyManualAdjustments(lineas, ajustesManuales);

  // Apply IMPUESTO rules and calculate final totals
  const totals = calculateTaxes(lineas, store);

  // Apply global manual adjustments (DESCUENTO_GLOBAL, RECARGO)
  const globalManuals = getGlobalManualAdjustments(ajustesManuales);
  const globalDelta = globalManuals.reduce(
    (sum, a) =>
      a.Tipo_Ajuste === 'RECARGO' ? sum + a.Valor_Nuevo : sum - a.Valor_Nuevo,
    0
  );

  totals.subtotal += globalDelta;
  totals.total += globalDelta;

  return { totals, messages };
}

// ========== LEVEL 2: Full Basket Recalculation ==========

const STRUCTURAL_KEYS = new Set(['_source', '_parentItem', '_tipoPrecio', '_cantidadComp']);

/**
 * Strip computed fields while preserving structural metadata.
 * @param {array} lineas - Line items to clean
 * @returns {array} Cleaned lines
 */
function stripComputedFields(lineas) {
  return lineas.map(linea => {
    const clean = {};
    for (const [k, v] of Object.entries(linea)) {
      if (!k.startsWith('_') || STRUCTURAL_KEYS.has(k)) {
        clean[k] = v;
      }
    }
    return clean;
  });
}

/**
 * Full basket recalculation from scratch.
 * Used during validation and when resuming from database changes.
 *
 * @param {array} lineas - All line items
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} store - The data store
 * @returns {{ lineas, totals, messages, errors }}
 */
export function fullRecalculateBasket(lineas, quotation, store) {
  const messages = [];
  const errors = [];

  // Step 1: Strip computed fields, keep inputs and structural metadata
  let cleanedLineas = stripComputedFields(lineas);

  // Step 2: For each line, resolve structure and calculate
  for (let i = 0; i < cleanedLineas.length; i++) {
    const linea = cleanedLineas[i];

    // Resolve defaults
    resolveItemDefaults(linea, quotation.paxGlobal, store);

    // Calculate price
    recalculateItemPrice(linea, store);

    // Apply item-level rules
    const ruleResult = applyItemRules(linea, store);
    if (ruleResult.errors.length > 0) {
      errors.push(...ruleResult.errors);
    }
  }

  // Step 3: Aggregate and apply global rules + manual + taxes
  const { totals, messages: globalMessages } = aggregateBasketTotals(
    cleanedLineas,
    quotation.ajustesManuales,
    store
  );

  messages.push(...globalMessages);

  // Step 4: Check basket-level validation rules
  const basketValidationRules = getRulesForStageAndHook('RESTRICCION_UI', null, store);
  for (const rule of basketValidationRules) {
    if (!evaluateCondition(rule.Condicion_JSON, { lineas: cleanedLineas, quotation })) {
      continue;
    }
    if (rule.Tipo_Accion === 'ERROR') {
      errors.push({
        ruleId: rule.ID_Regla,
        message: rule.Mensaje || rule.ID_Regla,
        blocking: true,
      });
    }
  }

  return {
    lineas: cleanedLineas,
    totals,
    messages,
    errors,
  };
}

// ========== OPERATIONS: Public API for Orchestration ==========

// Export operations for state machine adapters
export { addItem } from './operations/addItem.js';
export { updateItem } from './operations/updateItem.js';
export { removeItem } from './operations/removeItem.js';
export { validate } from './operations/validate.js';
export { resume } from './operations/resume.js';
