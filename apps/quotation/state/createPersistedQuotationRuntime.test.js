import { describe, expect, it } from 'vitest';
import { SEED_DATA } from '../../../packages/database/src/seed.js';
import { seedToResolverDb } from '../../../packages/database/src/playgroundAdapter.js';
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
});
