import { describe, it, expect } from 'vitest';
import { createQuotation, updatePax } from '../../src/Pipeline/01_context.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('01_context — Quotation Context', () => {
  const store = createSeededStore();

  it('create with 80 pax → paxGlobal=80, lineas=[], totals.total=0', () => {
    const ctx = createQuotation({ paxGlobal: 80, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    expect(ctx.paxGlobal).toBe(80);
    expect(ctx.lineas).toEqual([]);
    expect(ctx.totals.total).toBe(0);
    expect(ctx.cotizacion.Estado).toBe('Borrador');
  });

  it('create with client CLI_CORP → cotizacion.ID_Cliente = CLI_CORP', () => {
    const ctx = createQuotation({ paxGlobal: 50, fechaEvento: '2025-07-01', duracionDias: 2, clienteId: 'CLI_CORP' }, store);
    expect(ctx.cotizacion.ID_Cliente).toBe('CLI_CORP');
  });

  it('updatePax to 100 → paxGlobal=100', () => {
    const ctx = createQuotation({ paxGlobal: 80, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    updatePax(ctx, 100);
    expect(ctx.paxGlobal).toBe(100);
    expect(ctx.cotizacion.Pax_Global).toBe(100);
  });
});
