import { describe, it, expect, beforeEach } from 'vitest';
import { Catalog } from '../../../src/containers/Catalog.js';
import { Category } from '../../../src/containers/Category.js';
import { Item } from '../../../src/items/Item.js';
import { Kit } from '../../../src/containers/Kit.js';
import { createPricingTestStore } from '../../helpers/store_factory.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadedCatalog() {
  const catalog = new Catalog();
  catalog.load(createPricingTestStore());
  return catalog;
}

// ── Construction ─────────────────────────────────────────────────────────────

describe('Catalog — construction', () => {
  it('starts with empty _children', () => {
    expect(new Catalog().childCount).toBe(0);
  });

  it('stores injected evaluator', () => {
    const evaluator = () => null;
    const cat = new Catalog({ evaluator });
    expect(cat._evaluator).toBe(evaluator);
  });

  it('defaults evaluator to null', () => {
    expect(new Catalog()._evaluator).toBeNull();
  });
});

// ── load() ───────────────────────────────────────────────────────────────────

describe('Catalog — load()', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadedCatalog();
  });

  it('creates one Category child per CATEGORIAS row', () => {
    // Store has 3 categories (CAT_SALON, CAT_CAFE, CAT_COMIDA)
    expect(catalog.childCount).toBe(3);
  });

  it('children are Category instances', () => {
    for (const child of catalog.children()) {
      expect(child).toBeInstanceOf(Category);
    }
  });

  it('returns this for chaining', () => {
    const cat = new Catalog();
    expect(cat.load(createPricingTestStore())).toBe(cat);
  });

  it('does not include kit child items as direct category children', () => {
    // ITEM_COFFEE_BASIC and ITEM_ALMUERZO are children of PACK_COFFEE_COMPLETO (kit)
    // They should NOT appear directly in the CAT_CAFE or CAT_COMIDA categories
    const cafeCat = catalog.getChild('CAT_CAFE');
    const childIds = [...cafeCat._children.keys()];
    expect(childIds).not.toContain('ITEM_COFFEE_BASIC');
    expect(childIds).not.toContain('ITEM_ALMUERZO');
  });
});

// ── Profile resolution ────────────────────────────────────────────────────────

describe('Catalog — profile resolution during load()', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadedCatalog();
  });

  it('resolves explicit profile override for ITEM_CHINOOK', () => {
    const item = catalog.getItem('ITEM_CHINOOK');
    expect(item._profile).not.toBeNull();
    expect(item._profile.ID_Perfil_Precio).toBe('PP_SALON_BASE');
  });

  it('resolves category default profile for ITEM_COFFEE_BASIC (no override)', () => {
    const item = catalog.getItem('ITEM_COFFEE_BASIC');
    // ITEM_COFFEE_BASIC has empty ID_Perfil_Precio_Override → falls back to CAT_CAFE default
    expect(item._profile).not.toBeNull();
    expect(item._profile.ID_Perfil_Precio).toBe('PP_CAFE_BASE');
  });

  it('resolves explicit profile for ITEM_ALMUERZO', () => {
    const item = catalog.getItem('ITEM_ALMUERZO');
    expect(item._profile).not.toBeNull();
    expect(item._profile.ID_Perfil_Precio).toBe('PP_ALMUERZO_BASE');
  });
});

// ── Kit detection ─────────────────────────────────────────────────────────────

describe('Catalog — kit detection during load()', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadedCatalog();
  });

  it('wraps kit parent items in a Kit container', () => {
    const cafeCat = catalog.getChild('CAT_CAFE');
    const pack = cafeCat.getChild('PACK_COFFEE_COMPLETO');
    expect(pack).toBeInstanceOf(Kit);
  });

  it('Kit is in catalog mode', () => {
    const cafeCat = catalog.getChild('CAT_CAFE');
    const pack = cafeCat.getChild('PACK_COFFEE_COMPLETO');
    expect(pack.isCatalogMode).toBe(true);
  });

  it('Kit contains the correct child items', () => {
    const cafeCat = catalog.getChild('CAT_CAFE');
    const pack = cafeCat.getChild('PACK_COFFEE_COMPLETO');
    expect(pack.childCount).toBe(2);
    expect(pack.getChild('ITEM_COFFEE_BASIC')).toBeInstanceOf(Item);
    expect(pack.getChild('ITEM_ALMUERZO')).toBeInstanceOf(Item);
  });
});

