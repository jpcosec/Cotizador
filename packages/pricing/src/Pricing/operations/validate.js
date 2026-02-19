import { fullRecalculateBasket } from '../recalculation.js';

/**
 * Perform full basket validation with recalculation.
 * Strips computed fields and recalculates everything from scratch.
 *
 * @param {array} lineas - Current line items
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} store - The data store
 * @returns {{ lineas, quotation, totals, messages, errors }}
 */
export function validate(lineas, quotation, store) {
  try {
    // Filter out soft-deleted items for validation
    const activeLineas = lineas.filter(l => !l._removed);

    // Full recalculation from scratch
    const result = fullRecalculateBasket(activeLineas, quotation, store);

    return {
      lineas: result.lineas,
      quotation,
      totals: result.totals,
      messages: result.messages,
      errors: result.errors,
    };
  } catch (err) {
    return {
      lineas,
      quotation,
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages: [],
      errors: [
        {
          ruleId: 'VALIDATE_ERROR',
          message: err.message || 'Validation failed',
          blocking: true,
        },
      ],
    };
  }
}
