import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Basket } from '../../../src/containers/Basket.js';
import { DayCategory } from '../../../src/containers/DayCategory.js';
import { Kit } from '../../../src/containers/Kit.js';
import { Catalog } from '../../../src/containers/Catalog.js';
import { createPricingTestStore } from '../../helpers/store_factory.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeHeader(overrides = {}) {
  return { ID_Cotizacion: 'COT_001', ID_Cliente: 'CLI_TEST', Fecha_Evento: '2026-06-01', Duracion_Dias: 1, paxGlobal: 30, ...overrides };
}

function loadedCatalog() {
  const catalog = new Catalog();
  catalog.load(createPricingTestStore());
  return catalog;
}

function makeBasket(headerOverrides = {}, opts = {}) {
  return new Basket(makeHeader(headerOverrides), loadedCatalog(), opts);
}

// ── Construction ─────────────────────────────────────────────────────────────

describe('Basket — construction', () => {
  it('starts empty', () => {
    expect(makeBasket().childCount).toBe(0);
  });

  it('sets pax from quotation.paxGlobal', () => {
    const basket = makeBasket({ paxGlobal: 50 });
    expect(basket._calculationParams.pax).toBe(50);
  });

  it('handles null paxGlobal gracefully', () => {
    const basket = makeBasket({ paxGlobal: null });
    expect(basket._calculationParams.pax).toBeUndefined();
  });

  it('stores injected basket-level rules', () => {
    const rules = [{ ID_Regla: 'R1', Etapa: 'IMPUESTO' }];
    const basket = makeBasket({}, { rules });
    expect(basket._rules).toBe(rules);
  });
});

// ── Line ID generation ────────────────────────────────────────────────────────

describe('Basket — _nextLineId()', () => {
  it('generates LIN_0001 on first call', () => {
    const basket = makeBasket();
    expect(basket._nextLineId()).toBe('LIN_0001');
  });

  it('increments on each call', () => {
    const basket = makeBasket();
    basket._nextLineId();
    expect(basket._nextLineId()).toBe('LIN_0002');
  });
});

// ── add() — regular item ──────────────────────────────────────────────────────

describe('Basket — add() regular item', () => {
  let basket;

  beforeEach(() => {
    basket = makeBasket();
  });

  it('returns an array with one Item', () => {
    const result = basket.add('ITEM_CHINOOK');
    expect(result).toHaveLength(1);
  });

  it('creates a DayCategory on first add', () => {
    basket.add('ITEM_CHINOOK');
    expect(basket.childCount).toBe(1);
    expect(basket.getChild(1)).toBeInstanceOf(DayCategory);
  });

  it('places item in the correct day', () => {
    basket.add('ITEM_CHINOOK', { Dia: 2 });
    const day2 = basket.getChild(2);
    expect(day2).toBeInstanceOf(DayCategory);
    expect(day2.childCount).toBe(1);
  });

  it('reuses existing DayCategory for same day', () => {
    basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    expect(basket.childCount).toBe(1);
    expect(basket.getChild(1).childCount).toBe(2);
  });

  it('creates separate DayCategories for different days', () => {
    basket.add('ITEM_CHINOOK', { Dia: 1 });
    basket.add('ITEM_COFFEE_BASIC', { Dia: 2 });
    expect(basket.childCount).toBe(2);
  });

  it('item has a unique ID_Linea', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.ID_Linea).toBe('LIN_0001');
  });

  it('sets Dia from overrides', () => {
    const [item] = basket.add('ITEM_CHINOOK', { Dia: 3 });
    expect(item.Dia).toBe(3);
  });

  it('sets Hora from overrides', () => {
    const [item] = basket.add('ITEM_CHINOOK', { Hora: '14:00' });
    expect(item.Hora).toBe('14:00');
  });

  it('throws for unknown itemId', () => {
    expect(() => basket.add('NONEXISTENT')).toThrow('Item not found in catalog: NONEXISTENT');
  });

  it('item is in basket state after add', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.inBasket).toBe(true);
  });

  it('item has calculated price after add', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    // Salón Chinook: PP_SALON_BASE, Costo_Base_Fijo = 385000
    expect(item.total).toBe(385000);
  });

  it('user pax override is respected', () => {
    const [item] = basket.add('ITEM_COFFEE_BASIC', { pax: 10 });
    // Café: 6380/pax × 10 pax = 63800
    expect(item.pax).toBe(10);
    expect(item.total).toBe(63800);
  });
});

