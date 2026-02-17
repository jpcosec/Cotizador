import { describe, it, expect } from 'vitest';
import { createQuotation } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { applyAdjustments } from '../../src/Pipeline/05_adjustments.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('05_adjustments — Automatic Adjustments', () => {
  const store = createSeededStore();

  it('Salon 480min (standard) → no adjustments, _netoAjustado = _netoBase', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    applyAdjustments(ctx, store);
    const linea = ctx.lineas[0];
    expect(linea._ajustes).toHaveLength(0);
    expect(linea._netoAjustado).toBe(linea._netoBase);
  });

  it('Salon >480min (overtime) → surcharge 25%', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', { Override_Duracion_Min: 600 }, store);
    applyAdjustments(ctx, store);
    const linea = ctx.lineas[0];
    expect(linea._ajustes).toHaveLength(1);
    expect(linea._ajustes[0].ruleId).toBe('R001_OVERTIME');
    expect(linea._netoAjustado).toBe(385000 * 1.25);
  });

  it('Coffee has no adjustments applied', () => {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_COFFEE_BASIC', {}, store);
    applyAdjustments(ctx, store);
    expect(ctx.lineas[0]._ajustes).toHaveLength(0);
    expect(ctx.lineas[0]._netoAjustado).toBe(ctx.lineas[0]._netoBase);
  });
});
