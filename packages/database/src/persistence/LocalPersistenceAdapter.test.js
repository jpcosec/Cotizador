import { describe, expect, it } from 'vitest';
import { createDatabase } from '../createDatabase.js';
import { LocalPersistenceAdapter } from './LocalPersistenceAdapter.js';
import { PERSISTENCE_ERROR_CODES } from './PersistencePort.js';

function buildAdapter() {
  const db = createDatabase();
  return new LocalPersistenceAdapter({ models: db.models });
}

function buildPayload(overrides = {}) {
  return {
    cotizacion: {
      ID_Cotizacion: 'COT-1000',
      ID_Cliente: 'CLI-001',
      Estado: 'Borrador',
      Fecha_Evento: '2026-04-10',
      Duracion_Dias: 2,
      Pax_Global: 40,
      Updated_At: '2026-03-12T10:20:30.000Z',
    },
    lineas: [
      {
        ID_Linea: 'LIN-1000-002',
        ID_Cotizacion: 'COT-1000',
        ID_Item: 'ITEM-002',
        Estado_Linea: 'ACTIVA',
        Dia_Numero: 2,
        Hora_Inicio: '14:30',
        Override_Pax: null,
        Override_Cantidad: 2,
        Override_Duracion_Min: null,
        Comentarios: 'Day 2 line',
        Updated_At: '2026-03-12T10:20:30.000Z',
      },
      {
        ID_Linea: 'LIN-1000-001',
        ID_Cotizacion: 'COT-1000',
        ID_Item: 'ITEM-001',
        Estado_Linea: 'ACTIVA',
        Dia_Numero: 1,
        Hora_Inicio: '09:00',
        Override_Pax: 30,
        Override_Cantidad: null,
        Override_Duracion_Min: 60,
        Comentarios: '',
        Updated_At: '2026-03-12T10:20:30.000Z',
      },
    ],
    ...overrides,
  };
}

describe('LocalPersistenceAdapter', () => {
  it('saves and loads a quotation with normalized success contract', async () => {
    const adapter = buildAdapter();
    const saveResult = await adapter.save(buildPayload());

    expect(saveResult.ok).toBe(true);
    expect(saveResult.data.quotationId).toBe('COT-1000');
    expect(saveResult.data.lineCount).toBe(2);

    const loadResult = await adapter.load('COT-1000');
    expect(loadResult.ok).toBe(true);
    expect(loadResult.data.quotationId).toBe('COT-1000');
    expect(loadResult.data.cotizacion.ID_Cliente).toBe('CLI-001');
    expect(loadResult.data.lineas.map((linea) => linea.ID_Linea)).toEqual([
      'LIN-1000-001',
      'LIN-1000-002',
    ]);
  });

  it('upserts header and replaces existing lineas for same quotation id', async () => {
    const adapter = buildAdapter();

    await adapter.save(buildPayload());

    const updatePayload = buildPayload({
      cotizacion: {
        ...buildPayload().cotizacion,
        Pax_Global: 99,
      },
      lineas: [
        {
          ID_Linea: 'LIN-1000-010',
          ID_Cotizacion: 'COT-1000',
          ID_Item: 'ITEM-010',
          Estado_Linea: 'ACTIVA',
          Dia_Numero: 1,
          Hora_Inicio: '12:00',
          Override_Pax: 11,
          Override_Cantidad: 1,
          Override_Duracion_Min: 30,
          Comentarios: 'Updated',
          Updated_At: '2026-03-12T10:20:31.000Z',
        },
      ],
    });

    const saveAgainResult = await adapter.save(updatePayload);
    expect(saveAgainResult.ok).toBe(true);
    expect(saveAgainResult.data.lineCount).toBe(1);

    const loaded = await adapter.load('COT-1000');
    expect(loaded.ok).toBe(true);
    expect(loaded.data.cotizacion.Pax_Global).toBe(99);
    expect(loaded.data.lineas).toHaveLength(1);
    expect(loaded.data.lineas[0].ID_Linea).toBe('LIN-1000-010');
  });

  it('returns INVALID_ARGUMENT when save payload is malformed', async () => {
    const adapter = buildAdapter();
    const result = await adapter.save({ lineas: [] });

    expect(result).toEqual({
      ok: false,
      error: {
        code: PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        message: 'payload.cotizacion is required',
      },
    });
  });

  it('returns INVALID_ARGUMENT when load id is missing', async () => {
    const adapter = buildAdapter();
    const result = await adapter.load('');

    expect(result).toEqual({
      ok: false,
      error: {
        code: PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        message: 'quotation id is required',
      },
    });
  });

  it('returns NOT_FOUND when quotation does not exist', async () => {
    const adapter = buildAdapter();
    const result = await adapter.load('COT-MISSING');

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(PERSISTENCE_ERROR_CODES.NOT_FOUND);
    expect(result.error.message).toBe('Quotation not found: COT-MISSING');
  });

  it('normalizes storage exceptions as STORAGE_ERROR', async () => {
    const adapter = new LocalPersistenceAdapter({
      models: {
        COTIZACIONES: {
          findById: () => null,
          create: () => {
            throw new Error('exploded create');
          },
          update: () => {
            throw new Error('exploded update');
          },
        },
        LINEA_DETALLE: {
          primaryKey: 'ID_Linea',
          where: () => [],
          deleteById: () => true,
          create: () => ({}),
        },
      },
    });

    const result = await adapter.save(buildPayload());
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(PERSISTENCE_ERROR_CODES.STORAGE_ERROR);
    expect(result.error.message).toBe('exploded create');
  });

  it('loads reference seed entries from local models', async () => {
    const adapter = buildAdapter();
    const result = await adapter.loadReferenceData();

    expect(result.ok).toBe(true);
    expect(result.data.tableCount).toBeGreaterThan(0);
    expect(result.data.seedEntries.some((entry) => entry.table === 'ITEM_CATALOGO')).toBe(true);
    expect(result.data.seedEntries.some((entry) => entry.table === 'CATEGORIAS')).toBe(true);
  });
});