// ── add() — kit item ──────────────────────────────────────────────────────────

describe('Basket — add() kit item', () => {
  let basket;

  beforeEach(() => {
    basket = makeBasket();
  });

  it('returns multiple items (one per kit child)', () => {
    const result = basket.add('PACK_COFFEE_COMPLETO');
    expect(result.length).toBeGreaterThan(1);
  });

  it('wraps kit children in a basket-mode Kit container', () => {
    basket.add('PACK_COFFEE_COMPLETO');
    const day1 = basket.getChild(1);
    const kit = day1.getChild('PACK_COFFEE_COMPLETO');
    expect(kit).toBeInstanceOf(Kit);
    expect(kit.isBasketMode).toBe(true);
  });

  it('each kit child has a unique ID_Linea', () => {
    const items = basket.add('PACK_COFFEE_COMPLETO');
    const lineIds = items.map(i => i.ID_Linea);
    expect(new Set(lineIds).size).toBe(items.length);
  });
});

// ── remove() ─────────────────────────────────────────────────────────────────

describe('Basket — remove()', () => {
  let basket;

  beforeEach(() => {
    basket = makeBasket();
  });

  it('removes a regular item from its DayCategory', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    basket.remove(item.ID_Linea);
    expect(basket.getChild(1)).toBeNull();
  });

  it('removes empty DayCategory after last item removed', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    basket.remove(item.ID_Linea);
    expect(basket.childCount).toBe(0);
  });

  it('does not remove DayCategory when other items remain', () => {
    const [item1] = basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    basket.remove(item1.ID_Linea);
    expect(basket.childCount).toBe(1);
    expect(basket.getChild(1).childCount).toBe(1);
  });

  it('is a no-op for unknown lineId', () => {
    basket.add('ITEM_CHINOOK');
    expect(() => basket.remove('DOES_NOT_EXIST')).not.toThrow();
    expect(basket.childCount).toBe(1);
  });

  it('removes a kit child item', () => {
    const items = basket.add('PACK_COFFEE_COMPLETO');
    const firstLineId = items[0].ID_Linea;
    basket.remove(firstLineId);
    const kit = basket.getChild(1).getChild('PACK_COFFEE_COMPLETO');
    expect(kit.getChild(firstLineId)).toBeNull();
  });
});

// ── update() ─────────────────────────────────────────────────────────────────

describe('Basket — update()', () => {
  let basket;

  beforeEach(() => {
    basket = makeBasket();
  });

  it('updates pax and marks it as user-set', () => {
    const [item] = basket.add('ITEM_COFFEE_BASIC', { pax: 20 });
    basket.update(item.ID_Linea, { pax: 40 });
    expect(item.pax).toBe(40);
    expect(item.paxIsUserSet).toBe(true);
  });

  it('recalculates price after pax update', () => {
    const [item] = basket.add('ITEM_COFFEE_BASIC', { pax: 20 });
    basket.update(item.ID_Linea, { pax: 5 });
    // 5 × 6380 = 31900
    expect(item.total).toBe(31900);
  });

  it('updates Hora without recalculating', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    basket.update(item.ID_Linea, { Hora: '16:00' });
    expect(item.Hora).toBe('16:00');
  });

  it('updates Comentarios', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    basket.update(item.ID_Linea, { Comentarios: 'mesa redonda' });
    expect(item.Comentarios).toBe('mesa redonda');
  });

  it('returns the updated item', () => {
    const [item] = basket.add('ITEM_CHINOOK');
    const returned = basket.update(item.ID_Linea, { Hora: '10:00' });
    expect(returned).toBe(item);
  });

  it('returns null for unknown lineId', () => {
    expect(basket.update('GHOST', { Hora: '10:00' })).toBeNull();
  });
});

