import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Kit } from '../../../src/containers/Kit.js';

const makeRow = (overrides = {}) => ({
  ID_Item: 'kit-001',
  Nombre: 'Desayuno Continental',
  Activo: true,
  ...overrides,
});

const makeLeafChild = (id, price, nombre = 'Item') => ({
  ID_Item: id,
  Nombre: nombre,
  _price: price,
  toDisplayObject: vi.fn().mockReturnValue({ id, nombre, price }),
});

describe('Kit', () => {
  let row;

  beforeEach(() => {
    row = makeRow();
  });

  // ── Construction ───────────────────────────────────────────────

  describe('construction', () => {
    it('maps ID_Item to ID_Kit', () => {
      const kit = new Kit(row);
      expect(kit.ID_Kit).toBe('kit-001');
    });

    it('maps Nombre from row', () => {
      const kit = new Kit(row);
      expect(kit.Nombre).toBe('Desayuno Continental');
    });

    it('maps Activo from row', () => {
      const kit = new Kit(row);
      expect(kit.Activo).toBe(true);
    });

    it('defaults Activo to true when row omits it', () => {
      const kit = new Kit({ ID_Item: 'k1', Nombre: 'Kit' });
      expect(kit.Activo).toBe(true);
    });

    it('respects Activo = false from row', () => {
      const kit = new Kit(makeRow({ Activo: false }));
      expect(kit.Activo).toBe(false);
    });

    it('defaults mode to catalog', () => {
      const kit = new Kit(row);
      expect(kit._mode).toBe('catalog');
    });

    it('accepts mode option at construction time', () => {
      const kit = new Kit(row, { mode: 'basket' });
      expect(kit._mode).toBe('basket');
    });

    it('defaults evaluator to null', () => {
      const kit = new Kit(row);
      expect(kit._evaluator).toBeNull();
    });

    it('accepts evaluator option', () => {
      const evaluator = vi.fn();
      const kit = new Kit(row, { evaluator });
      expect(kit._evaluator).toBe(evaluator);
    });

    it('starts with empty children', () => {
      const kit = new Kit(row);
      expect(kit.childCount).toBe(0);
    });
  });

  // ── Accessors ──────────────────────────────────────────────────

  describe('id and name getters', () => {
    it('id returns ID_Kit', () => {
      const kit = new Kit(row);
      expect(kit.id).toBe('kit-001');
    });

    it('name returns Nombre', () => {
      const kit = new Kit(row);
      expect(kit.name).toBe('Desayuno Continental');
    });
  });

  describe('mode getters', () => {
    it('isCatalogMode is true when mode is catalog', () => {
      const kit = new Kit(row, { mode: 'catalog' });
      expect(kit.isCatalogMode).toBe(true);
      expect(kit.isBasketMode).toBe(false);
    });

    it('isBasketMode is true when mode is basket', () => {
      const kit = new Kit(row, { mode: 'basket' });
      expect(kit.isBasketMode).toBe(true);
      expect(kit.isCatalogMode).toBe(false);
    });
  });

  // ── Mode switching ─────────────────────────────────────────────

  describe('switchToBasketMode()', () => {
    it('changes _mode to basket', () => {
      const kit = new Kit(row);
      kit.switchToBasketMode();
      expect(kit._mode).toBe('basket');
    });

    it('returns this for chaining', () => {
      const kit = new Kit(row);
      const result = kit.switchToBasketMode();
      expect(result).toBe(kit);
    });

    it('isCatalogMode becomes false after switching', () => {
      const kit = new Kit(row);
      kit.switchToBasketMode();
      expect(kit.isCatalogMode).toBe(false);
    });

    it('isBasketMode becomes true after switching', () => {
      const kit = new Kit(row);
      kit.switchToBasketMode();
      expect(kit.isBasketMode).toBe(true);
    });

    it('is idempotent when already in basket mode', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.switchToBasketMode();
      expect(kit._mode).toBe('basket');
    });
  });

  // ── aggregate() ────────────────────────────────────────────────

  describe('aggregate()', () => {
    it('returns null in catalog mode', () => {
      const kit = new Kit(row, { mode: 'catalog' });
      expect(kit.aggregate()).toBeNull();
    });

    it('returns null in catalog mode even with children', () => {
      const kit = new Kit(row, { mode: 'catalog' });
      kit.addChild('i1', makeLeafChild('i1', 100));
      expect(kit.aggregate()).toBeNull();
    });

    it('returns { subtotal, breakdown } in basket mode with no children', () => {
      const kit = new Kit(row, { mode: 'basket' });
      const result = kit.aggregate();
      expect(result).toEqual({ subtotal: 0, breakdown: [] });
    });

    it('sums child _price values in basket mode', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', makeLeafChild('i1', 100, 'Pan'));
      kit.addChild('i2', makeLeafChild('i2', 250, 'Jugo'));

      const result = kit.aggregate();
      expect(result.subtotal).toBe(350);
    });

    it('breakdown has one entry per child in basket mode', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', makeLeafChild('i1', 100, 'Pan'));
      kit.addChild('i2', makeLeafChild('i2', 200, 'Jugo'));

      const result = kit.aggregate();
      expect(result.breakdown).toHaveLength(2);
    });

    it('breakdown entries contain id, nombre, total', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', { ID_Item: 'i1', Nombre: 'Pan', _price: 100, toDisplayObject: vi.fn() });

      const result = kit.aggregate();
      expect(result.breakdown[0]).toEqual({ id: 'i1', nombre: 'Pan', total: 100 });
    });

    it('transitions from null to real total after switchToBasketMode()', () => {
      const kit = new Kit(row);
      kit.addChild('i1', makeLeafChild('i1', 150));
      expect(kit.aggregate()).toBeNull();

      kit.switchToBasketMode();
      const result = kit.aggregate();
      expect(result.subtotal).toBe(150);
    });
  });

  // ── Child management (inherited from ContainerBase) ────────────

  describe('child management', () => {
    it('addChild increases childCount', () => {
      const kit = new Kit(row);
      kit.addChild('i1', makeLeafChild('i1', 100));
      expect(kit.childCount).toBe(1);
    });

    it('removeChild decreases childCount', () => {
      const kit = new Kit(row);
      kit.addChild('i1', makeLeafChild('i1', 100));
      kit.addChild('i2', makeLeafChild('i2', 200));
      kit.removeChild('i1');
      expect(kit.childCount).toBe(1);
    });

    it('addChild returns this for chaining', () => {
      const kit = new Kit(row);
      const result = kit.addChild('i1', makeLeafChild('i1', 100));
      expect(result).toBe(kit);
    });

    it('removeChild returns this for chaining', () => {
      const kit = new Kit(row);
      kit.addChild('i1', makeLeafChild('i1', 100));
      const result = kit.removeChild('i1');
      expect(result).toBe(kit);
    });

    it('children() generator yields all children', () => {
      const kit = new Kit(row);
      const c1 = makeLeafChild('i1', 100);
      const c2 = makeLeafChild('i2', 200);
      kit.addChild('i1', c1);
      kit.addChild('i2', c2);

      const children = [...kit.children()];
      expect(children).toHaveLength(2);
      expect(children).toContain(c1);
      expect(children).toContain(c2);
    });
  });

  // ── toDisplayObject() ──────────────────────────────────────────

  describe('toDisplayObject()', () => {
    it('includes id, nombre, activo, mode, items, totals keys', () => {
      const kit = new Kit(row);
      const result = kit.toDisplayObject();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nombre');
      expect(result).toHaveProperty('activo');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totals');
    });

    it('maps id to ID_Kit', () => {
      const kit = new Kit(row);
      expect(kit.toDisplayObject().id).toBe('kit-001');
    });

    it('maps nombre to Nombre', () => {
      const kit = new Kit(row);
      expect(kit.toDisplayObject().nombre).toBe('Desayuno Continental');
    });

    it('maps activo to Activo', () => {
      const kit = new Kit(row);
      expect(kit.toDisplayObject().activo).toBe(true);
    });

    it('reflects current mode in output', () => {
      const kit = new Kit(row, { mode: 'catalog' });
      expect(kit.toDisplayObject().mode).toBe('catalog');
      kit.switchToBasketMode();
      expect(kit.toDisplayObject().mode).toBe('basket');
    });

    it('totals is null in catalog mode', () => {
      const kit = new Kit(row, { mode: 'catalog' });
      kit.addChild('i1', makeLeafChild('i1', 100));
      expect(kit.toDisplayObject().totals).toBeNull();
    });

    it('totals is real aggregate in basket mode', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', makeLeafChild('i1', 100));
      kit.addChild('i2', makeLeafChild('i2', 200));

      const result = kit.toDisplayObject();
      expect(result.totals.subtotal).toBe(300);
      expect(result.totals.breakdown).toHaveLength(2);
    });

    it('items contains toDisplayObject output for each child', () => {
      const kit = new Kit(row);
      const c1 = makeLeafChild('i1', 100, 'Pan');
      const c2 = makeLeafChild('i2', 200, 'Jugo');
      kit.addChild('i1', c1);
      kit.addChild('i2', c2);

      const result = kit.toDisplayObject();
      expect(result.items).toHaveLength(2);
      expect(c1.toDisplayObject).toHaveBeenCalled();
      expect(c2.toDisplayObject).toHaveBeenCalled();
    });

    it('items is empty when kit has no children', () => {
      const kit = new Kit(row);
      expect(kit.toDisplayObject().items).toEqual([]);
    });

    it('skips children without toDisplayObject', () => {
      const kit = new Kit(row);
      kit.addChild('i1', { ID_Item: 'i1', _price: 100 }); // no toDisplayObject
      kit.addChild('i2', makeLeafChild('i2', 200, 'Jugo'));

      const result = kit.toDisplayObject();
      expect(result.items).toHaveLength(1);
    });
  });

  // ── receiveContext() (from Rulable mixin) ──────────────────────

  describe('receiveContext()', () => {
    it('stores the received context in _inheritedContext', () => {
      const kit = new Kit(row);
      kit.receiveContext({ pax: 50, duracion: 8 });
      expect(kit._inheritedContext).toEqual({ pax: 50, duracion: 8 });
    });

    it('merges successive receiveContext calls', () => {
      const kit = new Kit(row);
      kit.receiveContext({ pax: 50 });
      kit.receiveContext({ duracion: 8 });
      expect(kit._inheritedContext).toEqual({ pax: 50, duracion: 8 });
    });

    it('returns this for chaining', () => {
      const kit = new Kit(row);
      const result = kit.receiveContext({ pax: 50 });
      expect(result).toBe(kit);
    });

    it('later receiveContext values override earlier ones for the same key', () => {
      const kit = new Kit(row);
      kit.receiveContext({ pax: 50 });
      kit.receiveContext({ pax: 100 });
      expect(kit._inheritedContext.pax).toBe(100);
    });
  });

  // ── Construction with mode: 'basket' at creation time ─────────

  describe('basket mode at construction time', () => {
    it('isCatalogMode is false', () => {
      const kit = new Kit(row, { mode: 'basket' });
      expect(kit.isCatalogMode).toBe(false);
    });

    it('isBasketMode is true', () => {
      const kit = new Kit(row, { mode: 'basket' });
      expect(kit.isBasketMode).toBe(true);
    });

    it('aggregate() returns real totals immediately', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', makeLeafChild('i1', 75));
      expect(kit.aggregate().subtotal).toBe(75);
    });

    it('toDisplayObject().totals is non-null', () => {
      const kit = new Kit(row, { mode: 'basket' });
      kit.addChild('i1', makeLeafChild('i1', 75));
      expect(kit.toDisplayObject().totals).not.toBeNull();
    });
  });
});
