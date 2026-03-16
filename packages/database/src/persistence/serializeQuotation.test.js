import { describe, expect, it } from 'vitest';
import { serializeQuotation } from './serializeQuotation.js';

const FIXED_NOW = '2026-03-12T10:20:30.000Z';

function buildInput(overrides = {}) {
  return {
    selectedClient: {
      id: 'CLI-001',
      nombre: 'Acme Corp',
    },
    settings: {
      fechaInicio: '2026-04-10',
      duracionDias: 3,
      paxGlobal: 25,
      horaInicio: '08:00',
    },
    basketState: {
      days: [
        {
          dayIndex: 2,
          entries: [
            {
              entryId: 'ENTRY-2',
              itemId: 'ITEM-002',
              state: {
                schedule: { hora: '14:15' },
                overrides: {
                  cantidad: 7,
                  comentarios: 'Afternoon block',
                },
              },
            },
          ],
        },
        {
          dayIndex: 1,
          entries: [
            {
              entryId: 'ENTRY-1',
              itemId: 'ITEM-001',
              state: {
                overrides: {
                  pax: 18,
                  duracionMin: '90',
                  hora: '09:45',
                },
              },
            },
          ],
        },
      ],
    },
    now: FIXED_NOW,
    ...overrides,
  };
}

describe('serializeQuotation', () => {
  it('maps runtime snapshot into COTIZACIONES + LINEA_DETALLE payload', () => {
    const payload = serializeQuotation({
      ...buildInput(),
      quotationId: 'COT-9001',
      idPolicy: {
        createQuotationId: () => 'COT-IGNORED',
        createLineId: ({ quotationId, lineIndex, dayIndex }) =>
          `LIN-${quotationId}-${dayIndex}-${lineIndex + 1}`,
      },
    });

    expect(payload.cotizacion).toEqual({
      ID_Cotizacion: 'COT-9001',
      ID_Cliente: 'CLI-001',
      Estado: 'Borrador',
      Fecha_Evento: '2026-04-10',
      Duracion_Dias: 3,
      Pax_Global: 25,
      Updated_At: FIXED_NOW,
    });

    expect(payload.lineas).toHaveLength(2);
    expect(payload.lineas[0]).toMatchObject({
      ID_Linea: 'LIN-COT-9001-1-1',
      ID_Cotizacion: 'COT-9001',
      ID_Item: 'ITEM-001',
      Dia_Numero: 1,
      Hora_Inicio: '09:45',
      Override_Pax: 18,
      Override_Cantidad: null,
      Override_Duracion_Min: 90,
      Comentarios: '',
      Estado_Linea: 'ACTIVA',
      Updated_At: FIXED_NOW,
    });
    expect(payload.lineas[1]).toMatchObject({
      ID_Linea: 'LIN-COT-9001-2-2',
      ID_Cotizacion: 'COT-9001',
      ID_Item: 'ITEM-002',
      Dia_Numero: 2,
      Hora_Inicio: '14:15',
      Override_Pax: null,
      Override_Cantidad: 7,
      Override_Duracion_Min: null,
      Comentarios: 'Afternoon block',
      Estado_Linea: 'ACTIVA',
      Updated_At: FIXED_NOW,
    });
  });

  it('uses injected idPolicy when quotationId is not provided', () => {
    const policyCalls = [];
    const lineCalls = [];

    const payload = serializeQuotation({
      ...buildInput(),
      quotationId: null,
      idPolicy: {
        createQuotationId(args) {
          policyCalls.push(args);
          return 'COT-CUSTOM-01';
        },
        createLineId(args) {
          lineCalls.push(args);
          return `LIN-${args.dayIndex}-${args.lineIndex + 1}`;
        },
      },
    });

    expect(payload.cotizacion.ID_Cotizacion).toBe('COT-CUSTOM-01');
    expect(payload.lineas.map((linea) => linea.ID_Linea)).toEqual(['LIN-1-1', 'LIN-2-2']);
    expect(policyCalls).toHaveLength(1);
    expect(policyCalls[0].nowIso).toBe(FIXED_NOW);
    expect(lineCalls).toHaveLength(2);
    expect(lineCalls[0].quotationId).toBe('COT-CUSTOM-01');
  });

  it('normalizes invalid override numbers to null', () => {
    const payload = serializeQuotation({
      ...buildInput({
        basketState: {
          days: [
            {
              dayIndex: 1,
              entries: [
                {
                  itemId: 'ITEM-001',
                  state: {
                    overrides: {
                      pax: 'no-number',
                      cantidad: undefined,
                      duracionMin: null,
                      comentarios: null,
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
      quotationId: 'COT-ABC',
      idPolicy: {
        createQuotationId: () => 'COT-ABC',
        createLineId: () => 'LIN-001',
      },
    });

    expect(payload.lineas).toHaveLength(1);
    expect(payload.lineas[0].Override_Pax).toBeNull();
    expect(payload.lineas[0].Override_Cantidad).toBeNull();
    expect(payload.lineas[0].Override_Duracion_Min).toBeNull();
    expect(payload.lineas[0].Comentarios).toBe('');
  });

  it('returns empty lineas when basket has no entries', () => {
    const payload = serializeQuotation({
      ...buildInput({ basketState: { days: [] } }),
      quotationId: 'COT-EMPTY',
      idPolicy: {
        createQuotationId: () => 'COT-EMPTY',
        createLineId: () => 'LIN-UNUSED',
      },
    });

    expect(payload.cotizacion.ID_Cotizacion).toBe('COT-EMPTY');
    expect(payload.lineas).toEqual([]);
  });

  it('throws when selectedClient id is missing', () => {
    expect(() =>
      serializeQuotation({
        ...buildInput({ selectedClient: { nombre: 'No ID' } }),
      })
    ).toThrow('serializeQuotation: selectedClient id is required');
  });
});
