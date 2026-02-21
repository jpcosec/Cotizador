/**
 * Integration: Catalog loads from a real store and resolves profiles + rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Catalog } from '../../src/containers/Catalog.js';
import { Item } from '../../src/items/Item.js';
import { Kit } from '../../src/containers/Kit.js';
import { createPricingTestStore, createStoreWithRules } from '../helpers/store_factory.js';

function loadFrom(store) {
  const catalog = new Catalog();
  catalog.load(store);
  return catalog;
}

describe('Integration: Catalog loads from store', () => {
  let catalog;

  beforeEach(() => {
    catalog = loadFrom(createPricingTestStore());
  });

  // ── Structure ─────────────────────────────────────────────────────────────

  it('has 3 categories', () => {
    expect(catalog.childCount).toBe(3);
  });

  it('getItem resolves all expected items', () => {
    expect(catalog.getItem('ITEM_CHINOOK')).toBeInstanceOf(Item);
    expect(catalog.getItem('ITEM_COFFEE_BASIC')).toBeInstanceOf(Item);
    expect(catalog.getItem('ITEM_ALMUERZO')).toBeInstanceOf(Item);
  });

  it('PACK_COFFEE_COMPLETO loads as a Kit', () => {
    expect(catalog.getItem('PACK_COFFEE_COMPLETO')).toBeInstanceOf(Kit);
  });

  it('kit child items are accessible via catalog.getItem', () => {
    expect(catalog.getItem('ITEM_COFFEE_BASIC')).toBeInstanceOf(Item);
    expect(catalog.getItem('ITEM_ALMUERZO')).toBeInstanceOf(Item);
  });

  // ── Profile resolution ────────────────────────────────────────────────────

  it('all regular items have a non-null profile', () => {
    for (const id of ['ITEM_CHINOOK', 'ITEM_COFFEE_BASIC', 'ITEM_ALMUERZO']) {
      expect(catalog.getItem(id)._profile).not.toBeNull();
    }
  });

  it('ITEM_CHINOOK uses PP_SALON_BASE (explicit override)', () => {
    expect(catalog.getItem('ITEM_CHINOOK')._profile.ID_Perfil_Precio).toBe('PP_SALON_BASE');
  });

  it('ITEM_COFFEE_BASIC uses PP_CAFE_BASE (category default fallback)', () => {
    expect(catalog.getItem('ITEM_COFFEE_BASIC')._profile.ID_Perfil_Precio).toBe('PP_CAFE_BASE');
  });

  it('ITEM_ALMUERZO uses PP_ALMUERZO_BASE (explicit override)', () => {
    expect(catalog.getItem('ITEM_ALMUERZO')._profile.ID_Perfil_Precio).toBe('PP_ALMUERZO_BASE');
  });

  // ── Kit children resolve profiles ─────────────────────────────────────────

  it('kit child ITEM_COFFEE_BASIC has a profile', () => {
    const kit = catalog.getItem('PACK_COFFEE_COMPLETO');
    const child = kit.getChild('ITEM_COFFEE_BASIC');
    expect(child._profile).not.toBeNull();
  });

  // ── Rule distribution ─────────────────────────────────────────────────────

  it('no item-level rules when store has no REGLAS_NEGOCIO', () => {
    for (const id of ['ITEM_CHINOOK', 'ITEM_COFFEE_BASIC', 'ITEM_ALMUERZO']) {
      expect(catalog.getItem(id)._rules).toHaveLength(0);
    }
  });

  it('basket-level rules (IMPUESTO) go to catalog._rules', () => {
    const catalogWithRules = loadFrom(createStoreWithRules());
    // createStoreWithRules adds IVA (IMPUESTO) and OVERTIME (AJUSTE_LINEA)
    // IMPUESTO → catalog._rules (basket level)
    const basketRules = catalogWithRules.getBasketRules();
    expect(basketRules.some(r => r.Etapa === 'IMPUESTO')).toBe(true);
  });

  it('item-level rules (AJUSTE_LINEA) are assigned to all items', () => {
    const catalogWithRules = loadFrom(createStoreWithRules());
    const chinook = catalogWithRules.getItem('ITEM_CHINOOK');
    // OVERTIME rule (AJUSTE_LINEA) should be on the item
    expect(chinook._rules.some(r => r.Etapa === 'AJUSTE_LINEA')).toBe(true);
  });

  // ── Reload ────────────────────────────────────────────────────────────────

  it('reload() produces the same structure as a fresh load', () => {
    const store = createPricingTestStore();
    const fresh = loadFrom(store);
    const reloaded = loadFrom(store);
    reloaded.reload(store);

    expect(reloaded.childCount).toBe(fresh.childCount);
    expect(reloaded.getItem('ITEM_CHINOOK')).not.toBeNull();
  });

  // ── toDisplayObject() shape ───────────────────────────────────────────────

  it('toDisplayObject returns all 3 categories', () => {
    const display = catalog.toDisplayObject();
    expect(display.categories).toHaveLength(3);
  });

  it('toDisplayObject itemCount is positive', () => {
    const display = catalog.toDisplayObject();
    expect(display.itemCount).toBeGreaterThan(0);
  });
});
