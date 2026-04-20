import { describe, expect, it } from 'vitest';
import { SEED_DATA } from '../database/src/seed.js';
import { seedToResolverDb } from '../database/src/playgroundAdapter.js';
import { createQuotationInternalRuntime } from './createQuotationInternalRuntime.js';
import { createPersistedQuotationRuntime } from './createPersistedQuotationRuntime.js';

function extractClients(seed = []) {
  const rows = seed.find((entry) => entry.table === 'CLIENTES')?.records || [];
  return rows.map((row) => ({
    id: row.ID_Cliente,
    nombre: row.Nombre_Empresa,
    rut: row.RUT,
    email: row.Email,
    telefono: row.Telefono,
  }));
}

function createRuntimeFactory(db, clients) {
  return function createRuntime(initialSettings = {}) {
    return createQuotationInternalRuntime({ db, clients, initialSettings });
  };
}

function buildRuntime({ persistencePort }) {
  const db = seedToResolverDb(SEED_DATA);
  const clients = extractClients(SEED_DATA);

  return {
    clients,
    runtime: createPersistedQuotationRuntime({
      createRuntime: createRuntimeFactory(db, clients),
      persistencePort,
      idPolicy: {
        createQuotationId: () => 'COT-TEST-001',
        createLineId: ({ lineIndex }) => `LIN-${lineIndex + 1}`,
      },
    }),
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

describe('createPersistedQuotationRuntime', () => {
  it('saves from validation and transitions to completed on success', async () => {
    const saveCalls = [];
    const { clients, runtime } = buildRuntime({
      persistencePort: {
        async save(payload) {
          saveCalls.push(payload);
          return {
            ok: true,
            data: {
              quotationId: payload.cotizacion.ID_Cotizacion,
              cotizacion: payload.cotizacion,
              lineas: payload.lineas,
              lineCount: payload.lineas.length,
            },
          };
        },
        async load() {
          return { ok: false, error: { message: 'not used' } };
        },
      },
    });

    runtime.selectClient(clients[0].id);
    runtime.startQuotation();
    runtime.shipItemToSelectedDay('ITEM-001');
    runtime.advanceToValidation();

    const result = await runtime.confirmSave();

    expect(result.ok).toBe(true);
    expect(saveCalls).toHaveLength(1);
    expect(saveCalls[0].cotizacion.ID_Cliente).toBe(clients[0].id);
    expect(runtime.getSnapshot().stage).toBe('completed');
    expect(runtime.getSnapshot().persistence.quotationId).toBe('COT-TEST-001');

    runtime.stop();
  });

  it('keeps validation stage and exposes error when save fails', async () => {
    const { clients, runtime } = buildRuntime({
      persistencePort: {
        async save() {
          return { ok: false, error: { message: 'Save failed on adapter' } };
        },
        async load() {
          return { ok: false, error: { message: 'not used' } };
        },
      },
    });

    runtime.selectClient(clients[0].id);
    runtime.startQuotation();
    runtime.shipItemToSelectedDay('ITEM-001');
    runtime.advanceToValidation();

    const result = await runtime.confirmSave();
    expect(result.ok).toBe(false);
    expect(runtime.getSnapshot().stage).toBe('validation');
    expect(runtime.getSnapshot().persistence.error).toBe('Save failed on adapter');

    runtime.stop();
  });

  it('enters saving while persistence is pending', async () => {
    const saveDeferred = createDeferred();
    const { clients, runtime } = buildRuntime({
      persistencePort: {
        save() {
          return saveDeferred.promise;
        },
        async load() {
          return { ok: false, error: { message: 'not used' } };
        },
      },
    });

    runtime.selectClient(clients[0].id);
    runtime.startQuotation();
    runtime.shipItemToSelectedDay('ITEM-001');
    runtime.advanceToValidation();

    const pendingSave = runtime.confirmSave();
    expect(runtime.getSnapshot().stage).toBe('saving');
    expect(runtime.getSnapshot().persistence.isSaving).toBe(true);

    saveDeferred.resolve({
      ok: true,
      data: {
        quotationId: 'COT-TEST-001',
        cotizacion: { ID_Cotizacion: 'COT-TEST-001' },
        lineas: [],
        lineCount: 0,
      },
    });

    const result = await pendingSave;
    expect(result.ok).toBe(true);
    expect(runtime.getSnapshot().stage).toBe('completed');

    runtime.stop();
  });

  it('loads quotation and hydrates basket + client through runtime API', async () => {
    const { clients, runtime } = buildRuntime({
      persistencePort: {
        async save() {
          return { ok: false, error: { message: 'not used' } };
        },
        async load() {
          return {
            ok: true,
            data: {
              quotationId: 'COT-LOADED-01',
              cotizacion: {
                ID_Cotizacion: 'COT-LOADED-01',
                ID_Cliente: clients[0].id,
                Fecha_Evento: '2026-04-20',
                Duracion_Dias: 2,
                Pax_Global: 60,
              },
              lineas: [
                {
                  ID_Linea: 'LIN-001',
                  ID_Cotizacion: 'COT-LOADED-01',
                  ID_Item: 'ITEM-001',
                  Dia_Numero: 1,
                  Hora_Inicio: '09:00',
                  Override_Pax: 15,
                  Override_Cantidad: null,
                  Override_Duracion_Min: 45,
                  Comentarios: 'Morning service',
                },
                {
                  ID_Linea: 'LIN-002',
                  ID_Cotizacion: 'COT-LOADED-01',
                  ID_Item: 'ITEM-002',
                  Dia_Numero: 2,
                  Hora_Inicio: '14:00',
                  Override_Pax: null,
                  Override_Cantidad: 3,
                  Override_Duracion_Min: null,
                  Comentarios: '',
                },
              ],
            },
          };
        },
      },
    });

    const result = await runtime.loadQuotation('COT-LOADED-01');
    expect(result.ok).toBe(true);

    const snapshot = runtime.getSnapshot();
    expect(snapshot.stage).toBe('basket');
    expect(snapshot.selectedClient.id).toBe(clients[0].id);
    expect(snapshot.settings.duracionDias).toBe(2);
    expect(snapshot.settings.paxGlobal).toBe(60);
    expect(snapshot.basket.summary.totalEntries).toBe(2);
    expect(snapshot.persistence.quotationId).toBe('COT-LOADED-01');
    expect(snapshot.persistence.lastLoadedId).toBe('COT-LOADED-01');

    runtime.stop();
  });

  it('enters loadingQuotation while load is pending', async () => {
    const loadDeferred = createDeferred();
    const { runtime } = buildRuntime({
      persistencePort: {
        async save() {
          return { ok: false, error: { message: 'not used' } };
        },
        load() {
          return loadDeferred.promise;
        },
      },
    });

    const pendingLoad = runtime.loadQuotation('COT-LOADED-01');
    expect(runtime.getSnapshot().stage).toBe('loadingQuotation');
    expect(runtime.getSnapshot().persistence.isLoading).toBe(true);

    loadDeferred.resolve({
      ok: false,
      error: { message: 'Not found yet' },
    });

    const result = await pendingLoad;
    expect(result.ok).toBe(false);
    expect(runtime.getSnapshot().stage).toBe('browse');
    expect(runtime.getSnapshot().persistence.error).toBe('Not found yet');

    runtime.stop();
  });

  it('reinitializes runtime with current settings and clears persistence state', async () => {
    const { clients, runtime } = buildRuntime({
      persistencePort: {
        async save(payload) {
          return {
            ok: true,
            data: {
              quotationId: payload.cotizacion.ID_Cotizacion,
              cotizacion: payload.cotizacion,
              lineas: payload.lineas,
              lineCount: payload.lineas.length,
            },
          };
        },
        async load() {
          return { ok: false, error: { message: 'not used' } };
        },
      },
    });

    runtime.selectClient(clients[0].id);
    runtime.startQuotation();
    runtime.setQuotationSettings({ paxGlobal: 77, duracionDias: 2 });
    runtime.shipItemToSelectedDay('ITEM-001');
    runtime.advanceToValidation();
    await runtime.confirmSave();

    const before = runtime.getSnapshot();
    expect(before.stage).toBe('completed');
    expect(before.persistence.quotationId).toBe('COT-TEST-001');

    const result = runtime.reinitialize();
    expect(result.ok).toBe(true);

    const after = runtime.getSnapshot();
    expect(after.stage).toBe('browse');
    expect(after.settings.paxGlobal).toBe(77);
    expect(after.persistence.quotationId).toBe(null);
    expect(after.persistence.error).toBe(null);

    runtime.stop();
  });

  it('lists quotations through the persistence port', async () => {
    const { runtime } = buildRuntime({
      persistencePort: {
        async save() {
          return { ok: false, error: { message: 'not used' } };
        },
        async load() {
          return { ok: false, error: { message: 'not used' } };
        },
        async listQuotations() {
          return {
            ok: true,
            data: {
              items: [
                {
                  quotationId: 'COT-10',
                  clientName: 'Empresa Uno',
                  pax: 20,
                  quotationDate: '2026-04-15',
                },
              ],
            },
          };
        },
      },
    });

    const result = await runtime.listQuotations({ limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data.items[0].quotationId).toBe('COT-10');

    runtime.stop();
  });
});
