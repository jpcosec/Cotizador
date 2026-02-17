import { describe, it, expect } from 'vitest';
import { createQuotation } from '../../src/Pipeline/01_context.js';
import { addItem } from '../../src/Pipeline/add_item.js';
import { applyAdjustments } from '../../src/Pipeline/05_adjustments.js';
import { applyManualAdjustments } from '../../src/Pipeline/06_manual_adjustments.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('06_manual_adjustments', () => {
  function buildCtx(store) {
    const ctx = createQuotation({ paxGlobal: 25, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' }, store);
    addItem(ctx, 'ITEM_CHINOOK', {}, store);
    applyAdjustments(ctx, store);
    return ctx;
  }

  it('No adjustments → _netoFinal = _netoAjustado', () => {
    const store = createSeededStore();
    const ctx = buildCtx(store);
    applyManualAdjustments(ctx, store);
    expect(ctx.lineas[0]._netoFinal).toBe(ctx.lineas[0]._netoAjustado);
  });

  it('OVERRIDE_PRECIO → _netoFinal = new value, _valorOriginal preserved', () => {
    const store = createSeededStore();
    const ctx = buildCtx(store);
    store.insert('AJUSTES_COTIZACION', {
      ID_Ajuste: 'ADJ_1',
      ID_Cotizacion: ctx.cotizacion.ID_Cotizacion,
      ID_Linea: ctx.lineas[0].ID_Linea,
      Tipo_Ajuste: 'OVERRIDE_PRECIO',
      Valor_Original: 385000,
      Valor_Nuevo: 350000,
      Motivo: 'Descuento especial',
      Usuario: 'admin',
    });
    applyManualAdjustments(ctx, store);
    expect(ctx.lineas[0]._netoFinal).toBe(350000);
    expect(ctx.lineas[0]._valorOriginal).toBe(385000);
  });

  it('DESCUENTO_LINEA → _netoFinal = _netoAjustado - discount', () => {
    const store = createSeededStore();
    const ctx = buildCtx(store);
    store.insert('AJUSTES_COTIZACION', {
      ID_Ajuste: 'ADJ_2',
      ID_Cotizacion: ctx.cotizacion.ID_Cotizacion,
      ID_Linea: ctx.lineas[0].ID_Linea,
      Tipo_Ajuste: 'DESCUENTO_LINEA',
      Valor_Original: 385000,
      Valor_Nuevo: 35000,
      Motivo: 'Descuento fidelidad',
      Usuario: 'admin',
    });
    applyManualAdjustments(ctx, store);
    expect(ctx.lineas[0]._netoFinal).toBe(385000 - 35000);
  });
});
