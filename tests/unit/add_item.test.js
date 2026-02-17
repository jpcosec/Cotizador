import { describe, it, expect } from 'vitest';
import { createQuotation } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('addItem — Orchestrator', () => {
  const store = createSeededStore();

  it('Empty cart + Salon Chinook → 1 line, subtotal=385,000', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    expect(ctx.lineas).toHaveLength(1);
    expect(ctx.totals.subtotal).toBe(385000);
  });

  it('+ Coffee Basic (25 pax) → 2 lines, subtotal=544,500', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);
    expect(ctx.lineas).toHaveLength(2);
    expect(ctx.totals.subtotal).toBe(385000 + 6380 * 25);
  });

  it('+ Ticket Cerveza (auto-qty) → 3 lines, subtotal increased', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);
    addItem(ctx, 'ITEM_TICKET_CERVEZA', {}, store);
    expect(ctx.lineas).toHaveLength(3);
    // 25 pax × 0.5 = 13 (rounded), 13 × 3529
    const cerveza = ctx.lineas[2];
    expect(cerveza._cantidad).toBe(13);
    expect(ctx.totals.subtotal).toBe(385000 + 6380 * 25 + 3529 * 13);
  });

  it('Add with Override_Pax=50 → that line uses 50, others unchanged', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', { Override_Pax: 50 }, store);
    expect(ctx.lineas[0]._pax).toBe(25);
    expect(ctx.lineas[1]._pax).toBe(50);
    expect(ctx.totals.subtotal).toBe(6380 * 25 + 6380 * 50);
  });
});
