import { describe, it, expect } from 'vitest';
import { removeItem } from '../../../../src/Pricing/operations/removeItem.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

describe('Pricing/operations/removeItem', () => {
  const store = createSeededStore();

  it('marks item as removed (soft delete)', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
        _netoBase: 385000,
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { lineaId: 'L1' };

    const result = removeItem(lineas, quotation, event, store);

    expect(result.lineas[0]._removed).toBe(true);
    expect(result.lineas[0].ID_Item).toBe('ITEM_CHINOOK');
    expect(result.errors).toHaveLength(0);
    expect(result.messages).toHaveLength(1);
  });

  it('preserves item data while marking as removed', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_COFFEE_BASIC',
        _pax: 25,
        _netoBase: 159500,
        _ajustes: [],
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { lineaId: 'L1' };

    const result = removeItem(lineas, quotation, event, store);

    expect(result.lineas[0]._removed).toBe(true);
    expect(result.lineas[0]._pax).toBe(25);
    expect(result.lineas[0]._netoBase).toBe(159500);
  });

  it('handles non-existent line gracefully', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { lineaId: 'NON_EXISTENT' };

    const result = removeItem(lineas, quotation, event, store);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ruleId).toBe('REMOVE_ITEM_NOT_FOUND');
  });

  it('records message indicating soft delete reason', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { lineaId: 'L1' };

    const result = removeItem(lineas, quotation, event, store);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].stage).toBe('REMOVE_ITEM');
    expect(result.messages[0].lineaId).toBe('L1');
  });

  it('returns required response structure', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
    ];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { lineaId: 'L1' };

    const result = removeItem(lineas, quotation, event, store);

    expect(result).toHaveProperty('lineas');
    expect(result).toHaveProperty('quotation');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('errors');
  });
});
