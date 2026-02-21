import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Category } from '../../../src/containers/Category.js';

const makeRow = (overrides = {}) => ({
  ID_Categoria: 'CAT-01',
  Nombre_Categoria: 'Bebidas',
  Activo: true,
  ...overrides,
});

const makeItem = (overrides = {}) => ({
  id: 'item-1',
  toDisplayObject: vi.fn().mockReturnValue({ id: 'item-1', nombre: 'Agua' }),
  receiveContext: vi.fn(),
  ...overrides,
});

describe('Category', () => {
  let category;

  beforeEach(() => {
    category = new Category(makeRow());
  });

  // ── 1. Construction ────────────────────────────────────────────

  describe('construction', () => {
    it('maps ID_Categoria from DB row', () => {
      expect(category.ID_Categoria).toBe('CAT-01');
    });

    it('maps Nombre from Nombre_Categoria field', () => {
      expect(category.Nombre).toBe('Bebidas');
    });

    it('maps Activo from DB row', () => {
      expect(category.Activo).toBe(true);
    });

    it('defaults Activo to true when not provided', () => {
      const cat = new Category({ ID_Categoria: 'X', Nombre_Categoria: 'Y' });
      expect(cat.Activo).toBe(true);
    });

    it('stores injected evaluator', () => {
      const evaluator = vi.fn();
      const cat = new Category(makeRow(), { evaluator });
      expect(cat._evaluator).toBe(evaluator);
    });

    it('defaults _evaluator to null when not provided', () => {
      expect(category._evaluator).toBeNull();
    });

    it('starts with an empty _children Map', () => {
      expect(category._children).toBeInstanceOf(Map);
      expect(category._children.size).toBe(0);
    });
  });

  // ── 2. Getters ─────────────────────────────────────────────────

  describe('id getter', () => {
    it('returns ID_Categoria', () => {
      expect(category.id).toBe('CAT-01');
    });
  });

  describe('name getter', () => {
    it('returns Nombre', () => {
      expect(category.name).toBe('Bebidas');
    });
  });

  // ── 3. Child management (inherited) ───────────────────────────

  describe('addChild', () => {
    it('increases childCount', () => {
      category.addChild('item-1', makeItem());
      expect(category.childCount).toBe(1);
    });

    it('increases childCount for each unique child', () => {
      category.addChild('item-1', makeItem({ id: 'item-1' }));
      category.addChild('item-2', makeItem({ id: 'item-2' }));
      expect(category.childCount).toBe(2);
    });
  });

  describe('removeChild', () => {
    it('decreases childCount', () => {
      category.addChild('item-1', makeItem());
      category.addChild('item-2', makeItem({ id: 'item-2' }));
      category.removeChild('item-1');
      expect(category.childCount).toBe(1);
    });

    it('does not affect count when removing nonexistent id', () => {
      category.addChild('item-1', makeItem());
      category.removeChild('nonexistent');
      expect(category.childCount).toBe(1);
    });
  });

  describe('getChild', () => {
    it('returns the child by id', () => {
      const item = makeItem();
      category.addChild('item-1', item);
      expect(category.getChild('item-1')).toBe(item);
    });

    it('returns null when child is not found', () => {
      expect(category.getChild('missing')).toBeNull();
    });
  });

  // ── 4. toDisplayObject shape ───────────────────────────────────

  describe('toDisplayObject', () => {
    it('returns correct shape for an empty category', () => {
      const result = category.toDisplayObject();
      expect(result).toEqual({
        id: 'CAT-01',
        nombre: 'Bebidas',
        activo: true,
        items: [],
        count: 0,
      });
    });

    it('items array contains toDisplayObject result of each child', () => {
      const item = makeItem();
      category.addChild('item-1', item);

      const result = category.toDisplayObject();

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ id: 'item-1', nombre: 'Agua' });
    });

    it('calls toDisplayObject on every child', () => {
      const item1 = makeItem({ id: 'item-1' });
      const item2 = makeItem({
        id: 'item-2',
        toDisplayObject: vi.fn().mockReturnValue({ id: 'item-2', nombre: 'Vino' }),
      });
      category.addChild('item-1', item1);
      category.addChild('item-2', item2);

      category.toDisplayObject();

      expect(item1.toDisplayObject).toHaveBeenCalled();
      expect(item2.toDisplayObject).toHaveBeenCalled();
    });

    it('count reflects number of children', () => {
      category.addChild('item-1', makeItem());
      category.addChild('item-2', makeItem({ id: 'item-2' }));

      const result = category.toDisplayObject();

      expect(result.count).toBe(2);
    });

    it('skips children that do not implement toDisplayObject', () => {
      category.addChild('good', makeItem());
      category.addChild('bad', { id: 'bad' }); // no toDisplayObject

      const result = category.toDisplayObject();

      expect(result.items).toHaveLength(1);
    });
  });

  // ── 5. Activo: false ───────────────────────────────────────────

  describe('inactive category', () => {
    it('has activo: false in display object', () => {
      const inactive = new Category(makeRow({ Activo: false }));
      const result = inactive.toDisplayObject();
      expect(result.activo).toBe(false);
    });
  });

  // ── 6. receiveContext (Rulable mixin) ──────────────────────────

  describe('receiveContext', () => {
    it('stores the received context in _inheritedContext', () => {
      category.receiveContext({ pax: 100, eventType: 'wedding' });
      expect(category._inheritedContext).toEqual({ pax: 100, eventType: 'wedding' });
    });

    it('merges multiple receiveContext calls', () => {
      category.receiveContext({ pax: 100 });
      category.receiveContext({ eventType: 'wedding' });
      expect(category._inheritedContext).toMatchObject({ pax: 100, eventType: 'wedding' });
    });

    it('returns this for chaining', () => {
      const result = category.receiveContext({ pax: 50 });
      expect(result).toBe(category);
    });
  });
});
