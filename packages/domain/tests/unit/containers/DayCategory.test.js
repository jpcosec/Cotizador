import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DayCategory } from '../../../src/containers/DayCategory.js';

const makeItem = (overrides = {}) => ({
  ID_Linea: 'LIN-01',
  Nombre: 'Test Item',
  _price: 1000,
  toDisplayObject: vi.fn().mockReturnValue({ nombre: 'Test Item', precio: 1000 }),
  receiveContext: vi.fn(),
  ...overrides,
});

describe('DayCategory', () => {
  let day;

  beforeEach(() => {
    day = new DayCategory(1);
  });

  // ── 1. Construction ────────────────────────────────────────────

  describe('construction', () => {
    it('sets dia correctly', () => {
      expect(day.dia).toBe(1);
    });

    it('stores injected evaluator', () => {
      const evaluator = vi.fn();
      const d = new DayCategory(2, { evaluator });
      expect(d._evaluator).toBe(evaluator);
    });

    it('defaults _evaluator to null when not provided', () => {
      expect(day._evaluator).toBeNull();
    });

    it('starts with an empty _children Map', () => {
      expect(day._children).toBeInstanceOf(Map);
      expect(day._children.size).toBe(0);
    });
  });

  // ── 2. Getters ─────────────────────────────────────────────────

  describe('id getter', () => {
    it('returns dia', () => {
      expect(day.id).toBe(1);
    });

    it('reflects the day number passed at construction', () => {
      const d3 = new DayCategory(3);
      expect(d3.id).toBe(3);
    });
  });

  describe('name getter', () => {
    it('returns "Día N" for day 1', () => {
      expect(day.name).toBe('Día 1');
    });

    it('returns "Día N" for day 5', () => {
      expect(new DayCategory(5).name).toBe('Día 5');
    });
  });

  // ── 3. Child management (inherited from ContainerBase) ─────────

  describe('addChild', () => {
    it('increases childCount', () => {
      day.addChild('LIN-01', makeItem());
      expect(day.childCount).toBe(1);
    });

    it('increases childCount for each unique child', () => {
      day.addChild('LIN-01', makeItem({ ID_Linea: 'LIN-01' }));
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02' }));
      expect(day.childCount).toBe(2);
    });
  });

  describe('removeChild', () => {
    it('decreases childCount', () => {
      day.addChild('LIN-01', makeItem());
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02' }));
      day.removeChild('LIN-01');
      expect(day.childCount).toBe(1);
    });

    it('does not affect count when removing nonexistent id', () => {
      day.addChild('LIN-01', makeItem());
      day.removeChild('nonexistent');
      expect(day.childCount).toBe(1);
    });
  });

  // ── 4. aggregate() — empty container ──────────────────────────

  describe('aggregate() on empty DayCategory', () => {
    it('returns subtotal of 0', () => {
      expect(day.aggregate().subtotal).toBe(0);
    });

    it('returns an empty breakdown array', () => {
      expect(day.aggregate().breakdown).toEqual([]);
    });
  });

  // ── 5. aggregate() — correct values ───────────────────────────

  describe('aggregate() with children', () => {
    it('sums _price from a single item', () => {
      day.addChild('LIN-01', makeItem({ _price: 1500 }));
      expect(day.aggregate().subtotal).toBe(1500);
    });

    it('sums _price from multiple items', () => {
      day.addChild('LIN-01', makeItem({ _price: 1000 }));
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02', Nombre: 'Item B', _price: 2500 }));
      expect(day.aggregate().subtotal).toBe(3500);
    });

    it('includes one breakdown entry per child', () => {
      day.addChild('LIN-01', makeItem({ _price: 800 }));
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02', _price: 200 }));
      expect(day.aggregate().breakdown).toHaveLength(2);
    });

    it('breakdown entry contains id, nombre, and total', () => {
      day.addChild('LIN-01', makeItem({ ID_Linea: 'LIN-01', Nombre: 'Agua', _price: 500 }));
      const { breakdown } = day.aggregate();
      expect(breakdown[0]).toMatchObject({ id: 'LIN-01', nombre: 'Agua', total: 500 });
    });

    it('treats missing _price as 0', () => {
      day.addChild('LIN-01', makeItem({ _price: undefined }));
      expect(day.aggregate().subtotal).toBe(0);
    });
  });

  // ── 6. toDisplayObject() shape ─────────────────────────────────

  describe('toDisplayObject()', () => {
    it('returns correct shape for an empty DayCategory', () => {
      const result = day.toDisplayObject();
      expect(result).toEqual({
        dia: 1,
        items: [],
        totals: { subtotal: 0, breakdown: [] },
      });
    });

    it('contains dia from constructor', () => {
      const d4 = new DayCategory(4);
      expect(d4.toDisplayObject().dia).toBe(4);
    });

    it('items array contains toDisplayObject result of each child', () => {
      const item = makeItem();
      day.addChild('LIN-01', item);
      const result = day.toDisplayObject();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ nombre: 'Test Item', precio: 1000 });
    });

    it('totals.subtotal equals sum of child prices', () => {
      day.addChild('LIN-01', makeItem({ _price: 3000 }));
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02', _price: 7000 }));
      expect(day.toDisplayObject().totals.subtotal).toBe(10000);
    });

    it('totals.breakdown has an entry per child', () => {
      day.addChild('LIN-01', makeItem({ _price: 100 }));
      day.addChild('LIN-02', makeItem({ ID_Linea: 'LIN-02', _price: 200 }));
      expect(day.toDisplayObject().totals.breakdown).toHaveLength(2);
    });
  });

  // ── 7. toDisplayObject() calls toDisplayObject on children ─────

  describe('toDisplayObject() delegates to children', () => {
    it('calls toDisplayObject on every child', () => {
      const item1 = makeItem({ ID_Linea: 'LIN-01' });
      const item2 = makeItem({
        ID_Linea: 'LIN-02',
        toDisplayObject: vi.fn().mockReturnValue({ nombre: 'Item B', precio: 500 }),
      });
      day.addChild('LIN-01', item1);
      day.addChild('LIN-02', item2);

      day.toDisplayObject();

      expect(item1.toDisplayObject).toHaveBeenCalled();
      expect(item2.toDisplayObject).toHaveBeenCalled();
    });

    it('skips children that do not implement toDisplayObject', () => {
      day.addChild('good', makeItem());
      day.addChild('bad', { ID_Linea: 'bad', _price: 999 }); // no toDisplayObject

      const result = day.toDisplayObject();

      expect(result.items).toHaveLength(1);
    });
  });

  // ── 8. pushContextToChildren() ────────────────────────────────

  describe('pushContextToChildren()', () => {
    it('calls receiveContext() on each child', () => {
      const item1 = makeItem({ ID_Linea: 'LIN-01' });
      const item2 = makeItem({ ID_Linea: 'LIN-02' });
      day.addChild('LIN-01', item1);
      day.addChild('LIN-02', item2);

      day.receiveContext({ pax: 50 });
      day.pushContextToChildren();

      expect(item1.receiveContext).toHaveBeenCalledWith(expect.objectContaining({ pax: 50 }));
      expect(item2.receiveContext).toHaveBeenCalledWith(expect.objectContaining({ pax: 50 }));
    });

    it('returns this for chaining', () => {
      const result = day.pushContextToChildren();
      expect(result).toBe(day);
    });

    it('does not throw when a child has no receiveContext', () => {
      day.addChild('bare', { ID_Linea: 'bare', _price: 0 });
      expect(() => day.pushContextToChildren()).not.toThrow();
    });
  });

  // ── 9. receiveContext (Rulable mixin) ──────────────────────────

  describe('receiveContext()', () => {
    it('stores context in _inheritedContext', () => {
      day.receiveContext({ pax: 80 });
      expect(day._inheritedContext).toMatchObject({ pax: 80 });
    });

    it('merges multiple receiveContext calls', () => {
      day.receiveContext({ pax: 80 });
      day.receiveContext({ duracion: 6 });
      expect(day._inheritedContext).toMatchObject({ pax: 80, duracion: 6 });
    });

    it('returns this for chaining', () => {
      expect(day.receiveContext({ pax: 10 })).toBe(day);
    });
  });
});
