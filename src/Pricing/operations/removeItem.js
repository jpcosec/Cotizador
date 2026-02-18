/**
 * Remove an item from the basket (soft delete).
 * Items marked with _removed=true are kept for traceability but excluded from calculations.
 *
 * @param {array} lineas - Current line items
 * @param {object} quotation - Quotation header (paxGlobal, ajustesManuales, etc)
 * @param {object} event - Event with lineaId to remove
 * @param {object} store - The data store (unused but kept for API consistency)
 * @returns {{ lineas, quotation, totals, messages, errors }}
 */
export function removeItem(lineas, quotation, event, store) {
  const messages = [];
  const errors = [];

  try {
    const linea = lineas.find(l => l.ID_Linea === event.lineaId);
    if (!linea) {
      errors.push({
        ruleId: 'REMOVE_ITEM_NOT_FOUND',
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

    // Soft delete: mark as removed
    linea._removed = true;

    messages.push({
      stage: 'REMOVE_ITEM',
      lineaId: event.lineaId,
      message: `Item removed (marked as _removed for traceability)`,
    });

    return {
      lineas,
      quotation,
      totals: { subtotal: 0, taxes: [], total: 0 },
      messages,
      errors,
    };
  } catch (err) {
    errors.push({
      ruleId: 'REMOVE_ITEM_ERROR',
      message: err.message || 'Failed to remove item',
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
