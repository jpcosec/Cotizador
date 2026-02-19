import { fullRecalculateBasket } from '../recalculation.js';

/**
 * Resume quotation from database by recalculating everything.
 * Used when loading saved quotations to restore computed fields.
 *
 * @param {array} lineas - Current line items (from database)
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} store - The data store
 * @returns {{ lineas, quotation, totals, messages, errors }}
 */
export function resume(lineas, quotation, store) {
  try {
    // Full recalculation from scratch to restore computed fields
    const result = fullRecalculateBasket(lineas, quotation, store);

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
          ruleId: 'RESUME_ERROR',
          message: err.message || 'Resume failed',
          blocking: true,
        },
      ],
    };
  }
}
