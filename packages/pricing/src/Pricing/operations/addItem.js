import {
  expandItemCompositions,
  resolveItemDefaults,
  recalculateItemPrice,
  applyItemRules,
} from '../recalculation.js';

/**
 * Add a new item to the basket.
 *
 * @param {array} lineas - Current line items
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} event - Event with itemId and optional overrides
 * @param {object} store - The data store
 * @returns {{ lineas, quotation, totals, messages, errors }}
 */
export function addItem(lineas, quotation, event, store) {
  const messages = [];
  const errors = [];

  try {
    // Create new line from event
    const newLine = {
      ID_Linea: `L${Date.now()}_${Math.random()}`,
      ID_Item: event.itemId,
      ...event.overrides,
    };

    // Step 1: Expand if composition
    const expanded = expandItemCompositions(newLine, store);

    // Step 2: For each expanded line, resolve defaults and calculate
    for (const linea of expanded) {
      resolveItemDefaults(linea, quotation.paxGlobal, store);
      recalculateItemPrice(linea, store);
      const ruleResult = applyItemRules(linea, store);
      if (ruleResult.errors.length > 0) {
        errors.push(...ruleResult.errors);
      }
    }

    // Add to basket
    lineas.push(...expanded);

    return {
      lineas,
      quotation,
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages,
      errors,
    };
  } catch (err) {
    errors.push({
      ruleId: 'ADD_ITEM_ERROR',
      message: err.message || 'Failed to add item',
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
