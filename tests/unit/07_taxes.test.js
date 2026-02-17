import { describe, it, expect } from 'vitest';
import { createQuotation } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { applyAdjustments } from '../../src/Pipeline/05_adjustments.js';
import { applyManualAdjustments } from '../../src/Pipeline/06_manual_adjustments.js';
import { calculateTaxes } from '../../src/Pipeline/07_taxes.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('07_taxes — Tax Calculation', () => {
  function fullPipeline(store, items) {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    for (const item of items) addItem(ctx, item, {}, store);
    applyAdjustments(ctx, store);
    applyManualAdjustments(ctx, store);
    calculateTaxes(ctx, store);
    return ctx;
  }

  it('Single line 385,000 → subtotal=385,000, IVA=73,150, total=458,150', () => {
    const store = createSeededStore();
    const ctx = fullPipeline(store, ['ITEM_CHINOOK']);
    expect(ctx.totals.subtotal).toBe(385000);
    expect(ctx.totals.taxes[0].name).toBe('IVA');
    expect(ctx.totals.taxes[0].amount).toBe(385000 * 0.19);
    expect(ctx.totals.total).toBe(385000 * 1.19);
  });

  it('Two lines → subtotal = sum, IVA on sum', () => {
    const store = createSeededStore();
    const ctx = fullPipeline(store, ['ITEM_CHINOOK', 'ITEM_COFFEE_BASIC']);
    const expected = 385000 + 6380 * 25;
    expect(ctx.totals.subtotal).toBe(expected);
    expect(ctx.totals.total).toBe(expected * 1.19);
  });

  it('No tax rules → total = subtotal', () => {
    const store = createSeededStore();
    // Remove all tax rules
    store.seed('REGLAS_NEGOCIO', store.all('REGLAS_NEGOCIO').filter(r => r.Etapa !== 'IMPUESTO'));
    const ctx = fullPipeline(store, ['ITEM_CHINOOK']);
    expect(ctx.totals.taxes).toHaveLength(0);
    expect(ctx.totals.total).toBe(ctx.totals.subtotal);
  });
});