// ── Kit parent cost validation ─────────────────────────────────────────────────

describe('Catalog — kit parent cost validation', () => {
  it('allows load when kit parent has zero cost', () => {
    // Test store creates kits with zero cost
    const catalog = new Catalog();
    expect(() => {
      catalog.load(createPricingTestStore());
    }).not.toThrow();
  });

  it('throws error when kit parent has non-zero base cost', () => {
    const store = createPricingTestStore();
    // Manually corrupt the ITEM_CATALOGO to add cost to kit parent
    const items = store.all('ITEM_CATALOGO');
    const kitParent = items.find(i => i.ID_Item === 'PACK_COFFEE_COMPLETO');
    if (kitParent) {
      kitParent.Costo_Base = 10000; // Non-zero cost
    }

    const catalog = new Catalog();
    expect(() => {
      catalog.load(store);
    }).toThrow(/has non-zero costs/);
  });

  it('throws error when kit parent has non-zero pax cost', () => {
    const store = createPricingTestStore();
    const items = store.all('ITEM_CATALOGO');
    const kitParent = items.find(i => i.ID_Item === 'PACK_COFFEE_COMPLETO');
    if (kitParent) {
      kitParent.Costo_Unitario_Pax = 5000; // Non-zero pax cost
    }

    const catalog = new Catalog();
    expect(() => {
      catalog.load(store);
    }).toThrow(/has non-zero costs/);
  });

  it('includes helpful error message with kit parent name', () => {
    const store = createPricingTestStore();
    const items = store.all('ITEM_CATALOGO');
    const kitParent = items.find(i => i.ID_Item === 'PACK_COFFEE_COMPLETO');
    if (kitParent) {
      kitParent.Costo_Base = 50000;
    }

    const catalog = new Catalog();
    try {
      catalog.load(store);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e.message).toContain('PACK_COFFEE_COMPLETO');
      expect(e.message).toContain('zero cost');
      expect(e.message).toContain('child items');
    }
  });
});

// ── getItem() ─────────────────────────────────────────────────────────────────

describe('Catalog — getItem()', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadedCatalog();
  });

  it('returns an Item for a regular item ID', () => {
    expect(catalog.getItem('ITEM_CHINOOK')).toBeInstanceOf(Item);
  });

  it('returns a Kit for a kit parent ID', () => {
    expect(catalog.getItem('PACK_COFFEE_COMPLETO')).toBeInstanceOf(Kit);
  });

  it('returns an Item nested inside a kit', () => {
    expect(catalog.getItem('ITEM_COFFEE_BASIC')).toBeInstanceOf(Item);
  });

  it('returns null for an unknown ID', () => {
    expect(catalog.getItem('DOES_NOT_EXIST')).toBeNull();
  });
});

// ── reload() ─────────────────────────────────────────────────────────────────

describe('Catalog — reload()', () => {
  it('clears and reloads children', () => {
    const catalog = loadedCatalog();
    const countBefore = catalog.childCount;
    catalog.reload(createPricingTestStore());
    expect(catalog.childCount).toBe(countBefore);
  });

  it('returns this for chaining', () => {
    const catalog = loadedCatalog();
    expect(catalog.reload(createPricingTestStore())).toBe(catalog);
  });
});

// ── toDisplayObject() ─────────────────────────────────────────────────────────

describe('Catalog — toDisplayObject()', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadedCatalog();
  });

  it('returns categories array', () => {
    const display = catalog.toDisplayObject();
    expect(Array.isArray(display.categories)).toBe(true);
    expect(display.categories).toHaveLength(3);
  });

  it('returns itemCount', () => {
    const display = catalog.toDisplayObject();
    expect(typeof display.itemCount).toBe('number');
    expect(display.itemCount).toBeGreaterThan(0);
  });
});

// ── getBasketRules() ──────────────────────────────────────────────────────────

describe('Catalog — getBasketRules()', () => {
  it('returns empty array when no basket-level rules in store', () => {
    const catalog = loadedCatalog();
    expect(catalog.getBasketRules()).toEqual([]);
  });

  it('returns a copy so caller mutation does not affect catalog', () => {
    const catalog = loadedCatalog();
    const rules = catalog.getBasketRules();
    rules.push({ fake: true });
    expect(catalog.getBasketRules()).toHaveLength(0);
  });
});
