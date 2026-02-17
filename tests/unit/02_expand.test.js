import { describe, it, expect } from 'vitest';
import { createQuotation } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('02_expand — Composition Expansion', () => {
  const store = createSeededStore();

  it('Add Coffee Break Completo → 3 child lines, no parent', () => {
    const ctx = createQuotation({ paxGlobal: 30, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'PACK_COFFEE_COMPLETO', {}, store);
    expect(ctx.lineas).toHaveLength(3);
    expect(ctx.lineas.every(l => l.ID_Item !== 'PACK_COFFEE_COMPLETO')).toBe(true);
  });

  it('Each child has _source=COMPOSITION and _parentItem set', () => {
    const ctx = createQuotation({ paxGlobal: 30, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'PACK_COFFEE_COMPLETO', {}, store);
    for (const l of ctx.lineas) {
      expect(l._source).toBe('COMPOSITION');
      expect(l._parentItem).toBe('PACK_COFFEE_COMPLETO');
    }
  });

  it('Each child is individually priced via formula', () => {
    const ctx = createQuotation({ paxGlobal: 30, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'PACK_COFFEE_COMPLETO', {}, store);
    const expected = (6380 + 10395 + 16500) * 30;
    expect(ctx.totals.subtotal).toBe(expected);
  });

  it('Add regular Salon → no expansion, 1 line', () => {
    const ctx = createQuotation({ paxGlobal: 30, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    expect(ctx.lineas).toHaveLength(1);
    expect(ctx.lineas[0]._source).toBeUndefined();
  });
});
