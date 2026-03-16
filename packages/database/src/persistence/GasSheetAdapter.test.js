import { describe, expect, it } from 'vitest';
import { GasSheetAdapter } from './GasSheetAdapter.js';
import { PERSISTENCE_ERROR_CODES } from './PersistencePort.js';

describe('GasSheetAdapter', () => {
  it('normalizes save/load success response in v2 contract', async () => {
    const calls = [];
    const adapter = new GasSheetAdapter({
      invoke: async (method, payloadOrId) => {
        calls.push([method, payloadOrId]);
        if (method.startsWith('guardar')) {
          return {
            ok: true,
            data: {
              quotationId: 'COT-77',
              cotizacion: { ID_Cotizacion: 'COT-77' },
              lineas: [{ ID_Linea: 'LIN-1' }],
              lineCount: 1,
            },
          };
        }
        return {
          ok: true,
          data: {
            quotationId: 'COT-77',
            cotizacion: { ID_Cotizacion: 'COT-77' },
            lineas: [{ ID_Linea: 'LIN-1' }],
            lineCount: 1,
          },
        };
      },
    });

    const saveResult = await adapter.save({
      cotizacion: { ID_Cotizacion: 'COT-77' },
      lineas: [{ ID_Linea: 'LIN-1' }],
    });
    expect(saveResult.ok).toBe(true);
    expect(saveResult.data.quotationId).toBe('COT-77');

    const loadResult = await adapter.load('COT-77');
    expect(loadResult.ok).toBe(true);
    expect(loadResult.data.lineCount).toBe(1);
    expect(calls[0][0]).toBe('guardarCotizacionV2');
    expect(calls[1][0]).toBe('cargarCotizacionV2');
  });

  it('falls back to legacy methods when v2 is missing', async () => {
    const adapter = new GasSheetAdapter({
      invoke: async (method) => {
        if (method === 'guardarCotizacionV2' || method === 'cargarCotizacionV2') {
          throw new Error(`Method not found: ${method}`);
        }
        if (method === 'guardarCotizacion') {
          return { success: true, id: 'COT-LEGACY' };
        }
        return {
          success: true,
          data: {
            quotationId: 'COT-LEGACY',
            cotizacion: { ID_Cotizacion: 'COT-LEGACY' },
            lineas: [],
          },
        };
      },
    });

    const saveResult = await adapter.save({
      cotizacion: { ID_Cotizacion: 'COT-LEGACY' },
      lineas: [],
    });
    expect(saveResult.ok).toBe(true);
    expect(saveResult.data.quotationId).toBe('COT-LEGACY');

    const loadResult = await adapter.load('COT-LEGACY');
    expect(loadResult.ok).toBe(true);
    expect(loadResult.data.quotationId).toBe('COT-LEGACY');
  });

  it('returns INVALID_ARGUMENT for malformed requests', async () => {
    const adapter = new GasSheetAdapter({ invoke: async () => ({ ok: true, data: {} }) });

    const saveResult = await adapter.save(null);
    expect(saveResult).toEqual({
      ok: false,
      error: {
        code: PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        message: 'payload.cotizacion is required',
      },
    });

    const loadResult = await adapter.load('');
    expect(loadResult).toEqual({
      ok: false,
      error: {
        code: PERSISTENCE_ERROR_CODES.INVALID_ARGUMENT,
        message: 'quotation id is required',
      },
    });
  });

  it('normalizes remote errors into STORAGE_ERROR', async () => {
    const adapter = new GasSheetAdapter({
      invoke: async () => {
        throw new Error('Execution failed');
      },
      saveMethods: ['guardarCotizacion'],
    });

    const result = await adapter.save({
      cotizacion: { ID_Cotizacion: 'COT-1' },
      lineas: [],
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(PERSISTENCE_ERROR_CODES.STORAGE_ERROR);
    expect(result.error.message).toBe('Execution failed');
  });
});
