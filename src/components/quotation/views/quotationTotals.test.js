import { describe, expect, it } from 'vitest';
import { createQuotationTotals } from './QuotationTotals.js';

describe('QuotationTotals', () => {
  it('calculates iva and total from subtotal', () => {
    const totals = createQuotationTotals(10000, 0.19);

    expect(totals.toDisplayObject()).toEqual({
      subtotal: 10000,
      iva: 1900,
      total: 11900
    });
  });
});
