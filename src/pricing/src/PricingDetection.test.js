import { describe, it, expect } from 'vitest';
import { 
  detectPricingKind, 
  detectInitializationMode, 
  rateForKind, 
  overrideFieldForKind, 
  fixedAmountForKind 
} from './PricingDetection.js';
import { PricingKind, InitializationMode } from './Enums.js';

describe('PricingDetection', () => {
  describe('detectPricingKind', () => {
    it('should detect PAX when porPersona > 0', () => {
      const profile = { porPersona: 10, porUnidad: 0, porMinuto: 0 };
      expect(detectPricingKind(profile)).toBe(PricingKind.PAX);
    });

    it('should detect UNITS when porUnidad > 0 and porPersona is 0', () => {
      const profile = { porPersona: 0, porUnidad: 10, porMinuto: 0 };
      expect(detectPricingKind(profile)).toBe(PricingKind.UNITS);
    });

    it('should detect TIME when porMinuto > 0 and others are 0', () => {
      const profile = { porPersona: 0, porUnidad: 0, porMinuto: 10 };
      expect(detectPricingKind(profile)).toBe(PricingKind.TIME);
    });

    it('should detect NONE when all are 0', () => {
      const profile = { porPersona: 0, porUnidad: 0, porMinuto: 0 };
      expect(detectPricingKind(profile)).toBe(PricingKind.NONE);
    });
  });

  describe('detectInitializationMode', () => {
    it('should return FIXED_AMOUNT if pax is set for PAX kind', () => {
      const defaults = { pax: 10 };
      expect(detectInitializationMode(PricingKind.PAX, defaults)).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should return CONTEXT_PAX if no pax set for PAX kind', () => {
      expect(detectInitializationMode(PricingKind.PAX, {})).toBe(InitializationMode.CONTEXT_PAX);
    });
  });

  describe('rateForKind', () => {
    it('should return porPersona rate for PAX', () => {
      const profile = { porPersona: 100, porUnidad: 50, porMinuto: 20 };
      expect(rateForKind(profile, PricingKind.PAX)).toBe(100);
    });
  });

  describe('overrideFieldForKind', () => {
    it('should return pax for PAX kind', () => {
      expect(overrideFieldForKind(PricingKind.PAX)).toBe('pax');
    });
  });

  describe('fixedAmountForKind', () => {
    it('should return defaults.pax for PAX kind', () => {
      const defaults = { pax: 123 };
      expect(fixedAmountForKind(PricingKind.PAX, defaults)).toBe(123);
    });
  });
});