// ── reprice() ────────────────────────────────────────────────────────────────

describe('Basket — reprice()', () => {
  it('updates pax on all items', () => {
    const basket = makeBasket({ paxGlobal: 10 });
    const [coffee] = basket.add('ITEM_COFFEE_BASIC');
    expect(coffee.total).toBe(63800);  // 10 × 6380

    basket.reprice(20);
    expect(coffee.total).toBe(127600);  // 20 × 6380
  });

  it('does not override user-set pax', () => {
    const basket = makeBasket({ paxGlobal: 10 });
    const [coffee] = basket.add('ITEM_COFFEE_BASIC', { pax: 5 });  // user override
    basket.reprice(100);
    expect(coffee.pax).toBe(5);  // preserved
  });
});

// ── totals ────────────────────────────────────────────────────────────────────

describe('Basket — totals', () => {
  it('subtotal is 0 for empty basket', () => {
    expect(makeBasket().totals.subtotal).toBe(0);
  });

  it('subtotal sums all item prices', () => {
    const basket = makeBasket({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');           // 385000
    basket.add('ITEM_COFFEE_BASIC');     // 10 × 6380 = 63800
    expect(basket.totals.subtotal).toBe(385000 + 63800);
  });

  it('total equals subtotal when no tax rules', () => {
    const basket = makeBasket({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    const { subtotal, total } = basket.totals;
    expect(total).toBe(subtotal);
  });

  it('taxes is empty array when no evaluator', () => {
    const basket = makeBasket();
    basket.add('ITEM_CHINOOK');
    expect(basket.totals.taxes).toEqual([]);
  });
});

// ── toSnapshot() ─────────────────────────────────────────────────────────────

describe('Basket — toSnapshot()', () => {
  it('snapshot has cotizacion, lineas, totals', () => {
    const basket = makeBasket();
    const snap = basket.toSnapshot();
    expect(snap).toHaveProperty('cotizacion');
    expect(snap).toHaveProperty('lineas');
    expect(snap).toHaveProperty('totals');
  });

  it('lineas contains one entry per basket item', () => {
    const basket = makeBasket({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    expect(basket.toSnapshot().lineas).toHaveLength(2);
  });

  it('each linea has ID_Linea and ID_Item', () => {
    const basket = makeBasket();
    basket.add('ITEM_CHINOOK');
    const [linea] = basket.toSnapshot().lineas;
    expect(linea).toHaveProperty('ID_Linea');
    expect(linea).toHaveProperty('ID_Item', 'ITEM_CHINOOK');
  });

  it('cotizacion matches the header passed to constructor', () => {
    const basket = makeBasket({ ID_Cotizacion: 'COT_XYZ' });
    expect(basket.toSnapshot().cotizacion.ID_Cotizacion).toBe('COT_XYZ');
  });
});

// ── toDisplayObject() ────────────────────────────────────────────────────────

describe('Basket — toDisplayObject()', () => {
  it('returns days array and totals', () => {
    const basket = makeBasket();
    const display = basket.toDisplayObject();
    expect(display).toHaveProperty('days');
    expect(display).toHaveProperty('totals');
  });

  it('days contains one entry per DayCategory', () => {
    const basket = makeBasket();
    basket.add('ITEM_CHINOOK', { Dia: 1 });
    basket.add('ITEM_COFFEE_BASIC', { Dia: 2 });
    expect(basket.toDisplayObject().days).toHaveLength(2);
  });
});
