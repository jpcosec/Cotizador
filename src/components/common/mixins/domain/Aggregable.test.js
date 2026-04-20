import { describe, expect, it } from 'vitest';
import { Aggregable } from './Aggregable.js';

describe('Aggregable', () => {
  it('adds and retrieves children by id', () => {
    const AggregableClass = Aggregable(class {});
    const target = new AggregableClass();
    const child = { id: 'child-1', total: 50 };

    const result = target.addChild('child-1', child);

    expect(result).toBe(target);
    expect(target.getChild('child-1')).toBe(child);
  });

  it('removes children by id', () => {
    const AggregableClass = Aggregable(class {});
    const target = new AggregableClass();

    target.addChild('child-1', { total: 50 }).removeChild('child-1');

    expect(target.getChild('child-1')).toBeUndefined();
  });

  it('aggregates leaf and nested child totals', () => {
    const AggregableClass = Aggregable(class {});
    const target = new AggregableClass();

    const nested = {
      ID_Linea: 'nested',
      Nombre: 'Nested',
      aggregate() {
        return { subtotal: 70, breakdown: [] };
      }
    };

    target
      .addChild('leaf', { ID_Item: 'leaf', nombre: 'Leaf', total: 30 })
      .addChild('nested', nested);

    const result = target.aggregate();

    expect(result.subtotal).toBe(100);
    expect(result.breakdown).toEqual([
      { id: 'leaf', nombre: 'Leaf', total: 30 },
      { id: 'nested', nombre: 'Nested', total: 70 }
    ]);
    expect(target.subtotal).toBe(100);
  });
});
