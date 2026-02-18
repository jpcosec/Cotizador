import { describe, it, expect } from 'vitest';
import { updateItem } from '../../../../src/Pricing/operations/updateItem.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

describe('Pricing/operations/updateItem', () => {
  const store = createSeededStore();

  it('updates item with pax override', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_COFFEE_BASIC',
        Override_Pax: null,
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = {
      lineaId: 'L1',
      overrides: { Override_Pax: 50 },
    };

    const result = updateItem(lineas, quotation, event, store);

    expect(result.lineas[0]._pax).toBe(50);
    expect(result.lineas[0]._netoBase).toBe(6380 * 50);
    expect(result.errors).toHaveLength(0);
  });

  it('updates item with duration override', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
        Override_Duracion_Min: 480,
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = {
      lineaId: 'L1',
      overrides: { Override_Duracion_Min: 600 },
    };

    const result = updateItem(lineas, quotation, event, store);

    expect(result.lineas[0]._duracionMin).toBe(600);
  });

  it('updates item with quantity override', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_TICKET_CERVEZA',
        Override_Cantidad: null,
      },
    ];
    const quotation = { paxGlobal: 80, ajustesManuales: [] };
    const event = {
      lineaId: 'L1',
      overrides: { Override_Cantidad: 50 },
    };

    const result = updateItem(lineas, quotation, event, store);

    expect(result.lineas[0]._cantidad).toBe(50);
    expect(result.lineas[0]._netoBase).toBe(3529 * 50);
  });

  it('handles non-existent line gracefully', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = {
      lineaId: 'NON_EXISTENT',
      overrides: {},
    };

    const result = updateItem(lineas, quotation, event, store);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ruleId).toBe('UPDATE_ITEM_NOT_FOUND');
  });

  it('returns required response structure', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = {
      lineaId: 'L1',
      overrides: {},
    };

    const result = updateItem(lineas, quotation, event, store);

    expect(result).toHaveProperty('lineas');
    expect(result).toHaveProperty('quotation');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('errors');
  });
});
