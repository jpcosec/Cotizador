import { describe, it, expect } from 'vitest';
import { createQuotation, updatePax } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { recalculate } from '../../src/Pipeline/pipeline.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('Integration: Corporate Seminar (25 pax, 1 day)', () => {
  const store = createSeededStore();
  const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);

  it('1. createQuotation → empty, total=0', () => {
    expect(ctx.lineas).toHaveLength(0);
    expect(ctx.totals.total).toBe(0);
  });

  it('2. addItem(Salon Chinook) → subtotal=385,000', () => {
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    expect(ctx.totals.subtotal).toBe(385000);
  });

  it('3. addItem(Coffee Basic) → subtotal=544,500', () => {
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);
    expect(ctx.totals.subtotal).toBe(385000 + 6380 * 25);
  });

  it('4. addItem(Almuerzo) → subtotal updated', () => {
    addItem(ctx, 'ITEM_ALMUERZO', {}, store);
    expect(ctx.totals.subtotal).toBe(385000 + 6380 * 25 + 27311 * 25);
  });

  it('5. recalculate with taxes → total = subtotal × 1.19', () => {
    recalculate(ctx, store);
    const expected = 385000 + 6380 * 25 + 27311 * 25;
    expect(ctx.totals.subtotal).toBe(expected);
    expect(ctx.totals.total).toBeCloseTo(expected * 1.19, 0);
  });

  it('6. updatePax(50) → coffee + almuerzo recalculated, salon unchanged', () => {
    updatePax(ctx, 50);
    recalculate(ctx, store);

    expect(ctx.lineas[0]._netoBase).toBe(385000); // salon unchanged
    expect(ctx.lineas[1]._pax).toBe(50);
    expect(ctx.lineas[1]._netoBase).toBe(6380 * 50);
    expect(ctx.lineas[2]._pax).toBe(50);
    expect(ctx.lineas[2]._netoBase).toBe(27311 * 50);

    const expected = 385000 + 6380 * 50 + 27311 * 50;
    expect(ctx.totals.subtotal).toBe(expected);
    expect(ctx.totals.total).toBeCloseTo(expected * 1.19, 0);
  });
});

describe('Integration: Wedding (80 pax, overtime + composition)', () => {
  const store = createSeededStore();
  const ctx = createQuotation({ paxGlobal: 80, fechaEvento: '2025-12-20', duracionDias: 1, clienteId: 'CLI_WEDDING' }, store);

  it('1. createQuotation(80 pax) → empty', () => {
    expect(ctx.paxGlobal).toBe(80);
    expect(ctx.lineas).toHaveLength(0);
  });

  it('2. addItem(Salon Chinook, Override_Duracion=600) → overtime applies after recalculate', () => {
    addItem(ctx, 'ITEM_CHINOOK', { Override_Duracion_Min: 600 }, store);
    expect(ctx.lineas[0]._duracionMin).toBe(600);
  });

  it('3. addItem(Coffee Break Pack) → expands to 3 children', () => {
    addItem(ctx, 'PACK_COFFEE_COMPLETO', {}, store);
    // 1 salon + 3 coffee children = 4
    expect(ctx.lineas).toHaveLength(4);
    expect(ctx.lineas.filter(l => l._source === 'COMPOSITION')).toHaveLength(3);
  });

  it('4. addItem(DJ large) → fixed price', () => {
    addItem(ctx, 'ITEM_DJ_LARGE', {}, store);
    expect(ctx.lineas).toHaveLength(5);
    const dj = ctx.lineas[4];
    expect(dj._netoBase).toBe(1200000);
  });

  it('5. addItem(Ticket Cerveza) → auto-qty from 80 pax', () => {
    addItem(ctx, 'ITEM_TICKET_CERVEZA', {}, store);
    const cerveza = ctx.lineas[5];
    expect(cerveza._pax).toBe(80);
    expect(cerveza._cantidad).toBe(40); // 80 × 0.5
    expect(cerveza._netoBase).toBe(3529 * 40);
  });

  it('6. recalculate → overtime applied, pack expanded, IVA on total', () => {
    recalculate(ctx, store);

    // Overtime surcharge on salon
    const salon = ctx.lineas[0];
    expect(salon._ajustes).toHaveLength(1);
    expect(salon._netoAjustado).toBe(385000 * 1.25);

    // Coffee children individually priced
    const coffees = ctx.lineas.filter(l => l._source === 'COMPOSITION');
    expect(coffees).toHaveLength(3);

    // IVA applied
    expect(ctx.totals.taxes).toHaveLength(1);
    expect(ctx.totals.taxes[0].name).toBe('IVA');
    expect(ctx.totals.total).toBeGreaterThan(ctx.totals.subtotal);
    expect(ctx.totals.total).toBeCloseTo(ctx.totals.subtotal * 1.19, 0);
  });
});
