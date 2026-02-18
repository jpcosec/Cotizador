import { resolveItemDefaults, recalculateItemPrice, applyItemRules } from '../pipeline.js';

/**
 * Update an item's properties (quantity, pax, duration, etc).
 *
 * @param {array} lineas - Current line items
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} event - Event with lineaId and overrides to update
 * @param {object} store - The data store
 * @returns {{ lineas, quotation, totals, messages, errors }}
 */
export function updateItem(lineas, quotation, event, store) {
  const messages = [];
  const errors = [];

  try {
    const linea = lineas.find(l => l.ID_Linea === event.lineaId);
    if (!linea) {
      errors.push({
        ruleId: 'UPDATE_ITEM_NOT_FOUND',
        message: `Line ${event.lineaId} not found`,
        blocking: true,
      });
      return {
        lineas,
        quotation,
        totals: { subtotal: 0, taxes: [], total: 0 },
        messages,
        errors,
      };
    }

    // Apply overrides
    if (event.overrides) {
      Object.assign(linea, event.overrides);
    }

    // Recalculate: resolve defaults, price, and apply rules
    resolveItemDefaults(linea, quotation.paxGlobal, store);
    recalculateItemPrice(linea, store);
    const ruleResult = applyItemRules(linea, store);
    if (ruleResult.errors.length > 0) {
      errors.push(...ruleResult.errors);
    }

    return {
      lineas,
      quotation,
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages,
      errors,
    };
  } catch (err) {
    errors.push({
      ruleId: 'UPDATE_ITEM_ERROR',
      message: err.message || 'Failed to update item',
      blocking: true,
    });
    return {
      lineas,
      quotation,
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages,
      errors,
    };
  }
}
