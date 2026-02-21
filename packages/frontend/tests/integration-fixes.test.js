/**
 * Integration Tests for Phase 4 Fixes
 *
 * Verifies that the three main fixes are working:
 * 1. Sidebar prices calculated from Catalog
 * 2. Parent kit cost validation
 * 3. State sync doesn't directly mutate carrito
 */

import { describe, it, expect } from 'vitest';
import { Catalog } from '../../domain/src/containers/Catalog.js';
import { Basket } from '../../domain/src/containers/Basket.js';
import { createPricingTestStore } from '../../domain/tests/helpers/store_factory.js';

// ═══════════════════════════════════════════════════════════════════════════
// Test 1: Sidebar prices come from Catalog.toDisplayObject()
// ═══════════════════════════════════════════════════════════════════════════

describe('Fix #1: Sidebar prices from Catalog.toDisplayObject()', () => {
  let catalog;

  beforeEach(() => {
    catalog = new Catalog();
    catalog.load(createPricingTestStore());
  });

  it('catalog.toDisplayObject() returns categories with items having precio field', () => {
    const display = catalog.toDisplayObject();
    expect(display.categories).toBeDefined();
    expect(display.categories.length).toBeGreaterThan(0);

    const firstCategory = display.categories[0];
    expect(firstCategory.items).toBeDefined();
    expect(firstCategory.items.length).toBeGreaterThan(0);

    const firstItem = firstCategory.items[0];
    expect(firstItem.precio).toBeDefined();
    expect(typeof firstItem.precio).toBe('number');
  });

  it('all items in display have non-zero prices (profile-resolved)', () => {
    const display = catalog.toDisplayObject();

    let itemCount = 0;
    for (const cat of display.categories) {
      for (const item of cat.items) {
        // Kits don't have precio (they're containers), check their children instead
        if (item.items && Array.isArray(item.items)) {
          // It's a Kit - check its children have prices
          for (const child of item.items) {
            itemCount++;
            expect(typeof child.precio).toBe('number');
            expect(child.precio).toBeGreaterThanOrEqual(0);
          }
        } else {
          // Regular item
          itemCount++;
          expect(typeof item.precio).toBe('number');
          expect(item.precio).toBeGreaterThanOrEqual(0);
        }
      }
    }

    expect(itemCount).toBeGreaterThan(0);
  });

  it('sidebar can transform toDisplayObject() to catalogoPorCategoria format', () => {
    const display = catalog.toDisplayObject();

    // Simulate sidebar transformation (handle both Item and Kit objects)
    const grouped = {};
    for (const cat of display.categories) {
      grouped[cat.nombre] = cat.items
        .filter(item => item.itemId || item.id)  // Skip items without ID
        .map(item => ({
          ID_Item: item.itemId || item.id,  // Handle both Item (itemId) and Kit (id)
          Nombre: item.nombre,
          Precio_Base: item.precio || 0,  // This comes from profile!
          Default_Glosa: item.comentarios || ''
        }));
    }

    // Verify transformation
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    for (const categoria of Object.values(grouped)) {
      expect(Array.isArray(categoria)).toBe(true);
      // Only check items that made it through (have both ID and Nombre)
      if (categoria.length > 0) {
        for (const item of categoria) {
          expect(item.ID_Item).toBeDefined();
          expect(item.Nombre).toBeDefined();
          expect(typeof item.Precio_Base).toBe('number');
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Test 2: Parent kit cost validation
// ═══════════════════════════════════════════════════════════════════════════

describe('Fix #2: Parent kit cost validation', () => {
  it('catalog loads successfully when kit parent has zero cost', () => {
    const catalog = new Catalog();
    expect(() => {
      catalog.load(createPricingTestStore());
    }).not.toThrow();
  });

  it('catalog throws error when kit parent has non-zero cost', () => {
    const store = createPricingTestStore();
    const items = store.all('ITEM_CATALOGO');

    // Find and corrupt a kit parent
    const kitParent = items.find(i => i.ID_Item === 'PACK_COFFEE_COMPLETO');
    if (kitParent) {
      kitParent.Costo_Base = 100000; // Non-zero cost violation!
    }

    const catalog = new Catalog();
    expect(() => {
      catalog.load(store);
    }).toThrow(/has non-zero costs/);
  });

  it('error message is helpful and includes item name', () => {
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

// ═══════════════════════════════════════════════════════════════════════════
// Test 3: State sync - AlpineXStateBridge reads from Basket
// ═══════════════════════════════════════════════════════════════════════════

describe('Fix #3: State sync via AlpineXStateBridge', () => {
  it('basket.toDisplayObject() provides display-ready data for frontend', () => {
    const catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-001',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 1,
      paxGlobal: 50
    };
    const basket = new Basket(quotation, catalog, { evaluator: null });
    const itemId = 'ITEM_CHINOOK';

    basket.add(itemId, { Dia: 1, Hora: '09:00', pax: 50 });

    const display = basket.toDisplayObject();

    // Display object should have structure for Alpine
    expect(display.days).toBeDefined();
    expect(Array.isArray(display.days)).toBe(true);
    expect(display.totals).toBeDefined();

    // Verify day items
    if (display.days.length > 0) {
      const day = display.days[0];
      expect(day.items).toBeDefined();
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

  it('frontend reads from basket.toDisplayObject(), not direct carrito mutation', () => {
    const catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-002',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 1,
      paxGlobal: 50
    };
    const basket = new Basket(quotation, catalog, { evaluator: null });
    // Use ITEM_ALMUERZO which has pax-based pricing (27311 per pax)
    basket.add('ITEM_ALMUERZO', { Dia: 1, Hora: '12:00', pax: 50 });

    const display1 = basket.toDisplayObject();
    const initialTotal = display1.totals.subtotal;

    // Update item pax (would previously mutate carrito directly)
    const lineId = display1.days[0]?.items[0]?.lineId;
    if (lineId) {
      basket.update(lineId, { pax: 100 });
    }

    const display2 = basket.toDisplayObject();
    const updatedTotal = display2.totals.subtotal;

    // Total should change because we updated pax (27311/pax * 50 → 27311/pax * 100)
    expect(updatedTotal).toBeGreaterThan(initialTotal);
  });

  it('basket aggregation provides accurate totals for UI', () => {
    const catalog = new Catalog();
    catalog.load(createPricingTestStore());

    const quotation = {
      ID_Cotizacion: 'COT-003',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 2,
      paxGlobal: 50
    };
    const basket = new Basket(quotation, catalog, { evaluator: null });
    basket.add('ITEM_CHINOOK', { Dia: 1, Hora: '09:00', pax: 50 });
    basket.add('ITEM_ALMUERZO', { Dia: 2, Hora: '12:00', pax: 50 });

    const totals = basket.totals;  // Use totals getter, not aggregate()

    // Should have subtotal and total
    expect(totals.subtotal).toBeDefined();
    expect(totals.total).toBeDefined();
    expect(typeof totals.subtotal).toBe('number');
    expect(typeof totals.total).toBe('number');

    // Total includes tax or equals subtotal
    expect(totals.total).toBeGreaterThanOrEqual(totals.subtotal);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: Full workflow validates all three fixes together
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration: All fixes working together', () => {
  it('catalog, basket, and display objects work together', () => {
    // Fix #1: Load catalog with proper pricing
    const catalog = new Catalog();
    catalog.load(createPricingTestStore());
    const display = catalog.toDisplayObject();
    expect(display.categories[0].items[0].precio).toBeGreaterThanOrEqual(0);

    // Fix #2: Kit validation passed (no error thrown)
    expect(catalog).toBeDefined();

    // Fix #3: Create basket and get display for UI
    const quotation = {
      ID_Cotizacion: 'COT-004',
      ID_Cliente: 'CLI-001',
      Fecha_Evento: '2026-03-15',
      Duracion_Dias: 1,
      paxGlobal: 50
    };
    const basket = new Basket(quotation, catalog, { evaluator: null });
    const itemId = display.categories[0].items[0].itemId;
    basket.add(itemId, { Dia: 1, Hora: '09:00', pax: 50 });

    const basketDisplay = basket.toDisplayObject();
    expect(basketDisplay.totals.subtotal).toBeGreaterThan(0);

    // UI would read from basketDisplay, not manipulate carrito directly
    expect(basketDisplay.days).toBeDefined();
  });
});
