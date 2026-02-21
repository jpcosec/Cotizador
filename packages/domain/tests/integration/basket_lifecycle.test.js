/**
 * Integration: full Basket lifecycle — add → update → remove → totals → snapshot → save.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Catalog } from '../../src/containers/Catalog.js';
import { Basket } from '../../src/containers/Basket.js';
import { createPricingTestStore } from '../helpers/store_factory.js';
import { TableInMemoryStore as InMemoryStore } from '../../../database/src/stores/TableInMemoryStore.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSetup({ paxGlobal = 10 } = {}) {
  const store = createPricingTestStore();
  const catalog = new Catalog();
  catalog.load(store);

  const basket = new Basket(
    { ID_Cotizacion: 'COT_001', ID_Cliente: 'CLI_TEST', Fecha_Evento: '2026-06-01', Duracion_Dias: 1, paxGlobal },
    catalog,
    { rules: catalog.getBasketRules() }
  );

  return { store, catalog, basket };
}

// ── Add ──────────────────────────────────────────────────────────────────────

describe('Integration: Basket add', () => {
  it('adds a salon item with correct fixed price', () => {
    const { basket } = makeSetup();
    const [item] = basket.add('ITEM_CHINOOK');
    // PP_SALON_BASE: Costo_Base_Fijo = 385000
    expect(item.total).toBe(385000);
  });

  it('adds a pax-based item with correct calculated price', () => {
    const { basket } = makeSetup({ paxGlobal: 20 });
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    // PP_CAFE_BASE: 20 × 6380 = 127600
    expect(item.total).toBe(127600);
  });

  it('adds items on separate days', () => {
    const { basket } = makeSetup();
    basket.add('ITEM_CHINOOK',     { Dia: 1 });
    basket.add('ITEM_COFFEE_BASIC', { Dia: 2 });
    expect(basket.childCount).toBe(2);
  });

  it('multiple items on same day go into same DayCategory', () => {
    const { basket } = makeSetup();
    basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    expect(basket.childCount).toBe(1);
    expect(basket.getChild(1).childCount).toBe(2);
  });

  it('adds kit and returns one item per child', () => {
    const { basket } = makeSetup();
    const items = basket.add('PACK_COFFEE_COMPLETO');
    expect(items).toHaveLength(2);
    expect(items.every(i => i.inBasket)).toBe(true);
  });
});

// ── Update ───────────────────────────────────────────────────────────────────

describe('Integration: Basket update', () => {
  it('update pax recalculates price correctly', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    const [coffee] = basket.add('ITEM_COFFEE_BASIC');
    basket.update(coffee.ID_Linea, { pax: 5 });
    // 5 × 6380 = 31900
    expect(coffee.total).toBe(31900);
  });

  it('updated pax is marked as user-set', () => {
    const { basket } = makeSetup();
    const [coffee] = basket.add('ITEM_COFFEE_BASIC');
    basket.update(coffee.ID_Linea, { pax: 15 });
    expect(coffee.paxIsUserSet).toBe(true);
  });

  it('updates Hora without changing price', () => {
    const { basket } = makeSetup();
    const [item] = basket.add('ITEM_CHINOOK');
    const priceBefore = item.total;
    basket.update(item.ID_Linea, { Hora: '15:00' });
    expect(item.Hora).toBe('15:00');
    expect(item.total).toBe(priceBefore);
  });

  it('update returns null for unknown lineId', () => {
    const { basket } = makeSetup();
    expect(basket.update('GHOST', { pax: 5 })).toBeNull();
  });
});

// ── Remove ───────────────────────────────────────────────────────────────────

describe('Integration: Basket remove', () => {
  it('removes item from basket', () => {
    const { basket } = makeSetup();
    const [item] = basket.add('ITEM_CHINOOK');
    basket.remove(item.ID_Linea);
    expect(basket.childCount).toBe(0);
  });

  it('totals drop to 0 after all items removed', () => {
    const { basket } = makeSetup();
    const [item] = basket.add('ITEM_CHINOOK');
    basket.remove(item.ID_Linea);
    expect(basket.totals.subtotal).toBe(0);
  });

  it('removes only the specified item when multiple exist', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    const [chinook] = basket.add('ITEM_CHINOOK');         // 385000
    basket.add('ITEM_COFFEE_BASIC');                      // 63800
    basket.remove(chinook.ID_Linea);
    expect(basket.totals.subtotal).toBe(63800);
  });

  it('remove is a no-op for unknown lineId', () => {
    const { basket } = makeSetup();
    basket.add('ITEM_CHINOOK');
    basket.remove('NONEXISTENT');
    expect(basket.childCount).toBe(1);
  });
});

// ── Totals ───────────────────────────────────────────────────────────────────

describe('Integration: Basket totals', () => {
  it('subtotal sums all items correctly', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');           // 385000 (fixed)
    basket.add('ITEM_COFFEE_BASIC');     // 10 × 6380 = 63800
    basket.add('ITEM_ALMUERZO');         // 10 × 27311 = 273110
    expect(basket.totals.subtotal).toBe(385000 + 63800 + 273110);
  });

  it('total equals subtotal when no tax rules', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    const { subtotal, total } = basket.totals;
    expect(total).toBe(subtotal);
  });

  it('totals update after item is removed', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    const [coffee] = basket.add('ITEM_COFFEE_BASIC');  // 63800
    basket.remove(coffee.ID_Linea);
    expect(basket.totals.subtotal).toBe(385000);
  });

  it('totals update after pax change', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_COFFEE_BASIC');   // initially 10 × 6380 = 63800
    basket.reprice(20);                // now 20 × 6380 = 127600
    expect(basket.totals.subtotal).toBe(127600);
  });
});

// ── toSnapshot() ─────────────────────────────────────────────────────────────

describe('Integration: Basket toSnapshot()', () => {
  it('snapshot lineas has one entry per basket item', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    expect(basket.toSnapshot().lineas).toHaveLength(2);
  });

  it('snapshot cotizacion matches header', () => {
    const { basket } = makeSetup();
    const snap = basket.toSnapshot();
    expect(snap.cotizacion.ID_Cotizacion).toBe('COT_001');
    expect(snap.cotizacion.ID_Cliente).toBe('CLI_TEST');
  });

  it('snapshot totals.subtotal matches basket.totals.subtotal', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    const snap = basket.toSnapshot();
    expect(snap.totals.subtotal).toBe(basket.totals.subtotal);
  });

  it('kit items appear as flat lineas in snapshot', () => {
    const { basket } = makeSetup();
    basket.add('PACK_COFFEE_COMPLETO');  // 2 kit children
    expect(basket.toSnapshot().lineas).toHaveLength(2);
  });
});

// ── save() ───────────────────────────────────────────────────────────────────

describe('Integration: Basket save()', () => {
  it('inserts a COTIZACIONES row', () => {
    const { basket } = makeSetup();
    basket.add('ITEM_CHINOOK');
    const saveStore = new InMemoryStore();
    saveStore.seed('COTIZACIONES', []);
    saveStore.seed('LINEA_DETALLE', []);
    saveStore.seed('CACHE_COTIZACION', []);
    basket.save(saveStore);
    expect(saveStore.all('COTIZACIONES')).toHaveLength(1);
  });

  it('inserts one LINEA_DETALLE row per basket item', () => {
    const { basket } = makeSetup({ paxGlobal: 10 });
    basket.add('ITEM_CHINOOK');
    basket.add('ITEM_COFFEE_BASIC');
    const saveStore = new InMemoryStore();
    saveStore.seed('COTIZACIONES', []);
    saveStore.seed('LINEA_DETALLE', []);
    saveStore.seed('CACHE_COTIZACION', []);
    basket.save(saveStore);
    expect(saveStore.all('LINEA_DETALLE')).toHaveLength(2);
  });

  it('inserts a CACHE_COTIZACION row with JSON snapshot', () => {
    const { basket } = makeSetup();
    basket.add('ITEM_CHINOOK');
    const saveStore = new InMemoryStore();
    saveStore.seed('COTIZACIONES', []);
    saveStore.seed('LINEA_DETALLE', []);
    saveStore.seed('CACHE_COTIZACION', []);
    basket.save(saveStore);
    const cache = saveStore.all('CACHE_COTIZACION');
    expect(cache).toHaveLength(1);
    expect(typeof cache[0].Snapshot_JSON).toBe('string');
    const parsed = JSON.parse(cache[0].Snapshot_JSON);
    expect(parsed).toHaveProperty('cotizacion');
    expect(parsed).toHaveProperty('lineas');
  });
});
