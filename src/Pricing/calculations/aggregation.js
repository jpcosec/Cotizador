import { applyLineAdjustments, applyGlobalAdjustments } from './rules.js';
import { applyManualAdjustments, getGlobalManualAdjustments } from '../manual.js';
import { calculateTaxes } from '../taxes.js';

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
