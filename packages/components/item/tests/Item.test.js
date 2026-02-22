import { describe, it, expect, beforeEach } from 'vitest';
import { Item } from '../Item.js';
import { createDefaultItemSeed, defaultItemDefinition } from '../seeds.js';
import { PricingKind, InitializationMode } from '../domain/pricing.js';

describe('Item', () => {
  let defaultSeed;

  beforeEach(() => {
    defaultSeed = createDefaultItemSeed();
  });

  describe('Factory Methods', () => {
    describe('Item.fromDefinition()', () => {
      it('should create an Item from a definition with default options', () => {
        const item = Item.fromDefinition(defaultItemDefinition);
        expect(item).toBeDefined();
        expect(item.mode).toBe('catalog');
        expect(item.definition.name).toBe('Coffee Break Intermedio');
      });

      it('should accept externalContext in options', () => {
        const context = { paxGlobal: 100, duracionMin: 240 };
        const item = Item.fromDefinition(defaultItemDefinition, { externalContext: context });
        expect(item.externalContext.paxGlobal).toBe(100);
        expect(item.externalContext.duracionMin).toBe(240);
      });

      it('should accept overrides in options', () => {
        const overrides = { pax: 50, cantidad: 10 };
        const item = Item.fromDefinition(defaultItemDefinition, { overrides });
        expect(item.overrides.pax).toBe(50);
        expect(item.overrides.cantidad).toBe(10);
      });

      it('should default to catalog mode', () => {
        const item = Item.fromDefinition(defaultItemDefinition);
        expect(item.mode).toBe('catalog');
      });

      it('should start with empty externalContext and overrides if not provided', () => {
        const item = Item.fromDefinition(defaultItemDefinition);
        expect(item.externalContext).toEqual({});
        expect(item.overrides).toEqual({});
      });
    });

    describe('Item.fromSeed()', () => {
      it('should restore a complete seed', () => {
        const seed = createDefaultItemSeed();
        const item = Item.fromSeed(seed);
        expect(item.mode).toBe('catalog');
        expect(item.definition.name).toBe('Coffee Break Intermedio');
        expect(item.externalContext.paxGlobal).toBe(20);
      });

      it('should handle missing seed properties with defaults', () => {
        const item = Item.fromSeed({});
        expect(item.mode).toBe('catalog');
        // Definition gets initialized with empty pricingProfile, defaultQuantities, and rules
        expect(item.definition).toHaveProperty('pricingProfile');
        expect(item.definition).toHaveProperty('defaultQuantities');
        expect(item.definition).toHaveProperty('rules');
        expect(item.externalContext).toEqual({});
        expect(item.overrides).toEqual({});
      });

      it('should preserve userSetFields from seed', () => {
        const seed = {
          mode: 'basket',
          definition: defaultItemDefinition,
          externalContext: {},
          overrides: { cantidad: 10 },
          userSetFields: ['cantidad']
        };
        const item = Item.fromSeed(seed);
        expect(item.toDisplayObject().userSetFields).toContain('cantidad');
      });
    });

    describe('createDefaultItemSeed()', () => {
      it('should return a valid seed object', () => {
        const seed = createDefaultItemSeed();
        expect(seed).toHaveProperty('mode');
        expect(seed).toHaveProperty('definition');
        expect(seed).toHaveProperty('externalContext');
        expect(seed).toHaveProperty('overrides');
      });

      it('should have mode set to catalog', () => {
        const seed = createDefaultItemSeed();
        expect(seed.mode).toBe('catalog');
      });

      it('should have a definition with Coffee Break properties', () => {
        const seed = createDefaultItemSeed();
        expect(seed.definition.name).toBe('Coffee Break Intermedio');
        expect(seed.definition.pricingProfile.baseFijo).toBe(400);
        expect(seed.definition.pricingProfile.porUnidad).toBe(1);
      });

      it('should have externalContext with paxGlobal and duration', () => {
        const seed = createDefaultItemSeed();
        expect(seed.externalContext.paxGlobal).toBe(20);
        expect(seed.externalContext.duracionMin).toBe(120);
      });

      it('should have empty overrides initially', () => {
        const seed = createDefaultItemSeed();
        expect(seed.overrides).toEqual({});
      });
    });
  });

  describe('Mode Transitions', () => {
    it('should set mode to basket and recalculate', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.mode).toBe('catalog');
      item.setMode('basket');
      expect(item.mode).toBe('basket');
    });

    it('should set mode to catalog and recalculate', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setMode('basket');
      item.setMode('catalog');
      expect(item.mode).toBe('catalog');
    });

    it('should affect basketLine projection when switching to basket mode', () => {
      const item = Item.fromSeed(defaultSeed);
      const catalogLine = item.basketLine;
      expect(catalogLine.lineId).toBeNull();

      item.setMode('basket');
      const basketLine = item.basketLine;
      expect(basketLine.lineId).toBe('LIN_DEMO_001');
    });
  });

  describe('Pricing Calculations', () => {
    describe('UNITS kind (porUnidad)', () => {
      it('should calculate total = baseFijo + (quantity * porUnidad)', () => {
        // From defaultItemDefinition: baseFijo=400, porUnidad=1
        // From defaultSeed context: unidadesPorUsuario=3, paxGlobal=20
        // quantity = 20 * 3 = 60
        // total = 400 + (60 * 1) = 460
        const seed = createDefaultItemSeed();
        const item = Item.fromSeed(seed);

        expect(item.pricingKind).toBe(PricingKind.UNITS);
        expect(item.total).toBe(460);
      });

      it('should calculate correctly with 60 units at rate 1', () => {
        const seed = createDefaultItemSeed();
        const item = Item.fromSeed(seed);
        const display = item.toDisplayObject();

        expect(display.pricingKind).toBe(PricingKind.UNITS);
        expect(display.total).toBe(460);
        expect(display.quantities.cantidad).toBe(60);
      });
    });

    describe('PAX kind (porPersona)', () => {
      it('should calculate total = baseFijo + (pax * porPersona)', () => {
        // Create a definition with porPersona
        const definition = {
          ...defaultItemDefinition,
          pricingProfile: {
            baseFijo: 0,
            porPersona: 1000,
            porUnidad: 0,
            porMinuto: 0
          },
          defaultQuantities: {}
        };
        const seed = {
          mode: 'catalog',
          definition,
          externalContext: { paxGlobal: 20, duracionMin: 120, dia: 1, hora: '09:00' },
          overrides: {}
        };
        const item = Item.fromSeed(seed);

        expect(item.pricingKind).toBe(PricingKind.PAX);
        expect(item.total).toBe(20000);
      });

      it('should derive pax from externalContext when not overridden', () => {
        const definition = {
          ...defaultItemDefinition,
          pricingProfile: {
            baseFijo: 0,
            porPersona: 100,
            porUnidad: 0,
            porMinuto: 0
          },
          defaultQuantities: {}
        };
        const item = Item.fromSeed({
          mode: 'catalog',
          definition,
          externalContext: { paxGlobal: 50 },
          overrides: {}
        });

        expect(item.quantities.pax).toBe(50);
        expect(item.total).toBe(5000);
      });
    });

    describe('TIME kind (porMinuto)', () => {
      it('should calculate total = baseFijo + (duration * porMinuto)', () => {
        // 120 minutes at 5 per minute = 600
        const definition = {
          ...defaultItemDefinition,
          pricingProfile: {
            baseFijo: 0,
            porPersona: 0,
            porUnidad: 0,
            porMinuto: 5
          },
          defaultQuantities: {}
        };
        const item = Item.fromSeed({
          mode: 'catalog',
          definition,
          externalContext: { duracionMin: 120, paxGlobal: 20, dia: 1, hora: '09:00' },
          overrides: {}
        });

        expect(item.pricingKind).toBe(PricingKind.TIME);
        expect(item.total).toBe(600);
      });

      it('should use duracionMin from externalContext', () => {
        const definition = {
          ...defaultItemDefinition,
          pricingProfile: {
            baseFijo: 0,
            porPersona: 0,
            porUnidad: 0,
            porMinuto: 10
          },
          defaultQuantities: {}
        };
        const item = Item.fromSeed({
          mode: 'catalog',
          definition,
          externalContext: { duracionMin: 60 },
          overrides: {}
        });

        expect(item.quantities.duracionMin).toBe(60);
        expect(item.total).toBe(600);
      });
    });
  });

  describe('Context Propagation', () => {
    it('should update quantities when context changes', () => {
      const item = Item.fromSeed(defaultSeed);
      const initialTotal = item.total;

      item.receiveContext({ paxGlobal: 50 });
      const newTotal = item.total;

      expect(item.externalContext.paxGlobal).toBe(50);
      expect(newTotal).toBeGreaterThan(initialTotal);
    });

    it('should handle paxGlobal context update', () => {
      const item = Item.fromSeed(defaultSeed);
      // quantity = paxGlobal * unidadesPorUsuario = 50 * 3 = 150
      // total = 400 + (150 * 1) = 550
      item.receiveContext({ paxGlobal: 50 });

      expect(item.quantities.cantidad).toBe(150);
      expect(item.total).toBe(550);
    });

    it('should handle duracionMin context update', () => {
      const item = Item.fromSeed(defaultSeed);
      item.receiveContext({ duracionMin: 240 });

      expect(item.externalContext.duracionMin).toBe(240);
    });

    it('should merge context patches without overwriting existing values', () => {
      const item = Item.fromSeed(defaultSeed);
      item.receiveContext({ paxGlobal: 100 });
      item.receiveContext({ duracionMin: 300 });

      expect(item.externalContext.paxGlobal).toBe(100);
      expect(item.externalContext.duracionMin).toBe(300);
    });
  });

  describe('Override Precedence', () => {
    it('should apply override to pax and mark as overridden', () => {
      const definition = {
        ...defaultItemDefinition,
        pricingProfile: {
          baseFijo: 0,
          porPersona: 100,
          porUnidad: 0,
          porMinuto: 0
        },
        defaultQuantities: {}
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: { paxGlobal: 20 },
        overrides: {}
      });

      expect(item.quantities.pax).toBe(20);
      expect(item.isOverridden).toBe(false);

      item.setOverride('pax', 100);
      expect(item.quantities.pax).toBe(100);
      expect(item.isOverridden).toBe(true);
      expect(item.total).toBe(10000);
    });

    it('should apply override to cantidad (units)', () => {
      const item = Item.fromSeed(defaultSeed);
      const initialTotal = item.total;

      item.setOverride('cantidad', 100);
      const newTotal = item.total;

      expect(item.quantities.cantidad).toBe(100);
      expect(item.isOverridden).toBe(true);
      expect(newTotal).toBeGreaterThan(initialTotal);
    });

    it('should take precedence over context when both are present', () => {
      const definition = {
        ...defaultItemDefinition,
        pricingProfile: {
          baseFijo: 0,
          porPersona: 100,
          porUnidad: 0,
          porMinuto: 0
        },
        defaultQuantities: {}
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: { paxGlobal: 20 },
        overrides: {}
      });

      expect(item.quantities.pax).toBe(20);

      item.setOverride('pax', 100);
      expect(item.quantities.pax).toBe(100);

      item.receiveContext({ paxGlobal: 500 });
      // Override should still be 100, not 500
      expect(item.quantities.pax).toBe(100);
    });
  });

  describe('User-Set Tracking (NEW feature)', () => {
    it('should track quantity fields as user-set when overridden', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.toDisplayObject().isUserSetCantidad).toBe(false);

      item.setOverride('cantidad', 10);
      const display = item.toDisplayObject();
      expect(display.isUserSetCantidad).toBe(true);
      expect(display.userSetFields).toContain('cantidad');
    });

    it('should clear user-set flag when override is cleared', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 10);
      expect(item.toDisplayObject().isUserSetCantidad).toBe(true);

      item.clearOverride('cantidad');
      expect(item.toDisplayObject().isUserSetCantidad).toBe(false);
    });

    it('should track pax as user-set independently of cantidad', () => {
      const definition = {
        ...defaultItemDefinition,
        pricingProfile: {
          baseFijo: 0,
          porPersona: 100,
          porUnidad: 0,
          porMinuto: 0
        },
        defaultQuantities: {}
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: { paxGlobal: 20 },
        overrides: {}
      });

      item.setOverride('pax', 100);
      const display = item.toDisplayObject();
      expect(display.isUserSetPax).toBe(true);
      expect(display.isUserSetCantidad).toBe(false);
    });

    it('should track duracionMin as user-set independently', () => {
      const definition = {
        ...defaultItemDefinition,
        pricingProfile: {
          baseFijo: 0,
          porPersona: 0,
          porUnidad: 0,
          porMinuto: 5
        },
        defaultQuantities: {}
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: { duracionMin: 120 },
        overrides: {}
      });

      item.setOverride('duracionMin', 240);
      const display = item.toDisplayObject();
      expect(display.isUserSetDuracion).toBe(true);
      expect(display.isUserSetPax).toBe(false);
      expect(display.isUserSetCantidad).toBe(false);
    });

    it('should clear all user-set fields on resetOverrides()', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 10);
      item.setOverride('pax', 50);

      expect(item.toDisplayObject().isUserSetCantidad).toBe(true);

      item.resetOverrides();
      const display = item.toDisplayObject();
      expect(display.userSetFields).toEqual([]);
      expect(display.isUserSetCantidad).toBe(false);
      expect(display.isUserSetPax).toBe(false);
      expect(display.isUserSetDuracion).toBe(false);
    });

    it('should include userSetFields array in toDisplayObject()', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 10);

      const display = item.toDisplayObject();
      expect(Array.isArray(display.userSetFields)).toBe(true);
      expect(display.userSetFields).toContain('cantidad');
    });

    it('should persist userSetFields in toSeed()', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 10);

      const seed = item.toSeed();
      expect(seed.userSetFields).toContain('cantidad');
    });

    it('should not track non-quantity overrides as user-set', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('comentarios', 'Some comment');

      const display = item.toDisplayObject();
      expect(display.userSetFields).not.toContain('comentarios');
    });
  });

  describe('Profile Editing', () => {
    it('should update pricing profile field', () => {
      const item = Item.fromSeed(defaultSeed);
      const initialTotal = item.total;

      item.setProfileValue('porPersona', 500);
      const newTotal = item.total;

      expect(item.definition.pricingProfile.porPersona).toBe(500);
      // Kind changes to PAX, affecting total
      expect(item.pricingKind).toBe(PricingKind.PAX);
    });

    it('should convert string values to numbers', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setProfileValue('baseFijo', '500');

      expect(item.definition.pricingProfile.baseFijo).toBe(500);
      expect(typeof item.definition.pricingProfile.baseFijo).toBe('number');
    });

    it('should handle invalid values gracefully', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setProfileValue('porUnidad', 'invalid');

      expect(item.definition.pricingProfile.porUnidad).toBe(0);
    });

    it('should recalculate total when profile changes', () => {
      const item = Item.fromSeed(defaultSeed);
      const initial = item.total;

      item.setProfileValue('baseFijo', 1000);
      expect(item.total).toBeGreaterThan(initial);
    });
  });

  describe('Default Quantity Editing', () => {
    it('should update default quantity field', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setDefaultQuantity('unidadesPorUsuario', 5);

      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBe(5);
    });

    it('should enforce exclusive mode for cantidad', () => {
      const item = Item.fromSeed(defaultSeed);
      // Initial: unidadesPorUsuario = 3
      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBe(3);

      // Setting cantidad should clear unidadesPorUsuario
      item.setDefaultQuantity('cantidad', 10);
      expect(item.definition.defaultQuantities.cantidad).toBe(10);
      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBeUndefined();
    });

    it('should enforce exclusive mode for unidadesPorUsuario', () => {
      const definition = {
        ...defaultItemDefinition,
        defaultQuantities: { cantidad: 10 }
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: {},
        overrides: {}
      });

      item.setDefaultQuantity('unidadesPorUsuario', 3);
      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBe(3);
      expect(item.definition.defaultQuantities.cantidad).toBeUndefined();
    });

    it('should enforce exclusive mode for duracionMin', () => {
      const definition = {
        ...defaultItemDefinition,
        defaultQuantities: { minutosPorUsuario: 2 }
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: {},
        overrides: {}
      });

      item.setDefaultQuantity('duracionMin', 120);
      expect(item.definition.defaultQuantities.duracionMin).toBe(120);
      expect(item.definition.defaultQuantities.minutosPorUsuario).toBeUndefined();
    });

    it('should handle zero and negative values by removing the key', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setDefaultQuantity('unidadesPorUsuario', 0);

      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBeUndefined();
    });

    it('should clear default quantity field', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBe(3);

      item.clearDefaultQuantity('unidadesPorUsuario');
      expect(item.definition.defaultQuantities.unidadesPorUsuario).toBeUndefined();
    });
  });

  describe('Projections', () => {
    describe('catalogCard', () => {
      it('should include item name', () => {
        const item = Item.fromSeed(defaultSeed);
        const card = item.catalogCard;

        expect(card.Nombre).toBe('Coffee Break Intermedio');
      });

      it('should include pricing formula', () => {
        const item = Item.fromSeed(defaultSeed);
        const card = item.catalogCard;

        expect(card.Precio_Calculado_Default).toBeDefined();
        expect(card.Precio_Por_Cantidad).toBeDefined();
      });

      it('should include category', () => {
        const item = Item.fromSeed(defaultSeed);
        const card = item.catalogCard;

        expect(card.categoria).toBe('Coffee');
      });

      it('should include initialization policy hint', () => {
        const item = Item.fromSeed(defaultSeed);
        const card = item.catalogCard;

        expect(card.InitPolicyHuman).toBeDefined();
      });
    });

    describe('basketLine', () => {
      it('should have different id format in catalog vs basket mode', () => {
        const item = Item.fromSeed(defaultSeed);
        expect(item.basketLine.id).toBe('ITEM_DEMO');
        expect(item.basketLine.lineId).toBeNull();

        item.setMode('basket');
        expect(item.basketLine.id).toBe('LIN_DEMO_001');
        expect(item.basketLine.lineId).toBe('LIN_DEMO_001');
      });

      it('should include quantities', () => {
        const item = Item.fromSeed(defaultSeed);
        const line = item.basketLine;

        expect(line.pax).toBe(0);
        expect(line.cantidad).toBe(60);
        expect(line.duracionMin).toBe(0);
      });

      it('should include pricing information', () => {
        const item = Item.fromSeed(defaultSeed);
        const line = item.basketLine;

        expect(line.precio).toBeDefined();
        expect(line.baseFijo).toBe(400);
        expect(line.rateValue).toBe(1);
        expect(line.total).toBe(460);
      });

      it('should include schedule information', () => {
        const item = Item.fromSeed(defaultSeed);
        const line = item.basketLine;

        expect(line.dia).toBeDefined();
        expect(line.hora).toBeDefined();
      });

      it('should include availability status', () => {
        const item = Item.fromSeed(defaultSeed);
        const line = item.basketLine;

        expect(typeof line.available).toBe('boolean');
      });

      it('should include override status', () => {
        const item = Item.fromSeed(defaultSeed);
        expect(item.basketLine.isOverridden).toBe(false);

        item.setOverride('cantidad', 100);
        expect(item.basketLine.isOverridden).toBe(true);
      });
    });

    describe('toDisplayObject', () => {
      it('should include mode', () => {
        const item = Item.fromSeed(defaultSeed);
        const display = item.toDisplayObject();

        expect(display.mode).toBe('catalog');
      });

      it('should include definition', () => {
        const item = Item.fromSeed(defaultSeed);
        const display = item.toDisplayObject();

        expect(display.definition).toBeDefined();
        expect(display.definition.name).toBe('Coffee Break Intermedio');
      });

      it('should include both catalogCard and basketLine projections', () => {
        const item = Item.fromSeed(defaultSeed);
        const display = item.toDisplayObject();

        expect(display.catalogCard).toBeDefined();
        expect(display.basketLine).toBeDefined();
      });

      it('should include all computed fields', () => {
        const item = Item.fromSeed(defaultSeed);
        const display = item.toDisplayObject();

        expect(display.pricingKind).toBeDefined();
        expect(display.total).toBe(460);
        expect(display.quantities).toBeDefined();
        expect(display.schedule).toBeDefined();
        expect(display.available).toBeDefined();
      });

      it('should include user-set tracking fields', () => {
        const item = Item.fromSeed(defaultSeed);
        item.setOverride('cantidad', 100);
        const display = item.toDisplayObject();

        expect(display.userSetFields).toBeDefined();
        expect(display.isUserSetCantidad).toBe(true);
        expect(display.isUserSetPax).toBe(false);
      });

      it('should have shape compatible with XState context', () => {
        const item = Item.fromSeed(defaultSeed);
        const display = item.toDisplayObject();

        // Check essential XState context fields
        expect(display.mode).toBeDefined();
        expect(display.definition).toBeDefined();
        expect(display.externalContext).toBeDefined();
        expect(display.overrides).toBeDefined();
        expect(display.total).toBeDefined();
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize state to seed', () => {
      const item = Item.fromSeed(defaultSeed);
      const seed = item.toSeed();

      expect(seed).toHaveProperty('mode');
      expect(seed).toHaveProperty('definition');
      expect(seed).toHaveProperty('externalContext');
      expect(seed).toHaveProperty('overrides');
    });

    it('should preserve mode in seed', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setMode('basket');

      const seed = item.toSeed();
      expect(seed.mode).toBe('basket');
    });

    it('should preserve definition in seed', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setProfileValue('baseFijo', 500);

      const seed = item.toSeed();
      expect(seed.definition.pricingProfile.baseFijo).toBe(500);
    });

    it('should preserve externalContext in seed', () => {
      const item = Item.fromSeed(defaultSeed);
      item.receiveContext({ paxGlobal: 100 });

      const seed = item.toSeed();
      expect(seed.externalContext.paxGlobal).toBe(100);
    });

    it('should preserve overrides in seed', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 50);
      item.setOverride('comentarios', 'Test comment');

      const seed = item.toSeed();
      expect(seed.overrides.cantidad).toBe(50);
      expect(seed.overrides.comentarios).toBe('Test comment');
    });

    it('should round-trip through fromSeed -> toSeed', () => {
      const original = createDefaultItemSeed();
      const item1 = Item.fromSeed(original);
      item1.setOverride('cantidad', 100);
      item1.receiveContext({ paxGlobal: 50 });

      const seed1 = item1.toSeed();
      const item2 = Item.fromSeed(seed1);

      expect(item2.mode).toBe(item1.mode);
      expect(item2.overrides.cantidad).toBe(item1.overrides.cantidad);
      expect(item2.externalContext.paxGlobal).toBe(item1.externalContext.paxGlobal);
      expect(item2.total).toBe(item1.total);
    });

    it('should preserve userSetFields through serialization', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 100);

      const seed = item.toSeed();
      expect(seed.userSetFields).toContain('cantidad');

      const item2 = Item.fromSeed(seed);
      expect(item2.toDisplayObject().isUserSetCantidad).toBe(true);
    });

    it('should handle complex state round-trip', () => {
      const item1 = Item.fromSeed(defaultSeed);
      item1.setMode('basket');
      item1.setProfileValue('porUnidad', 2);
      item1.setDefaultQuantity('unidadesPorHora', 5);
      item1.receiveContext({ paxGlobal: 100, duracionMin: 180 });
      item1.setOverride('cantidad', 75);

      const seed = item1.toSeed();
      const item2 = Item.fromSeed(seed);

      expect(item2.mode).toBe('basket');
      expect(item2.definition.pricingProfile.porUnidad).toBe(2);
      expect(item2.externalContext.paxGlobal).toBe(100);
      expect(item2.overrides.cantidad).toBe(75);
      expect(item2.total).toBe(item1.total);
    });
  });

  describe('Method Chaining', () => {
    it('should support chaining multiple mutations', () => {
      const item = Item.fromSeed(defaultSeed);
      const result = item
        .setMode('basket')
        .setProfileValue('baseFijo', 500)
        .receiveContext({ paxGlobal: 50 })
        .setOverride('cantidad', 100);

      expect(result).toBe(item);
      expect(item.mode).toBe('basket');
      expect(item.definition.pricingProfile.baseFijo).toBe(500);
      expect(item.overrides.cantidad).toBe(100);
    });

    it('should support long chains of mutations', () => {
      const item = Item.fromSeed(defaultSeed)
        .setMode('basket')
        .receiveContext({ paxGlobal: 75, duracionMin: 240 })
        .setDefaultQuantity('unidadesPorUsuario', 5)
        .setOverride('cantidad', 200)
        .setProfileValue('baseFijo', 1000);

      expect(item.total).toBeDefined();
      expect(item.overrides.cantidad).toBe(200);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle item with no pricing profile', () => {
      const definition = {
        name: 'Empty Item',
        category: 'Test',
        description: 'No pricing',
        pricingProfile: {},
        defaultQuantities: {},
        rules: []
      };
      const item = Item.fromDefinition(definition);

      expect(item.pricingKind).toBe(PricingKind.NONE);
      expect(item.total).toBe(0);
    });

    it('should handle zero-value context', () => {
      const item = Item.fromSeed(defaultSeed);
      item.receiveContext({ paxGlobal: 0, duracionMin: 0 });

      expect(item.externalContext.paxGlobal).toBe(0);
      expect(item.externalContext.duracionMin).toBe(0);
    });

    it('should maintain consistency after multiple mutations', () => {
      const item = Item.fromSeed(defaultSeed);
      const snapshot1 = item.toDisplayObject();

      item.receiveContext({ paxGlobal: 100 });
      const snapshot2 = item.toDisplayObject();

      expect(snapshot2.total).not.toBe(snapshot1.total);

      item.receiveContext({ paxGlobal: 20 });
      const snapshot3 = item.toDisplayObject();

      expect(snapshot3.total).toBe(snapshot1.total);
    });

    it('should handle mixed override and context updates', () => {
      const definition = {
        ...defaultItemDefinition,
        pricingProfile: {
          baseFijo: 0,
          porPersona: 100,
          porUnidad: 0,
          porMinuto: 0
        },
        defaultQuantities: {}
      };
      const item = Item.fromSeed({
        mode: 'catalog',
        definition,
        externalContext: { paxGlobal: 20 },
        overrides: {}
      });

      // Start with context: pax = 20, total = 2000
      expect(item.quantities.pax).toBe(20);

      // Override: pax = 50
      item.setOverride('pax', 50);
      expect(item.quantities.pax).toBe(50);

      // Context change (should not affect override)
      item.receiveContext({ paxGlobal: 100 });
      expect(item.quantities.pax).toBe(50);

      // Clear override (reverts to context)
      item.clearOverride('pax');
      expect(item.quantities.pax).toBe(100);
    });

    it('should recalculate derived fields correctly on every mutation', () => {
      const item = Item.fromSeed(defaultSeed);
      const initial = item.toDisplayObject();

      item.setOverride('cantidad', 200);
      const afterOverride = item.toDisplayObject();

      expect(afterOverride.total).not.toBe(initial.total);
      expect(afterOverride.quantities.cantidad).toBe(200);
      expect(afterOverride.isOverridden).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should expose mode getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.mode).toBe('catalog');
    });

    it('should expose definition getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.definition).toBeDefined();
      expect(item.definition.name).toBe('Coffee Break Intermedio');
    });

    it('should expose externalContext getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.externalContext).toBeDefined();
      expect(item.externalContext.paxGlobal).toBe(20);
    });

    it('should expose overrides getter', () => {
      const item = Item.fromSeed(defaultSeed);
      item.setOverride('cantidad', 50);
      expect(item.overrides.cantidad).toBe(50);
    });

    it('should expose pricingKind getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.pricingKind).toBe(PricingKind.UNITS);
    });

    it('should expose total getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.total).toBe(460);
    });

    it('should expose isOverridden getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(item.isOverridden).toBe(false);

      item.setOverride('cantidad', 100);
      expect(item.isOverridden).toBe(true);
    });

    it('should expose isAvailable getter', () => {
      const item = Item.fromSeed(defaultSeed);
      expect(typeof item.isAvailable).toBe('boolean');
    });

    it('should expose quantities getter', () => {
      const item = Item.fromSeed(defaultSeed);
      const quantities = item.quantities;
      expect(quantities).toHaveProperty('pax');
      expect(quantities).toHaveProperty('cantidad');
      expect(quantities).toHaveProperty('duracionMin');
    });

    it('should expose schedule getter', () => {
      const item = Item.fromSeed(defaultSeed);
      const schedule = item.schedule;
      expect(schedule).toBeDefined();
      expect(schedule).toHaveProperty('dia');
      expect(schedule).toHaveProperty('hora');
    });
  });
});
