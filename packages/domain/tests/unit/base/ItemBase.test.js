import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemBase } from '../../../src/base/ItemBase.js';

describe('ItemBase', () => {
  let item;

  beforeEach(() => {
    item = new ItemBase();
  });

  // ── Initial state ────────────────────────────────────────────────

  describe('initial state', () => {
    it('should initialize core identity fields to null/defaults', () => {
      expect(item.ID_Item).toBeNull();
      expect(item.Nombre).toBeNull();
      expect(item.ID_Categoria).toBeNull();
      expect(item.Activo).toBe(true);
    });

    it('should initialize availability and basket state', () => {
      expect(item._available).toBe(true);
      expect(item.ID_Linea).toBeNull();
      expect(item.Dia).toBeNull();
      expect(item.Hora).toBeNull();
      expect(item.Comentarios).toBeNull();
    });

    it('should initialize kit support fields', () => {
      expect(item.isKit).toBe(false);
      expect(item.children).toEqual([]);
    });

    it('should initialize rule and evaluator state', () => {
      expect(item._rules).toEqual([]);
      expect(item._appliedRules).toEqual([]);
      expect(item._userAjustes).toEqual([]);
      expect(item._evaluator).toBeNull();
    });

    it('should initialize all Prizable mixin fields', () => {
      expect(item.pax).toBeNull();
      expect(item.paxIsUserSet).toBe(false);
      expect(item.cantidad).toBeNull();
      expect(item.cantidadIsUserSet).toBe(false);
      expect(item.duracion).toBeNull();
      expect(item.duracionIsUserSet).toBe(false);
      expect(item._profile).toBeNull();
      expect(item._price).toBeNull();
    });

    it('should initialize XState actor reference', () => {
      expect(item._actorRef).toBeNull();
    });
  });

  // ── Getters ──────────────────────────────────────────────────────

  describe('id getter', () => {
    it('should return ID_Item', () => {
      item.ID_Item = 'item-123';
      expect(item.id).toBe('item-123');
    });

    it('should return null when ID_Item is null', () => {
      expect(item.id).toBeNull();
    });
  });

  describe('name getter', () => {
    it('should return Nombre', () => {
      item.Nombre = 'Catering Package A';
      expect(item.name).toBe('Catering Package A');
    });

    it('should return null when Nombre is null', () => {
      expect(item.name).toBeNull();
    });
  });

  describe('inBasket getter', () => {
    it('should return false when ID_Linea is null', () => {
      item.ID_Linea = null;
      expect(item.inBasket).toBe(false);
    });

    it('should return true when ID_Linea is set', () => {
      item.ID_Linea = 'line-42';
      expect(item.inBasket).toBe(true);
    });

    it('should return true when ID_Linea is 0', () => {
      item.ID_Linea = 0;
      expect(item.inBasket).toBe(true);
    });

    it('should return true when ID_Linea is empty string (empty string != null)', () => {
      item.ID_Linea = '';
      expect(item.inBasket).toBe(true);
    });
  });

  describe('humanizedRules getter', () => {
    it('should return empty array when no rules applied', () => {
      expect(item.humanizedRules).toEqual([]);
    });

    it('should return descriptions from applied rules', () => {
      item._appliedRules = [
        { ruleId: 'r1', description: 'Item unavailable on this date' },
        { ruleId: 'r2', description: '10% discount applied' },
      ];
      expect(item.humanizedRules).toEqual([
        'Item unavailable on this date',
        '10% discount applied',
      ]);
    });

    it('should fall back to ruleId when description missing', () => {
      item._appliedRules = [
        { ruleId: 'r1', description: 'Test rule' },
        { ruleId: 'r2' },
      ];
      expect(item.humanizedRules).toEqual(['Test rule', 'r2']);
    });

    it('should stringify rules without ruleId or description', () => {
      item._appliedRules = [{ delta: 500 }, { delta: 1000 }];
      expect(item.humanizedRules.length).toBe(2);
      expect(item.humanizedRules[0]).toBe('[object Object]');
    });
  });

  // ── instantiate ──────────────────────────────────────────────────

  describe('instantiate(lineId)', () => {
    beforeEach(() => {
      item.ID_Item = 'item-1';
      item.Nombre = 'Cocktail Hour';
      item.ID_Categoria = 'cat-1';
      item.pax = 50;
      item.cantidad = 2;
      item.duracion = 120;
      item.paxIsUserSet = true;
      item._price = 5000;
      item._appliedRules = [{ ruleId: 'r1' }];
      item._userAjustes = [{ type: 'manual' }];
    });

    it('should create a new object (different reference)', () => {
      const instance = item.instantiate('line-1');
      expect(instance).not.toBe(item);
    });

    it('should preserve prototype chain', () => {
      const instance = item.instantiate('line-1');
      expect(Object.getPrototypeOf(instance)).toBe(Object.getPrototypeOf(item));
    });

    it('should NOT mutate the original item', () => {
      const originalPrice = item._price;
      const originalRules = item._appliedRules.length;
      const originalPaxIsUserSet = item.paxIsUserSet;

      item.instantiate('line-1');

      expect(item._price).toBe(originalPrice);
      expect(item._appliedRules.length).toBe(originalRules);
      expect(item.paxIsUserSet).toBe(originalPaxIsUserSet);
    });

    it('should copy all own properties from original', () => {
      const instance = item.instantiate('line-1');
      expect(instance.ID_Item).toBe('item-1');
      expect(instance.Nombre).toBe('Cocktail Hour');
      expect(instance.ID_Categoria).toBe('cat-1');
      expect(instance.pax).toBe(50);
      expect(instance.cantidad).toBe(2);
      expect(instance.duracion).toBe(120);
    });

    it('should set ID_Linea to the provided lineId', () => {
      const instance = item.instantiate('line-42');
      expect(instance.ID_Linea).toBe('line-42');
    });

    it('should set default basket state', () => {
      const instance = item.instantiate('line-1');
      expect(instance.Dia).toBe(1);
      expect(instance.Hora).toBe('09:00');
      expect(instance.Comentarios).toBe('');
    });

    it('should reset computed state', () => {
      const instance = item.instantiate('line-1');
      expect(instance._price).toBeNull();
      expect(instance._appliedRules).toEqual([]);
      expect(instance._userAjustes).toEqual([]);
    });

    it('should reset user-set flags', () => {
      const instance = item.instantiate('line-1');
      expect(instance.paxIsUserSet).toBe(false);
      expect(instance.cantidadIsUserSet).toBe(false);
      expect(instance.duracionIsUserSet).toBe(false);
    });

    it('should allow chaining to set additional properties', () => {
      const instance = item.instantiate('line-1');
      instance.Dia = 15;
      instance.Hora = '18:00';
      expect(instance.Dia).toBe(15);
      expect(instance.Hora).toBe('18:00');
      expect(item.Dia).toBeNull();
    });

    it('should work with numeric lineId', () => {
      const instance = item.instantiate(1001);
      expect(instance.ID_Linea).toBe(1001);
    });
  });

  // ── updateQuantities ─────────────────────────────────────────────

  describe('updateQuantities(quantities, isUserOverride)', () => {
    beforeEach(() => {
      item._profile = { id: 'profile-1' };
      item._pricingFn = vi.fn().mockReturnValue(5000);
      item._evaluator = null;
      item._inheritedContext = {};
      item._defaultPax = 100;
      item._defaultCantidad = 50;
      item._defaultDuracion = 8;
    });

    it('should set pax from quantities object', () => {
      item.updateQuantities({ pax: 100 });
      expect(item.pax).toBe(100);
    });

    it('should set cantidad from quantities object', () => {
      item.updateQuantities({ cantidad: 50 });
      expect(item.cantidad).toBe(50);
    });

    it('should set duracion from quantities object', () => {
      item.updateQuantities({ duracion: 8 });
      expect(item.duracion).toBe(8);
    });

    it('should set all quantities at once', () => {
      item.updateQuantities({ pax: 100, cantidad: 50, duracion: 8 });
      expect(item.pax).toBe(100);
      expect(item.cantidad).toBe(50);
      expect(item.duracion).toBe(8);
    });

    it('should mark pax as user-set when isUserOverride=true', () => {
      item.updateQuantities({ pax: 100 }, true);
      expect(item.paxIsUserSet).toBe(true);
    });

    it('should mark cantidad as user-set when isUserOverride=true', () => {
      item.updateQuantities({ cantidad: 50 }, true);
      expect(item.cantidadIsUserSet).toBe(true);
    });

    it('should mark duracion as user-set when isUserOverride=true', () => {
      item.updateQuantities({ duracion: 8 }, true);
      expect(item.duracionIsUserSet).toBe(true);
    });

    it('should not mark as user-set when isUserOverride=false', () => {
      item.updateQuantities({ pax: 100 }, false);
      expect(item.paxIsUserSet).toBe(false);
    });

    it('should not mark as user-set by default', () => {
      item.updateQuantities({ pax: 100 });
      expect(item.paxIsUserSet).toBe(false);
    });

    it('should call calculate() after updating', () => {
      const calculateSpy = vi.spyOn(item, 'calculate');
      item.updateQuantities({ pax: 100 });
      expect(calculateSpy).toHaveBeenCalledOnce();
    });

    it('should return this for chaining', () => {
      const result = item.updateQuantities({ pax: 100 });
      expect(result).toBe(item);
    });

    it('should handle empty quantities object', () => {
      const calculateSpy = vi.spyOn(item, 'calculate');
      item.updateQuantities({});
      expect(calculateSpy).toHaveBeenCalledOnce();
    });

    it('should handle undefined quantities gracefully', () => {
      const calculateSpy = vi.spyOn(item, 'calculate');
      item.updateQuantities(undefined);
      expect(calculateSpy).toHaveBeenCalledOnce();
    });

    it('should preserve quantities through calculate via user override', () => {
      item.pax = 100;
      item.paxIsUserSet = true;
      item.cantidad = 50;
      item.cantidadIsUserSet = true;
      item.duracion = 8;
      item.duracionIsUserSet = true;
      item.calculate();
      expect(item.pax).toBe(100);
      expect(item.cantidad).toBe(50);
      expect(item.duracion).toBe(8);
    });
  });

  // ── calculate ────────────────────────────────────────────────────

  describe('calculate()', () => {
    beforeEach(() => {
      item._profile = { id: 'profile-1' };
      item._pricingFn = vi.fn().mockReturnValue(5000);
      item._evaluator = vi.fn().mockReturnValue(null);
      item._inheritedContext = {};
    });

    it('should call resolveQuantities with _inheritedContext', () => {
      const resolveQuantitiesSpy = vi.spyOn(item, 'resolveQuantities');
      item._inheritedContext = { pax: 75 };
      item.calculate();
      expect(resolveQuantitiesSpy).toHaveBeenCalledWith({ pax: 75 });
    });

    it('should call calculatePrice after resolveQuantities', () => {
      const calculatePriceSpy = vi.spyOn(item, 'calculatePrice');
      item.calculate();
      expect(calculatePriceSpy).toHaveBeenCalledOnce();
    });

    it('should call evaluateRules if _evaluator is set', () => {
      const evaluateRulesSpy = vi.spyOn(item, 'evaluateRules');
      item.calculate();
      expect(evaluateRulesSpy).toHaveBeenCalledWith(item._evaluator);
    });

    it('should not call evaluateRules if _evaluator is null', () => {
      item._evaluator = null;
      const evaluateRulesSpy = vi.spyOn(item, 'evaluateRules');
      item.calculate();
      expect(evaluateRulesSpy).not.toHaveBeenCalled();
    });

    it('should set _available=true when no blocking rules', () => {
      item._appliedRules = [{ ruleId: 'r1', blocking: false }];
      item._available = false;
      item.calculate();
      expect(item._available).toBe(true);
    });

    it('should set _available=false when any blocking rule applies', () => {
      item._evaluator = vi.fn((rule, ctx) => {
        return { ruleId: 'r1', blocking: true };
      });
      item._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];
      item._available = true;
      item.calculate();
      expect(item._available).toBe(false);
    });

    it('should set _available=false only if at least one rule has blocking=true', () => {
      item._evaluator = vi.fn((rule, ctx) => {
        return { ruleId: rule.ID_Regla, blocking: true };
      });
      item._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: false },
      ];
      item.calculate();
      expect(item._available).toBe(false);
    });

    it('should return this for chaining', () => {
      const result = item.calculate();
      expect(result).toBe(item);
    });

    it('should execute in order: resolve → price → rules', () => {
      const order = [];
      item._inheritedContext = {};
      item._profile = { id: 'p1' };
      item._pricingFn = () => 1000;
      item._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];
      item._evaluator = vi.fn((rule) => {
        order.push('evaluate');
        return null;
      });

      const originalResolve = item.resolveQuantities;
      const originalCalcPrice = item.calculatePrice;

      vi.spyOn(item, 'resolveQuantities').mockImplementation(function() {
        order.push('resolve');
        return originalResolve.call(this);
      });
      
      vi.spyOn(item, 'calculatePrice').mockImplementation(function() {
        order.push('calculate');
        return originalCalcPrice.call(this);
      });

      item.calculate();

      expect(order).toEqual(['resolve', 'calculate', 'evaluate']);
    });

    it('should check for blocking rules when evaluator is set', () => {
      item._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];
      item._evaluator = vi.fn((rule) => {
        if (rule.ID_Regla === 'r1') return { ruleId: 'r1', blocking: true };
        return null;
      });
      item.calculate();
      expect(item._available).toBe(false);
    });
  });

  // ── toDisplayObject ──────────────────────────────────────────────

  describe('toDisplayObject()', () => {
    beforeEach(() => {
      item.ID_Item = 'item-1';
      item.ID_Linea = 'line-42';
      item.Nombre = 'Cocktail Hour';
      item.Dia = 15;
      item.Hora = '18:00';
      item.Comentarios = 'No nuts';
      item.pax = 100;
      item.paxIsUserSet = true;
      item.cantidad = 2;
      item.cantidadIsUserSet = false;
      item.duracion = 120;
      item.duracionIsUserSet = true;
      item._price = 10000;
      item._available = true;
      item.isKit = false;
      item._appliedRules = [
        { ruleId: 'r1', description: 'Early bird discount' },
      ];
      item._userAjustes = [{ type: 'manual', value: -500 }];
    });

    it('should return a plain object', () => {
      const display = item.toDisplayObject();
      expect(typeof display).toBe('object');
      expect(display).not.toBe(item);
    });

    it('should use ID_Linea as id when set', () => {
      const display = item.toDisplayObject();
      expect(display.id).toBe('line-42');
    });

    it('should use ID_Item as id when ID_Linea is null', () => {
      item.ID_Linea = null;
      const display = item.toDisplayObject();
      expect(display.id).toBe('item-1');
    });

    it('should include all expected keys', () => {
      const display = item.toDisplayObject();
      const expectedKeys = [
        'id', 'lineId', 'itemId', 'nombre', 'dia', 'hora', 'comentarios',
        'pax', 'paxIsUserSet', 'cantidad', 'cantidadIsUserSet',
        'duracion', 'duracionIsUserSet', 'precio', 'total',
        'available', 'isKit', 'appliedRules', 'userAjustes',
      ];
      for (const key of expectedKeys) {
        expect(display).toHaveProperty(key);
      }
    });

    it('should map all fields correctly', () => {
      const display = item.toDisplayObject();
      expect(display.id).toBe('line-42');
      expect(display.lineId).toBe('line-42');
      expect(display.itemId).toBe('item-1');
      expect(display.nombre).toBe('Cocktail Hour');
      expect(display.dia).toBe(15);
      expect(display.hora).toBe('18:00');
      expect(display.comentarios).toBe('No nuts');
      expect(display.pax).toBe(100);
      expect(display.paxIsUserSet).toBe(true);
      expect(display.cantidad).toBe(2);
      expect(display.cantidadIsUserSet).toBe(false);
      expect(display.duracion).toBe(120);
      expect(display.duracionIsUserSet).toBe(true);
    });

    it('should map precio to displayPrice getter', () => {
      item._price = 10000;
      item.pax = 100;
      const display = item.toDisplayObject();
      expect(display.precio).toBe(100);
    });

    it('should map total to total getter', () => {
      item._price = 10000;
      const display = item.toDisplayObject();
      expect(display.total).toBe(10000);
    });

    it('should include available flag', () => {
      item._available = true;
      expect(item.toDisplayObject().available).toBe(true);
      item._available = false;
      expect(item.toDisplayObject().available).toBe(false);
    });

    it('should include isKit flag', () => {
      item.isKit = false;
      expect(item.toDisplayObject().isKit).toBe(false);
      item.isKit = true;
      expect(item.toDisplayObject().isKit).toBe(true);
    });

    it('should include appliedRules as humanizedRules', () => {
      const display = item.toDisplayObject();
      expect(display.appliedRules).toEqual(['Early bird discount']);
    });

    it('should include userAjustes', () => {
      const display = item.toDisplayObject();
      expect(display.userAjustes).toEqual([{ type: 'manual', value: -500 }]);
    });
  });

  // ── toStorageObject ──────────────────────────────────────────────

  describe('toStorageObject()', () => {
    beforeEach(() => {
      item.ID_Item = 'item-1';
      item.ID_Linea = 'line-42';
      item.Dia = 15;
      item.Hora = '18:00';
      item.Comentarios = 'No nuts';
    });

    it('should return a plain object', () => {
      const storage = item.toStorageObject();
      expect(typeof storage).toBe('object');
      expect(storage).not.toBe(item);
    });

    it('should include ID_Linea and ID_Item', () => {
      const storage = item.toStorageObject();
      expect(storage.ID_Linea).toBe('line-42');
      expect(storage.ID_Item).toBe('item-1');
    });

    it('should include Dia, Hora, Comentarios', () => {
      const storage = item.toStorageObject();
      expect(storage.Dia).toBe(15);
      expect(storage.Hora).toBe('18:00');
      expect(storage.Comentarios).toBe('No nuts');
    });

    it('should set Override_Pax=null when paxIsUserSet=false', () => {
      item.pax = 100;
      item.paxIsUserSet = false;
      const storage = item.toStorageObject();
      expect(storage.Override_Pax).toBeNull();
    });

    it('should set Override_Pax=pax when paxIsUserSet=true', () => {
      item.pax = 100;
      item.paxIsUserSet = true;
      const storage = item.toStorageObject();
      expect(storage.Override_Pax).toBe(100);
    });

    it('should set Override_Cantidad=null when cantidadIsUserSet=false', () => {
      item.cantidad = 50;
      item.cantidadIsUserSet = false;
      const storage = item.toStorageObject();
      expect(storage.Override_Cantidad).toBeNull();
    });

    it('should set Override_Cantidad=cantidad when cantidadIsUserSet=true', () => {
      item.cantidad = 50;
      item.cantidadIsUserSet = true;
      const storage = item.toStorageObject();
      expect(storage.Override_Cantidad).toBe(50);
    });

    it('should set Override_Duracion_Min=null when duracionIsUserSet=false', () => {
      item.duracion = 120;
      item.duracionIsUserSet = false;
      const storage = item.toStorageObject();
      expect(storage.Override_Duracion_Min).toBeNull();
    });

    it('should set Override_Duracion_Min=duracion when duracionIsUserSet=true', () => {
      item.duracion = 120;
      item.duracionIsUserSet = true;
      const storage = item.toStorageObject();
      expect(storage.Override_Duracion_Min).toBe(120);
    });

    it('should handle all overrides at once', () => {
      item.pax = 100;
      item.paxIsUserSet = true;
      item.cantidad = 50;
      item.cantidadIsUserSet = true;
      item.duracion = 120;
      item.duracionIsUserSet = true;

      const storage = item.toStorageObject();

      expect(storage.Override_Pax).toBe(100);
      expect(storage.Override_Cantidad).toBe(50);
      expect(storage.Override_Duracion_Min).toBe(120);
    });

    it('should handle partial overrides', () => {
      item.pax = 100;
      item.paxIsUserSet = true;
      item.cantidad = 50;
      item.cantidadIsUserSet = false;
      item.duracion = 120;
      item.duracionIsUserSet = true;

      const storage = item.toStorageObject();

      expect(storage.Override_Pax).toBe(100);
      expect(storage.Override_Cantidad).toBeNull();
      expect(storage.Override_Duracion_Min).toBe(120);
    });
  });

  // ── Context reception (from Rulable) ──────────────────────────────

  describe('receiveContext(ctx) - inherited from Rulable', () => {
    it('should populate _inheritedContext', () => {
      item.receiveContext({ pax: 75, duracion: 8 });
      expect(item._inheritedContext).toEqual({ pax: 75, duracion: 8 });
    });

    it('should merge multiple context calls', () => {
      item.receiveContext({ pax: 75 });
      item.receiveContext({ duracion: 8 });
      expect(item._inheritedContext).toEqual({ pax: 75, duracion: 8 });
    });

    it('should return this for chaining', () => {
      const result = item.receiveContext({ pax: 75 });
      expect(result).toBe(item);
    });
  });

  // ── Integration tests ────────────────────────────────────────────

  describe('integration: full lifecycle', () => {
    beforeEach(() => {
      item.ID_Item = 'item-1';
      item.Nombre = 'Premium Catering';
      item._defaultPax = 100;
      item._defaultCantidad = 1;
      item._defaultDuracion = 4;
      item._profile = { id: 'profile-1' };
      item._pricingFn = vi.fn((profile, pax, cantidad, duracion) => {
        return (pax || 1) * (cantidad || 1) * (duracion || 1) * 100;
      });
    });

    it('should go from catalog state to basket state', () => {
      expect(item.inBasket).toBe(false);
      const instance = item.instantiate('line-1');
      expect(instance.inBasket).toBe(true);
      expect(item.inBasket).toBe(false);
    });

    it('should calculate price after context and calculate', () => {
      const instance = item.instantiate('line-1');
      instance.receiveContext({ pax: 50 });
      instance.calculate();
      expect(instance._price).toBe(20000);
    });

    it('should respect user overrides in calculation', () => {
      const instance = item.instantiate('line-1');
      instance.receiveContext({ pax: 50 });
      instance.pax = 75;
      instance.paxIsUserSet = true;
      instance.calculate();
      expect(instance.pax).toBe(75);
      expect(instance.paxIsUserSet).toBe(true);
      expect(instance._price).toBe(30000);
    });

    it('should display object with all calculated values', () => {
      const instance = item.instantiate('line-1');
      instance.receiveContext({ pax: 100 });
      instance.calculate();
      const display = instance.toDisplayObject();

      expect(display.id).toBe('line-1');
      expect(display.nombre).toBe('Premium Catering');
      expect(display.pax).toBe(100);
      expect(display.total).toBe(40000);
      expect(display.available).toBe(true);
    });

    it('should track rule application and blocking', () => {
      item._evaluator = vi.fn((rule) => {
        if (rule.ID_Regla === 'r1') {
          return { ruleId: 'r1', description: 'Unavailable', blocking: true };
        }
        return null;
      });
      item._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];

      const instance = item.instantiate('line-1');
      instance.receiveContext({ pax: 50 });
      instance.calculate();

      expect(instance._available).toBe(false);
      expect(instance.humanizedRules).toEqual(['Unavailable']);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle null _inheritedContext gracefully', () => {
      item._inheritedContext = {};
      item._profile = { id: 'profile-1' };
      item._pricingFn = vi.fn().mockReturnValue(1000);
      expect(() => item.calculate()).not.toThrow();
    });

    it('should handle empty rules array', () => {
      item._inheritedContext = {};
      item._evaluator = vi.fn();
      item._rules = [];
      item.calculate();
      expect(item._appliedRules).toEqual([]);
    });

    it('should not fail when _evaluator returns non-object', () => {
      item._inheritedContext = {};
      item._evaluator = vi.fn().mockReturnValue(null);
      item._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];
      expect(() => item.calculate()).not.toThrow();
    });

    it('should maintain separate state in multiple instances', () => {
      const instance1 = item.instantiate('line-1');
      const instance2 = item.instantiate('line-2');

      instance1.pax = 100;
      instance2.pax = 200;

      expect(instance1.pax).toBe(100);
      expect(instance2.pax).toBe(200);
      expect(item.pax).toBeNull();
    });

    it('should support chaining context and calculate', () => {
      item._inheritedContext = {};
      item._profile = { id: 'p1' };
      item._pricingFn = () => 1000;
      const result = item
        .receiveContext({ pax: 50 })
        .calculate();
      expect(result).toBe(item);
    });

    it('should allow direct property assignment', () => {
      item.ID_Item = 'new-id';
      item.Nombre = 'Updated Name';
      expect(item.ID_Item).toBe('new-id');
      expect(item.Nombre).toBe('Updated Name');
    });

    it('should handle multiple instantiations from same original', () => {
      item.ID_Item = 'item-1';
      const inst1 = item.instantiate('line-1');
      const inst2 = item.instantiate('line-2');
      const inst3 = item.instantiate('line-3');

      expect(inst1.ID_Linea).toBe('line-1');
      expect(inst2.ID_Linea).toBe('line-2');
      expect(inst3.ID_Linea).toBe('line-3');
      expect(item.ID_Linea).toBeNull();
    });
  });
});
