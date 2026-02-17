import { describe, it, expect } from 'vitest';
import { expandCompositions } from '../../../src/Pricing/expand.js';
import { createSeededStore } from '../../helpers/store_factory.js';

describe('Pricing/expand', () => {
  const store = createSeededStore();

  it('passes through non-composition items unchanged', () => {
    const linea = { ID_Linea: 'L1', ID_Item: 'ITEM_CHINOOK' };
    const result = expandCompositions([linea], store);
    expect(result).toHaveLength(1);
    expect(result[0].ID_Item).toBe('ITEM_CHINOOK');
  });

  it('expands pack into children with composition metadata', () => {
    const linea = { ID_Linea: 'L1', ID_Item: 'PACK_COFFEE_COMPLETO' };
    const result = expandCompositions([linea], store);
    expect(result).toHaveLength(3);
    expect(result.every(r => r._source === 'COMPOSITION')).toBe(true);
    expect(result.every(r => r._parentItem === 'PACK_COFFEE_COMPLETO')).toBe(true);
    expect(result.map(r => r.ID_Item)).toEqual([
      'ITEM_COFFEE_BASIC', 'ITEM_COFFEE_INTER', 'ITEM_COFFEE_FULL',
    ]);
  });
});
