import { describe, it, expect, beforeEach } from 'vitest';
import { AddItem } from '../../../../mock/Events/quotation/basket/AddItem.js';
import { UpdateItem } from '../../../../mock/Events/quotation/basket/UpdateItem.js';
import { RemoveItem } from '../../../../mock/Events/quotation/basket/RemoveItem.js';
import { ChangePax } from '../../../../mock/Events/quotation/basket/ChangePax.js';
import { Recalculate } from '../../../../mock/Events/quotation/basket/Recalculate.js';
import { ApplyDiscount } from '../../../../mock/Events/quotation/basket/ApplyDiscount.js';
import { OverridePrice } from '../../../../mock/Events/quotation/basket/OverridePrice.js';
import { AddSurcharge } from '../../../../mock/Events/quotation/basket/AddSurcharge.js';
import { QuotationState, resetLineSeq } from '../../../../mock/Core/QuotationState.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

function freshState(pax = 25) {
  resetLineSeq();
  return new QuotationState({
    paxGlobal: pax, fechaEvento: '2025-06-15',
    duracionDias: 1, clienteId: 'CLI_CORP', cotizacionId: 'COT_TEST',
  });
}

describe('AddItem', () => {
  it('adds a simple item', async () => {
    const state = freshState();
    const store = createSeededStore();
    const event = new AddItem({ itemId: 'ITEM_CHINOOK' });
    const result = await event.run(state, store);

    expect(result.errors).toHaveLength(0);
    expect(state.lineas).toHaveLength(1);
    expect(state.lineas[0]._netoBase).toBe(385000);
  });

  it('expands composition into children', async () => {
    const state = freshState(80);
    const store = createSeededStore();
    const event = new AddItem({ itemId: 'PACK_COFFEE_COMPLETO' });
    const result = await event.run(state, store);

    expect(result.errors).toHaveLength(0);
    expect(state.lineas).toHaveLength(3);
    expect(state.lineas.every(l => l._source === 'COMPOSITION')).toBe(true);
  });

  it('respects overrides', async () => {
    const state = freshState();
    const store = createSeededStore();
    const event = new AddItem({ itemId: 'ITEM_CHINOOK', overrides: { Override_Duracion_Min: 600 } });
    await event.run(state, store);

    expect(state.lineas[0]._duracionMin).toBe(600);
  });

  it('fails for unknown item', async () => {
    const state = freshState();
    const store = createSeededStore();
    const event = new AddItem({ itemId: 'BOGUS' });
    const result = await event.run(state, store);
    expect(result.errors).toHaveLength(1);
  });
});

describe('UpdateItem', () => {
  it('re-resolves defaults and price after override change', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }).run(state, store);
    const lineId = state.lineas[0].ID_Linea;

    const event = new UpdateItem({ lineId, overrides: { Override_Pax: 50 } });
    await event.run(state, store);

    expect(state.lineas[0]._pax).toBe(50);
    expect(state.lineas[0]._netoBase).toBe(6380 * 50);
  });
});

describe('RemoveItem', () => {
  it('removes a line by ID', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    const lineId = state.lineas[0].ID_Linea;

    await new RemoveItem({ lineId }).run(state, store);
    expect(state.lineas).toHaveLength(0);
  });
});

describe('ChangePax', () => {
  it('recalculates all lines with new pax', async () => {
    const state = freshState(25);
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    await new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }).run(state, store);

    await new ChangePax({ paxGlobal: 50 }).run(state, store);

    expect(state.paxGlobal).toBe(50);
    expect(state.lineas[0]._netoBase).toBe(385000); // salon unchanged
    expect(state.lineas[1]._pax).toBe(50);
    expect(state.lineas[1]._netoBase).toBe(6380 * 50);
  });
});

describe('Recalculate', () => {
  it('applies adjustments and taxes', async () => {
    const state = freshState(25);
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK', overrides: { Override_Duracion_Min: 600 } }).run(state, store);
    await new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }).run(state, store);

    await new Recalculate().run(state, store);

    expect(state.lineas[0]._netoAjustado).toBe(385000 * 1.25);
    expect(state.totals.taxes).toHaveLength(1);
    expect(state.totals.total).toBeGreaterThan(state.totals.subtotal);
  });

  it('idempotent: same result when run twice', async () => {
    const state = freshState(25);
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    await new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }).run(state, store);

    await new Recalculate().run(state, store);
    const total1 = state.totals.total;

    await new Recalculate().run(state, store);
    expect(state.totals.total).toBe(total1);
  });
});

describe('ApplyDiscount', () => {
  it('adds line discount to ajustesManuales', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    const lineId = state.lineas[0].ID_Linea;

    const event = new ApplyDiscount({ lineId, amount: 10000, tipo: 'DESCUENTO_LINEA' });
    await event.run(state, store);
    expect(state.ajustesManuales).toHaveLength(1);
    expect(state.ajustesManuales[0].Tipo_Ajuste).toBe('DESCUENTO_LINEA');
  });
});

describe('OverridePrice', () => {
  it('adds override to ajustesManuales', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    const lineId = state.lineas[0].ID_Linea;

    await new OverridePrice({ lineId, newPrice: 300000 }).run(state, store);
    expect(state.ajustesManuales).toHaveLength(1);
    expect(state.ajustesManuales[0].Tipo_Ajuste).toBe('OVERRIDE_PRECIO');
  });
});

describe('AddSurcharge', () => {
  it('adds surcharge to ajustesManuales', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddSurcharge({ amount: 50000 }).run(state, store);
    expect(state.ajustesManuales).toHaveLength(1);
    expect(state.ajustesManuales[0].Tipo_Ajuste).toBe('RECARGO');
  });

  it('fails with non-positive amount', async () => {
    const state = freshState();
    const event = new AddSurcharge({ amount: 0 });
    const result = await event.run(state, {});
    expect(result.errors).toHaveLength(1);
  });
});
