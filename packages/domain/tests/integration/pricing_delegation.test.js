/**
 * Integration: Item.calculate() produces correct prices using profile coefficients.
 *
 * Verifies pricing formula: price = Costo_Base_Fijo
 *                                  + pax      × Costo_Unitario_Pax
 *                                  + duracion × Costo_Unitario_Tiempo
 *                                  + cantidad × Costo_Unitario_Item
 */

import { describe, it, expect } from 'vitest';
import { Catalog } from '../../src/containers/Catalog.js';
import { Basket } from '../../src/containers/Basket.js';
import { createPricingTestStore } from '../helpers/store_factory.js';

function makeSetup(paxGlobal = 10) {
  const store = createPricingTestStore();
  const catalog = new Catalog();
  catalog.load(store);

  const basket = new Basket(
    { ID_Cotizacion: 'COT_P', ID_Cliente: 'CLI_TEST', Fecha_Evento: '2026-06-01', Duracion_Dias: 1, paxGlobal },
    catalog
  );

  return { catalog, basket };
}

// ── Fixed-price item (salon) ──────────────────────────────────────────────────
// PP_SALON_BASE: Costo_Base_Fijo = 385000, all unit costs = 0

describe('Pricing delegation: fixed-price item (ITEM_CHINOOK)', () => {
  it('produces 385000 regardless of pax', () => {
    const { basket } = makeSetup(10);
    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.total).toBe(385000);
  });

  it('price is the same at 1 pax', () => {
    const { basket } = makeSetup(1);
    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.total).toBe(385000);
  });

  it('price is the same at 100 pax', () => {
    const { basket } = makeSetup(100);
    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.total).toBe(385000);
  });

  it('displayPrice rounds to Costo_Base_Fijo / pax', () => {
    const { basket } = makeSetup(10);
    const [item] = basket.add('ITEM_CHINOOK');
    // total = 385000, pax = null (no pax default, no context pax since paxIsUserSet=false)
    // pax resolves from context (10), so displayPrice = 385000 / 10 = 38500
    expect(item.displayPrice).toBe(38500);
  });
});

// ── Pax-based item (coffee) ───────────────────────────────────────────────────
// PP_CAFE_BASE: Costo_Base_Fijo = 0, Costo_Unitario_Pax = 6380

describe('Pricing delegation: pax-based item (ITEM_COFFEE_BASIC)', () => {
  it('total = pax × 6380 at pax=10', () => {
    const { basket } = makeSetup(10);
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    expect(item.total).toBe(10 * 6380);
  });

  it('total = pax × 6380 at pax=20', () => {
    const { basket } = makeSetup(20);
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    expect(item.total).toBe(20 * 6380);
  });

  it('user override pax=5 gives 5 × 6380', () => {
    const { basket } = makeSetup(30);  // paxGlobal=30 but override=5
    const [item] = basket.add('ITEM_COFFEE_BASIC', { pax: 5 });
    expect(item.total).toBe(5 * 6380);
  });

  it('displayPrice = 6380 (price per person)', () => {
    const { basket } = makeSetup(10);
    const [item] = basket.add('ITEM_COFFEE_BASIC');
    expect(item.displayPrice).toBe(6380);
  });
});

// ── Pax-based item (almuerzo) ─────────────────────────────────────────────────
// PP_ALMUERZO_BASE: Costo_Base_Fijo = 0, Costo_Unitario_Pax = 27311

describe('Pricing delegation: pax-based item (ITEM_ALMUERZO)', () => {
  it('total = pax × 27311 at pax=10', () => {
    const { basket } = makeSetup(10);
    const [item] = basket.add('ITEM_ALMUERZO');
    expect(item.total).toBe(10 * 27311);
  });

  it('total = pax × 27311 at pax=50', () => {
    const { basket } = makeSetup(50);
    const [item] = basket.add('ITEM_ALMUERZO');
    expect(item.total).toBe(50 * 27311);
  });
});

// ── Injected pricingFn takes precedence ───────────────────────────────────────

describe('Pricing delegation: external pricingFn injection', () => {
  it('injected pricingFn overrides built-in formula', () => {
    const store = createPricingTestStore();
    const catalog = new Catalog();
    catalog.load(store);

    // Re-wrap the catalog item with a custom pricingFn
    const chinook = catalog.getItem('ITEM_CHINOOK');
    chinook._pricingFn = (_profile, pax) => pax * 999;

    const basket = new Basket(
      { ID_Cotizacion: 'COT_P', paxGlobal: 7 },
      catalog
    );

    const [item] = basket.add('ITEM_CHINOOK');
    expect(item.total).toBe(7 * 999);
  });
});

// ── Basket subtotal consistency ───────────────────────────────────────────────

describe('Pricing delegation: basket subtotal consistency', () => {
  it('basket subtotal equals sum of individual item totals', () => {
    const { basket } = makeSetup(10);
    const [chinook] = basket.add('ITEM_CHINOOK');          // 385000
    const [coffee]  = basket.add('ITEM_COFFEE_BASIC');    // 63800
    const [almuzo]  = basket.add('ITEM_ALMUERZO');        // 273110

    const expected = chinook.total + coffee.total + almuzo.total;
    expect(basket.totals.subtotal).toBe(expected);
  });

  it('subtotal changes correctly after pax update', () => {
    const { basket } = makeSetup(10);
    basket.add('ITEM_CHINOOK');               // 385000 (fixed, unchanged)
    const [coffee] = basket.add('ITEM_COFFEE_BASIC');  // 63800

    basket.update(coffee.ID_Linea, { pax: 5 });  // now 31900

    expect(basket.totals.subtotal).toBe(385000 + 31900);
  });

  it('after remove, subtotal recalculates from remaining items', () => {
    const { basket } = makeSetup(10);
    const [chinook] = basket.add('ITEM_CHINOOK');    // 385000
    basket.add('ITEM_COFFEE_BASIC');                 // 63800
    basket.remove(chinook.ID_Linea);

    expect(basket.totals.subtotal).toBe(63800);
  });
});
