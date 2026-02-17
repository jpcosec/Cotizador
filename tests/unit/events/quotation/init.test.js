import { describe, it, expect, beforeEach } from 'vitest';
import { LoadCatalog } from '../../../../src/Events/quotation/init/LoadCatalog.js';
import { CreateQuotation } from '../../../../src/Events/quotation/init/CreateQuotation.js';
import { QuotationState, resetLineSeq } from '../../../../src/Core/QuotationState.js';
import { createSeededStore } from '../../../helpers/store_factory.js';
import { InMemoryStore } from '../../../../src/DataStore/InMemoryStore.js';

describe('LoadCatalog', () => {
  it('succeeds when all tables have data', async () => {
    const store = createSeededStore();
    const state = {};
    const event = new LoadCatalog();
    const result = await event.run(state, store);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when tables are empty', async () => {
    const store = new InMemoryStore();
    const event = new LoadCatalog();
    const result = await event.run({}, store);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('CreateQuotation', () => {
  beforeEach(() => resetLineSeq());

  it('creates quotation state with valid input', async () => {
    const store = createSeededStore();
    const state = {};
    const event = new CreateQuotation({
      paxGlobal: 25, fechaEvento: '2025-06-15',
      duracionDias: 1, clienteId: 'CLI_CORP',
    });
    const result = await event.run(state, store);
    expect(result.errors).toHaveLength(0);
    expect(result.state.paxGlobal).toBe(25);
    expect(result.state.lineas).toHaveLength(0);
  });

  it('fails with invalid client', async () => {
    const store = createSeededStore();
    const event = new CreateQuotation({ paxGlobal: 25, clienteId: 'INVALID' });
    const result = await event.run({}, store);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fails with missing pax', async () => {
    const store = createSeededStore();
    const event = new CreateQuotation({ clienteId: 'CLI_CORP' });
    const result = await event.run({}, store);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
