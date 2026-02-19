import { describe, it, expect } from 'vitest';
import { saveQuotationService, sendQuotationService } from '../../../src/Orchestration/adapters/services.js';

function createStoreMock() {
  const rows = [];
  return {
    rows,
    insert(table, row) {
      rows.push({ table, row });
    },
  };
}

describe('services adapters', () => {
  it('saveQuotationService stores quotation snapshot', async () => {
    const store = createStoreMock();
    const quotation = {
      cotizacion: { ID_Cotizacion: 'COT_SVC_1', ID_Cliente: 'CLI_CORP', Estado: 'Borrador' },
      ajustesManuales: [],
    };

    const result = await saveQuotationService({
      quotation,
      lineas: [{ ID_Linea: 'LIN_1', ID_Item: 'ITEM_SALON_FARIO' }],
      totals: { subtotal: 100, taxes: [], total: 119 },
      store,
    });

    expect(result.cotizacionId).toBe('COT_SVC_1');
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0].table).toBe('CACHE_COTIZACION');
  });

  it('sendQuotationService uses custom send transport when available', async () => {
    const transport = async (payload) => ({ transport: 'email', payload });
    const quotation = {
      cotizacion: {
        ID_Cotizacion: 'COT_SVC_2',
        ID_Cliente: 'CLI_CORP',
        Fecha_Evento: '2026-03-01',
        Estado: 'Guardada',
      },
      sendTransport: transport,
    };

    const result = await sendQuotationService({ quotation });
    expect(result.status).toBe('sent');
    expect(result.transport).toBe('email');
  });

  it('sendQuotationService falls back to local queued response', async () => {
    const quotation = {
      cotizacion: {
        ID_Cotizacion: 'COT_SVC_3',
        ID_Cliente: 'CLI_CORP',
        Fecha_Evento: '2026-03-01',
        Estado: 'Guardada',
      },
    };

    const result = await sendQuotationService({ quotation });
    expect(result.status).toBe('queued');
    expect(result.transport).toBe('local-fallback');
  });
});
