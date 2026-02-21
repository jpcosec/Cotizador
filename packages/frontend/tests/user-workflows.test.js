/**
 * User-Like Workflow Tests - Simplified Domain Model Tests
 *
 * NOTE: XState machine workflow tests are in packages/xstate/tests/
 * These tests focus on domain model behavior that's relevant for UI development.
 *
 * Comprehensive UI flow integration tests are in integration-fixes.test.js (10 tests, all passing)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Catalog } from '../../domain/src/containers/Catalog.js';
import { Basket } from '../../domain/src/containers/Basket.js';
import { createPricingTestStore } from '../../domain/tests/helpers/store_factory.js';

// ═══════════════════════════════════════════════════════════════════════════
// Domain Model Tests - Verify UI-Relevant Behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Catalog Display - UI Rendering', () => {
  let catalog;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());
  });

  it('returns catalog display object with categories and items with prices', () => {
    const display = catalog.toDisplayObject();
    expect(display.categories).toBeDefined();
    expect(display.categories.length).toBeGreaterThan(0);

    let itemCount = 0;
    for (const cat of display.categories) {
      for (const item of cat.items) {
        // Kits don't have precio (they're containers)
        if (item.items) {
          for (const child of item.items) {
            expect(child.precio).toBeDefined();
            expect(typeof child.precio).toBe('number');
            itemCount++;
          }
        } else {
          expect(item.precio).toBeDefined();
          expect(typeof item.precio).toBe('number');
          itemCount++;
        }
      }
    }
    expect(itemCount).toBeGreaterThan(0);
  });

  it('sidebar can read item IDs from display object', () => {
    const display = catalog.toDisplayObject();
    for (const cat of display.categories) {
      for (const item of cat.items) {
        // Items have itemId, Kits have id
        expect(item.itemId || item.id).toBeDefined();
        expect(item.nombre).toBeDefined();
      }
    }
  });
});

describe('Basket Operations - User Interactions', () => {
  let catalog;
  let basket;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-TEST',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 3,
      paxGlobal: 50
    };
    basket = new Basket(quotation, catalog, { evaluator: null });
  });

  it('adds item from catalog to basket with correct price', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });

    const display = basket.toDisplayObject();
    expect(display.days.length).toBeGreaterThan(0);
    expect(display.days[0].items.length).toBeGreaterThan(0);
    expect(display.days[0].items[0].precio).toBeGreaterThan(0);
  });

  it('updates item quantity and recalculates total', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });

    const display1 = basket.toDisplayObject();
    const initialTotal = display1.totals.subtotal;

    const lineId = display1.days[0]?.items[0]?.lineId;
    if (lineId) {
      basket.update(lineId, { pax: 100 });
    }

    const display2 = basket.toDisplayObject();
    const updatedTotal = display2.totals.subtotal;

    expect(updatedTotal).toBeGreaterThan(initialTotal);
  });

  it('removes item from basket', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });

    const display1 = basket.toDisplayObject();
    const lineId = display1.days[0]?.items[0]?.lineId;
    const itemCountBefore = display1.days[0]?.items?.length || 0;

    if (lineId) {
      basket.remove(lineId);
    }

    const display2 = basket.toDisplayObject();
    const itemCountAfter = display2.days[0]?.items?.length || 0;

    expect(itemCountAfter).toBeLessThan(itemCountBefore);
  });

  it('handles multi-day event with items on different days', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });
    basket.add('ITEM_CHINOOK', { Dia: 2, Hora: '09:00', pax: 50 });
    basket.add('ITEM_COFFEE_BASIC', { Dia: 3, Hora: '14:00', pax: 50 });

    const display = basket.toDisplayObject();
    expect(display.days.length).toBe(3);
    expect(display.totals.subtotal).toBeGreaterThan(0);
  });
});

describe('Kit Item Handling', () => {
  let catalog;
  let basket;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-KIT',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 1,
      paxGlobal: 50
    };
    basket = new Basket(quotation, catalog, { evaluator: null });
  });

  it('adds kit and expands to child items', () => {
    basket.add('PACK_COFFEE_COMPLETO', { Dia: 1, Hora: '10:00', pax: 50 });

    const display = basket.toDisplayObject();
    // Kit should expand to its child items
    expect(display.days.length).toBeGreaterThan(0);
    expect(display.days[0].items.length).toBeGreaterThan(0);
    expect(display.totals.subtotal).toBeGreaterThan(0);
  });

  it('validates kit parent cost is zero', () => {
    // This validation happens in Catalog.load()
    // If kit parent cost is non-zero, load() would throw
    expect(() => {
      catalog.load(createPricingTestStore());
    }).not.toThrow();
  });
});

describe('Totals Calculation - UI Display', () => {
  let catalog;
  let basket;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-TOTAL',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 2,
      paxGlobal: 50
    };
    basket = new Basket(quotation, catalog, { evaluator: null });
  });

  it('provides accurate subtotal and total for display', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });
    basket.add('ITEM_CHINOOK', { Dia: 2, Hora: '09:00', pax: 50 });

    const totals = basket.totals;
    expect(totals.subtotal).toBeGreaterThan(0);
    expect(totals.total).toBeGreaterThanOrEqual(totals.subtotal);
    expect(typeof totals.subtotal).toBe('number');
    expect(typeof totals.total).toBe('number');
  });

  it('aggregates multiple items correctly', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '13:00', pax: 25 });

    const display = basket.toDisplayObject();
    expect(display.days[0].items.length).toBe(2);
    expect(display.totals.subtotal).toBeGreaterThan(0);
  });
});

describe('Display Objects - Alpine.js Integration', () => {
  let catalog;
  let basket;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-ALPINE',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 1,
      paxGlobal: 50
    };
    basket = new Basket(quotation, catalog, { evaluator: null });
  });

  it('catalog display provides all fields needed for sidebar', () => {
    const display = catalog.toDisplayObject();
    expect(display.categories).toBeDefined();
    expect(typeof display.itemCount).toBe('number');

    for (const cat of display.categories) {
      expect(cat.id).toBeDefined();
      expect(cat.nombre).toBeDefined();
      expect(Array.isArray(cat.items)).toBe(true);
    }
  });

  it('basket display provides all fields needed for cart view', () => {
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });

    const display = basket.toDisplayObject();
    expect(display.days).toBeDefined();
    expect(display.totals).toBeDefined();

    if (display.days.length > 0) {
      const day = display.days[0];
      expect(day.dia).toBeDefined();
      expect(Array.isArray(day.items)).toBe(true);

      if (day.items.length > 0) {
        const item = day.items[0];
        expect(item.itemId).toBeDefined();
        expect(item.nombre).toBeDefined();
        expect(typeof item.precio).toBe('number');
        expect(typeof item.total).toBe('number');
      }
    }
  });
});
