import { describe, it, expect } from 'vitest';
import { 
  resolveContextQuantity, 
  resolveBasketQuantity, 
  applyExclusiveDefaultMode 
} from './QuantityResolution.js';
import { PricingKind, InitializationMode } from './Enums.js';

describe('QuantityResolution', () => {
  describe('resolveContextQuantity', () => {
    it('should resolve PAX from paxGlobal', () => {
      const context = { paxGlobal: 50 };
      expect(resolveContextQuantity(PricingKind.PAX, InitializationMode.CONTEXT_PAX, {}, context)).toBe(50);
    });

    it('should resolve units from units/pax * paxGlobal', () => {
      const defaults = { unidadesPorUsuario: 3 };
      const context = { paxGlobal: 10 };
      expect(resolveContextQuantity(PricingKind.UNITS, InitializationMode.CONTEXT_PAX, defaults, context)).toBe(30);
    });
  });

  describe('resolveBasketQuantity', () => {
    it('should prioritize overrides', () => {
      const overrides = { cantidad: 99 };
      const res = resolveBasketQuantity(PricingKind.UNITS, InitializationMode.FIXED_AMOUNT, { cantidad: 10 }, {}, overrides);
      expect(res.quantity).toBe(99);
      expect(res.isOverridden).toBe(true);
    });

    it('should use fixed default if no override', () => {
      const res = resolveBasketQuantity(PricingKind.UNITS, InitializationMode.FIXED_AMOUNT, { cantidad: 10 }, {}, {});
      expect(res.quantity).toBe(10);
      expect(res.isOverridden).toBe(false);
    });
  });

  describe('applyExclusiveDefaultMode', () => {
    it('should delete units/pax when setting units', () => {
      const defaults = { unidadesPorUsuario: 5 };
      const next = applyExclusiveDefaultMode(defaults, 'cantidad', 10);
      expect(next.cantidad).toBe(10);
      expect(next.unidadesPorUsuario).toBeUndefined();
    });
  });
});
