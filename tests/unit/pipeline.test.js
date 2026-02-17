import { describe, it, expect } from 'vitest';
import { createQuotation, updatePax } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { recalculate } from '../../src/Pipeline/pipeline.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('pipeline — Full Recalculation', () => {
  it('recalculate on unchanged ctx → same results', () => {
    const store = createSeededStore();
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);

    const subtotalBefore = 385000 + 6380 * 25;
    recalculate(ctx, store);

    expect(ctx.totals.subtotal).toBe(subtotalBefore);
    expect(ctx.totals.total).toBe(subtotalBefore * 1.19);
  });

  it('updatePax(50) → pax-dependent lines recalculated, fixed lines unchanged', () => {
    const store = createSeededStore();
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);

    updatePax(ctx, 50);
    recalculate(ctx, store);

    // Salon unchanged (not pax-dependent)
    expect(ctx.lineas[0]._netoBase).toBe(385000);
    // Coffee recalculated with new pax
    expect(ctx.lineas[1]._pax).toBe(50);
    expect(ctx.lineas[1]._netoBase).toBe(6380 * 50);

    const expectedSubtotal = 385000 + 6380 * 50;
    expect(ctx.totals.subtotal).toBe(expectedSubtotal);
    expect(ctx.totals.total).toBe(expectedSubtotal * 1.19);
  });
});
