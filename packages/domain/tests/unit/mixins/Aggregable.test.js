import { describe, it, expect, beforeEach } from 'vitest';
import { Aggregable } from '../../../src/mixins/Aggregable.js';

describe('Aggregable Mixin', () => {
  let Base;
  let Container;

  beforeEach(() => {
    // Base class with _children Map
    Base = class {
      constructor() {
        this._children = new Map();
      }
    };

    // Container class that uses Aggregable mixin
    Container = class extends Aggregable(Base) {};
  });

  it('returns { subtotal: 0, breakdown: [] } when _children is empty', () => {
    const container = new Container();
    const result = container.aggregate();

    expect(result).toEqual({ subtotal: 0, breakdown: [] });
  });

  it('includes single leaf child with _price in subtotal', () => {
    const container = new Container();
    const leaf = { _price: 100, id: 'item1', nombre: 'Item 1' };
    container._children.set('item1', leaf);

    const result = container.aggregate();

    expect(result.subtotal).toBe(100);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0]).toEqual({
      id: 'item1',
      nombre: 'Item 1',
      total: 100,
    });
  });

  it('sums multiple leaf children correctly', () => {
    const container = new Container();
    container._children.set('item1', { _price: 100, id: 'item1', nombre: 'Item 1' });
    container._children.set('item2', { _price: 250, id: 'item2', nombre: 'Item 2' });
    container._children.set('item3', { _price: 50, id: 'item3', nombre: 'Item 3' });

    const result = container.aggregate();

    expect(result.subtotal).toBe(400);
    expect(result.breakdown).toHaveLength(3);
  });

  it('treats child with _price = null as 0', () => {
    const container = new Container();
    container._children.set('item1', { _price: null, id: 'item1', nombre: 'Item 1' });
    container._children.set('item2', { _price: 100, id: 'item2', nombre: 'Item 2' });

    const result = container.aggregate();

    expect(result.subtotal).toBe(100);
    expect(result.breakdown[0].total).toBe(0);
    expect(result.breakdown[1].total).toBe(100);
  });

  it('recurses into child with aggregate() function (nested container)', () => {
    const container = new Container();
    const nestedContainer = new Container();

    // Add leaves to nested container
    nestedContainer._children.set('nested1', { _price: 50, id: 'nested1', nombre: 'Nested 1' });
    nestedContainer._children.set('nested2', { _price: 75, id: 'nested2', nombre: 'Nested 2' });

    // Add nested container to parent
    container._children.set('group1', nestedContainer);

    const result = container.aggregate();

    expect(result.subtotal).toBe(125);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].total).toBe(125);
  });

  it('includes id and total in breakdown entries', () => {
    const container = new Container();
    container._children.set('item1', { _price: 200, id: 'item1', nombre: 'Test Item' });

    const result = container.aggregate();
    const entry = result.breakdown[0];

    expect(entry).toHaveProperty('id', 'item1');
    expect(entry).toHaveProperty('total', 200);
    expect(entry).toHaveProperty('nombre', 'Test Item');
  });

  it('handles ID_Linea property as fallback for id', () => {
    const container = new Container();
    container._children.set('line1', { _price: 150, ID_Linea: 'line1', Nombre: 'Line Item' });

    const result = container.aggregate();
    const entry = result.breakdown[0];

    expect(entry.id).toBe('line1');
    expect(entry.nombre).toBe('Line Item');
  });

  it('handles ID_Item property as fallback for id', () => {
    const container = new Container();
    container._children.set('item1', { _price: 100, ID_Item: 'item1', Nombre: 'Named Item' });

    const result = container.aggregate();
    const entry = result.breakdown[0];

    expect(entry.id).toBe('item1');
  });

  it('mixes containers and leaf children correctly', () => {
    const container = new Container();
    const nestedContainer = new Container();

    // Add leaves to nested container
    nestedContainer._children.set('nested1', { _price: 30, id: 'nested1', nombre: 'Nested 1' });
    nestedContainer._children.set('nested2', { _price: 20, id: 'nested2', nombre: 'Nested 2' });

    // Add nested container and leaf to parent
    container._children.set('group1', nestedContainer);
    container._children.set('leaf1', { _price: 100, id: 'leaf1', nombre: 'Leaf 1' });

    const result = container.aggregate();

    expect(result.subtotal).toBe(150); // 50 from nested, 100 from leaf
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0].total).toBe(50);
    expect(result.breakdown[1].total).toBe(100);
  });

  it('breakdown length matches number of direct children', () => {
    const container = new Container();
    container._children.set('item1', { _price: 100, id: 'item1', nombre: 'Item 1' });
    container._children.set('item2', { _price: 200, id: 'item2', nombre: 'Item 2' });
    container._children.set('item3', { _price: 300, id: 'item3', nombre: 'Item 3' });
    container._children.set('item4', { _price: 400, id: 'item4', nombre: 'Item 4' });

    const result = container.aggregate();

    expect(result.breakdown).toHaveLength(4);
  });

  it('handles children with undefined _price as 0', () => {
    const container = new Container();
    container._children.set('item1', { id: 'item1', nombre: 'No Price' });
    container._children.set('item2', { _price: 50, id: 'item2', nombre: 'With Price' });

    const result = container.aggregate();

    expect(result.subtotal).toBe(50);
    expect(result.breakdown[0].total).toBe(0);
    expect(result.breakdown[1].total).toBe(50);
  });

  it('handles children with null id as null in breakdown', () => {
    const container = new Container();
    container._children.set('unknown', { _price: 100 }); // no id property

    const result = container.aggregate();
    const entry = result.breakdown[0];

    expect(entry.id).toBeNull();
    expect(entry.total).toBe(100);
  });

  it('handles deeply nested containers (3+ levels)', () => {
    const level3 = new Container();
    level3._children.set('l3', { _price: 10, id: 'l3', nombre: 'Level 3' });

    const level2 = new Container();
    level2._children.set('level3', level3);

    const level1 = new Container();
    level1._children.set('level2', level2);

    const result = level1.aggregate();

    expect(result.subtotal).toBe(10);
    expect(result.breakdown[0].total).toBe(10);
  });
});
