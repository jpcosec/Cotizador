import { describe, it, expect, beforeEach } from 'vitest';
import { Validate } from '../../../../mock/Events/quotation/finalization/Validate.js';
import { SaveQuotation } from '../../../../mock/Events/quotation/finalization/SaveQuotation.js';
import { AddItem } from '../../../../mock/Events/quotation/basket/AddItem.js';
import { Recalculate } from '../../../../mock/Events/quotation/basket/Recalculate.js';
import { QuotationState, resetLineSeq } from '../../../../mock/Core/QuotationState.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

function freshState(pax = 25) {
  resetLineSeq();
  return new QuotationState({
    paxGlobal: pax, fechaEvento: '2025-06-15',
    duracionDias: 1, clienteId: 'CLI_CORP', cotizacionId: 'COT_TEST',
  });
}

describe('Validate', () => {
  it('passes for valid quotation', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    await new Recalculate().run(state, store);

    const result = await new Validate().run(state, store);
    expect(result.errors).toHaveLength(0);
  });

  it('fails for empty quotation', async () => {
    const state = freshState();
    const result = await new Validate().run(state, {});
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('SaveQuotation', () => {
  it('saves snapshot to store and updates status', async () => {
    const state = freshState();
    const store = createSeededStore();
    await new AddItem({ itemId: 'ITEM_CHINOOK' }).run(state, store);
    await new Recalculate().run(state, store);

    const result = await new SaveQuotation().run(state, store);
    expect(result.errors).toHaveLength(0);
    expect(state.cotizacion.Estado).toBe('Enviada');

    const cached = store.all('CACHE_COTIZACION');
    expect(cached).toHaveLength(1);
    const snapshot = JSON.parse(cached[0].Snapshot_JSON);
    expect(snapshot.lineas).toHaveLength(1);
  });

  it('fails for empty quotation', async () => {
    const state = freshState();
    const store = createSeededStore();
    const result = await new SaveQuotation().run(state, store);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
