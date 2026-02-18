import { describe, it, expect } from 'vitest';
import { addItem } from '../../../../src/Pricing/operations/addItem.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

describe('Pricing/operations/addItem', () => {
  const store = createSeededStore();

  it('adds a simple item to empty basket', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { itemId: 'ITEM_CHINOOK' };

    const result = addItem(lineas, quotation, event, store);

    expect(result.lineas).toHaveLength(1);
    expect(result.lineas[0].ID_Item).toBe('ITEM_CHINOOK');
    expect(result.lineas[0]._netoBase).toBe(385000);
    expect(result.errors).toHaveLength(0);
  });

  it('expands a composition pack into children', () => {
    const lineas = [];
    const quotation = { paxGlobal: 80, ajustesManuales: [] };
    const event = { itemId: 'PACK_COFFEE_COMPLETO' };

    const result = addItem(lineas, quotation, event, store);

    expect(result.lineas).toHaveLength(3);
    expect(result.lineas.every(l => l._source === 'COMPOSITION')).toBe(true);
    expect(result.lineas.map(l => l.ID_Item)).toEqual([
      'ITEM_COFFEE_BASIC',
      'ITEM_COFFEE_INTER',
      'ITEM_COFFEE_FULL',
    ]);
  });

  it('applies overrides when adding item', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = {
      itemId: 'ITEM_CHINOOK',
      overrides: { Override_Duracion_Min: 600 },
    };

    const result = addItem(lineas, quotation, event, store);

    expect(result.lineas[0]._duracionMin).toBe(600);
  });

  it('pax-based item inherits global pax', () => {
    const lineas = [];
    const quotation = { paxGlobal: 50, ajustesManuales: [] };
    const event = { itemId: 'ITEM_COFFEE_BASIC' };

    const result = addItem(lineas, quotation, event, store);

    expect(result.lineas[0]._pax).toBe(50);
    expect(result.lineas[0]._netoBase).toBe(6380 * 50);
  });

  it('handles invalid item gracefully', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { itemId: 'ITEM_DOES_NOT_EXIST' };

    const result = addItem(lineas, quotation, event, store);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ruleId).toBe('ADD_ITEM_ERROR');
  });

  it('returns required response structure', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };
    const event = { itemId: 'ITEM_CHINOOK' };

    const result = addItem(lineas, quotation, event, store);

    expect(result).toHaveProperty('lineas');
    expect(result).toHaveProperty('quotation');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('errors');
    expect(result.totals).toHaveProperty('subtotal');
    expect(result.totals).toHaveProperty('taxes');
    expect(result.totals).toHaveProperty('total');
  });
});
