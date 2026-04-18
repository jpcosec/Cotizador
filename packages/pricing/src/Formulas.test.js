import { describe, it, expect } from 'vitest';
import { 
  formatCatalogTerms, 
  policyHint, 
  legendForBasket, 
  resolveSchedule, 
  evaluateRules 
} from './Formulas.js';
import { PricingKind, InitializationMode } from './Enums.js';

describe('Formulas', () => {
  describe('formatCatalogTerms', () => {
    it('should format simple fixed price', () => {
      expect(formatCatalogTerms(400, PricingKind.NONE, InitializationMode.NONE, 0, {}))
        .toBe('$400 fijo');
    });

    it('should format PAX pricing', () => {
      expect(formatCatalogTerms(0, PricingKind.PAX, InitializationMode.CONTEXT_PAX, 10, {}))
        .toBe('$10 por pax');
    });
  });

  describe('policyHint', () => {
    it('should return hint for units/pax', () => {
      const defaults = { unidadesPorUsuario: 3 };
      expect(policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_PAX, defaults))
        .toBe('3 und/persona');
    });
  });

  describe('legendForBasket', () => {
    it('should format legend with math', () => {
      expect(legendForBasket(400, PricingKind.UNITS, 10, 5, 450))
        .toBe('$400 + (10 und x $5) = $450');
    });
  });

  describe('resolveSchedule', () => {
    it('should use overrides over context', () => {
      const context = { dia: 1, hora: '09:00' };
      const overrides = { dia: 2 };
      const res = resolveSchedule(context, overrides);
      expect(res.dia).toBe(2);
      expect(res.hora).toBe('09:00');
    });
  });

  describe('evaluateRules', () => {
    it('should block if MAX_PAX exceeded', () => {
      const rules = [{ type: 'MAX_PAX', value: 100, label: 'Too many', active: true, blocking: true }];
      const snapshot = { quantities: { pax: 150 } };
      const res = evaluateRules(rules, snapshot);
      expect(res.available).toBe(false);
      expect(res.appliedRules).toContain('Too many');
    });
  });
});
