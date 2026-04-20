import { describe, it, expect } from 'vitest';
import {
  PricingKind,
  InitializationMode,
  toNumber,
  toInteger,
  normalizeProfile,
  detectPricingKind,
  detectInitializationMode,
  rateForKind,
  overrideFieldForKind,
  fixedAmountForKind
} from '../domain/pricing.js';

describe('Enums', () => {
  describe('PricingKind', () => {
    it('should have NONE value', () => {
      expect(PricingKind.NONE).toBe('NONE');
    });

    it('should have PAX value', () => {
      expect(PricingKind.PAX).toBe('PAX');
    });

    it('should have UNITS value', () => {
      expect(PricingKind.UNITS).toBe('UNITS');
    });

    it('should have TIME value', () => {
      expect(PricingKind.TIME).toBe('TIME');
    });
  });

  describe('InitializationMode', () => {
    it('should have NONE value', () => {
      expect(InitializationMode.NONE).toBe('NONE');
    });

    it('should have FIXED_AMOUNT value', () => {
      expect(InitializationMode.FIXED_AMOUNT).toBe('FIXED_AMOUNT');
    });

    it('should have CONTEXT_PAX value', () => {
      expect(InitializationMode.CONTEXT_PAX).toBe('CONTEXT_PAX');
    });

    it('should have CONTEXT_TIME value', () => {
      expect(InitializationMode.CONTEXT_TIME).toBe('CONTEXT_TIME');
    });
  });
});

describe('toNumber()', () => {
  it('should convert string to number', () => {
    expect(toNumber('42')).toBe(42);
  });

  it('should convert string float to number', () => {
    expect(toNumber('3.14')).toBe(3.14);
  });

  it('should pass through valid numbers', () => {
    expect(toNumber(100)).toBe(100);
  });

  it('should return fallback for NaN', () => {
    expect(toNumber('not a number')).toBe(0);
  });

  it('should use custom fallback', () => {
    expect(toNumber('invalid', 42)).toBe(42);
  });

  it('should return fallback for Infinity', () => {
    expect(toNumber(Infinity)).toBe(0);
  });

  it('should return fallback for -Infinity', () => {
    expect(toNumber(-Infinity, 99)).toBe(99);
  });

  it('should handle negative numbers', () => {
    expect(toNumber('-50')).toBe(-50);
  });

  it('should handle zero', () => {
    expect(toNumber(0)).toBe(0);
  });

  it('should handle null with default fallback', () => {
    expect(toNumber(null)).toBe(0);
  });

  it('should handle undefined with default fallback', () => {
    expect(toNumber(undefined)).toBe(0);
  });
});

describe('toInteger()', () => {
  it('should round 3.4 to 3', () => {
    expect(toInteger(3.4)).toBe(3);
  });

  it('should round 3.5 to 4', () => {
    expect(toInteger(3.5)).toBe(4);
  });

  it('should round 3.6 to 4', () => {
    expect(toInteger(3.6)).toBe(4);
  });

  it('should parse string and round', () => {
    expect(toInteger('2.7')).toBe(3);
  });

  it('should return fallback for invalid input', () => {
    expect(toInteger('not a number')).toBe(0);
  });

  it('should use custom fallback', () => {
    expect(toInteger('invalid', 99)).toBe(99);
  });

  it('should handle negative decimals', () => {
    expect(toInteger(-2.5)).toBe(-2);
  });

  it('should handle zero', () => {
    expect(toInteger(0)).toBe(0);
  });

  it('should handle already-integer values', () => {
    expect(toInteger(42)).toBe(42);
  });
});

describe('normalizeProfile()', () => {
  it('should normalize camelCase profile', () => {
    const result = normalizeProfile({
      baseFijo: 100,
      porPersona: 25,
      porUnidad: 10,
      porMinuto: 5
    });
    expect(result).toEqual({
      baseFijo: 100,
      porPersona: 25,
      porUnidad: 10,
      porMinuto: 5
    });
  });

  it('should normalize schema-style keys', () => {
    const result = normalizeProfile({
      Costo_Base_Fijo: 50,
      Costo_Unitario_Pax: 30,
      Costo_Unitario_Item: 15,
      Costo_Unitario_Tiempo: 2
    });
    expect(result).toEqual({
      baseFijo: 50,
      porPersona: 30,
      porUnidad: 15,
      porMinuto: 2
    });
  });

  it('should prefer camelCase over schema-style keys', () => {
    const result = normalizeProfile({
      baseFijo: 100,
      Costo_Base_Fijo: 50
    });
    expect(result.baseFijo).toBe(100);
  });

  it('should default to empty object', () => {
    const result = normalizeProfile();
    expect(result).toEqual({
      baseFijo: 0,
      porPersona: 0,
      porUnidad: 0,
      porMinuto: 0
    });
  });

  it('should convert string values to numbers', () => {
    const result = normalizeProfile({
      baseFijo: '100',
      porPersona: '25',
      porUnidad: '10',
      porMinuto: '5'
    });
    expect(result).toEqual({
      baseFijo: 100,
      porPersona: 25,
      porUnidad: 10,
      porMinuto: 5
    });
  });

  it('should use fallback for invalid values', () => {
    const result = normalizeProfile({
      baseFijo: 'invalid',
      porPersona: null
    });
    expect(result.baseFijo).toBe(0);
    expect(result.porPersona).toBe(0);
  });

  it('should handle mixed valid and invalid values', () => {
    const result = normalizeProfile({
      baseFijo: 100,
      porPersona: 'invalid',
      porUnidad: 20,
      porMinuto: undefined
    });
    expect(result.baseFijo).toBe(100);
    expect(result.porPersona).toBe(0);
    expect(result.porUnidad).toBe(20);
    expect(result.porMinuto).toBe(0);
  });
});

describe('detectPricingKind()', () => {
  it('should return PAX when porPersona > 0', () => {
    const profile = { porPersona: 25, porUnidad: 0, porMinuto: 0 };
    expect(detectPricingKind(profile)).toBe(PricingKind.PAX);
  });

  it('should return UNITS when porUnidad > 0 and porPersona = 0', () => {
    const profile = { porPersona: 0, porUnidad: 10, porMinuto: 0 };
    expect(detectPricingKind(profile)).toBe(PricingKind.UNITS);
  });

  it('should return TIME when porMinuto > 0 and others = 0', () => {
    const profile = { porPersona: 0, porUnidad: 0, porMinuto: 5 };
    expect(detectPricingKind(profile)).toBe(PricingKind.TIME);
  });

  it('should return NONE when all rates are 0', () => {
    const profile = { porPersona: 0, porUnidad: 0, porMinuto: 0 };
    expect(detectPricingKind(profile)).toBe(PricingKind.NONE);
  });

  it('should prioritize PAX over UNITS and TIME', () => {
    const profile = { porPersona: 25, porUnidad: 10, porMinuto: 5 };
    expect(detectPricingKind(profile)).toBe(PricingKind.PAX);
  });

  it('should prioritize UNITS over TIME', () => {
    const profile = { porPersona: 0, porUnidad: 10, porMinuto: 5 };
    expect(detectPricingKind(profile)).toBe(PricingKind.UNITS);
  });

  it('should handle string values (coerced to numbers)', () => {
    const profile = { porPersona: '25', porUnidad: '0', porMinuto: '0' };
    expect(detectPricingKind(profile)).toBe(PricingKind.PAX);
  });

  it('should handle negative values (treated as 0)', () => {
    const profile = { porPersona: -25, porUnidad: 0, porMinuto: 0 };
    expect(detectPricingKind(profile)).toBe(PricingKind.NONE);
  });
});

describe('detectInitializationMode()', () => {
  describe('when kind is NONE', () => {
    it('should return NONE', () => {
      expect(detectInitializationMode(PricingKind.NONE, {})).toBe(InitializationMode.NONE);
    });
  });

  describe('when kind is PAX', () => {
    it('should return FIXED_AMOUNT when defaults.pax > 0', () => {
      const mode = detectInitializationMode(PricingKind.PAX, { pax: 50 });
      expect(mode).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should return CONTEXT_PAX when defaults.pax = 0', () => {
      const mode = detectInitializationMode(PricingKind.PAX, { pax: 0 });
      expect(mode).toBe(InitializationMode.CONTEXT_PAX);
    });

    it('should return CONTEXT_PAX when no pax default provided', () => {
      const mode = detectInitializationMode(PricingKind.PAX, {});
      expect(mode).toBe(InitializationMode.CONTEXT_PAX);
    });
  });

  describe('when kind is UNITS', () => {
    it('should return FIXED_AMOUNT when defaults.cantidad > 0', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, { cantidad: 10 });
      expect(mode).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should return CONTEXT_PAX when defaults.unidadesPorUsuario > 0', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, { unidadesPorUsuario: 2 });
      expect(mode).toBe(InitializationMode.CONTEXT_PAX);
    });

    it('should return CONTEXT_TIME when defaults.unidadesPorHora > 0', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, { unidadesPorHora: 4 });
      expect(mode).toBe(InitializationMode.CONTEXT_TIME);
    });

    it('should prioritize cantidad over unidadesPorUsuario', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, {
        cantidad: 10,
        unidadesPorUsuario: 2
      });
      expect(mode).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should prioritize unidadesPorUsuario over unidadesPorHora', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, {
        unidadesPorUsuario: 2,
        unidadesPorHora: 4
      });
      expect(mode).toBe(InitializationMode.CONTEXT_PAX);
    });

    it('should return NONE when no defaults provided', () => {
      const mode = detectInitializationMode(PricingKind.UNITS, {});
      expect(mode).toBe(InitializationMode.NONE);
    });
  });

  describe('when kind is TIME', () => {
    it('should return FIXED_AMOUNT when defaults.duracionMin > 0', () => {
      const mode = detectInitializationMode(PricingKind.TIME, { duracionMin: 60 });
      expect(mode).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should return CONTEXT_PAX when defaults.minutosPorUsuario > 0', () => {
      const mode = detectInitializationMode(PricingKind.TIME, { minutosPorUsuario: 30 });
      expect(mode).toBe(InitializationMode.CONTEXT_PAX);
    });

    it('should return CONTEXT_TIME when duracionMin and minutosPorUsuario are 0', () => {
      const mode = detectInitializationMode(PricingKind.TIME, {
        duracionMin: 0,
        minutosPorUsuario: 0
      });
      expect(mode).toBe(InitializationMode.CONTEXT_TIME);
    });

    it('should prioritize duracionMin over minutosPorUsuario', () => {
      const mode = detectInitializationMode(PricingKind.TIME, {
        duracionMin: 60,
        minutosPorUsuario: 30
      });
      expect(mode).toBe(InitializationMode.FIXED_AMOUNT);
    });

    it('should return CONTEXT_TIME when no defaults provided', () => {
      const mode = detectInitializationMode(PricingKind.TIME, {});
      expect(mode).toBe(InitializationMode.CONTEXT_TIME);
    });
  });

  it('should handle undefined defaults as empty object', () => {
    expect(detectInitializationMode(PricingKind.PAX)).toBe(InitializationMode.CONTEXT_PAX);
  });
});

describe('rateForKind()', () => {
  const profile = {
    porPersona: 25,
    porUnidad: 10,
    porMinuto: 5
  };

  it('should return porPersona for PAX kind', () => {
    expect(rateForKind(profile, PricingKind.PAX)).toBe(25);
  });

  it('should return porUnidad for UNITS kind', () => {
    expect(rateForKind(profile, PricingKind.UNITS)).toBe(10);
  });

  it('should return porMinuto for TIME kind', () => {
    expect(rateForKind(profile, PricingKind.TIME)).toBe(5);
  });

  it('should return 0 for NONE kind', () => {
    expect(rateForKind(profile, PricingKind.NONE)).toBe(0);
  });

  it('should return 0 for unknown kind', () => {
    expect(rateForKind(profile, 'UNKNOWN')).toBe(0);
  });

  it('should handle zero rates', () => {
    const zeroProfile = {
      porPersona: 0,
      porUnidad: 0,
      porMinuto: 0
    };
    expect(rateForKind(zeroProfile, PricingKind.PAX)).toBe(0);
  });

  it('should handle string rates (coerced to numbers)', () => {
    const stringProfile = {
      porPersona: '25',
      porUnidad: '10',
      porMinuto: '5'
    };
    expect(rateForKind(stringProfile, PricingKind.PAX)).toBe(25);
  });
});

describe('overrideFieldForKind()', () => {
  it('should return "pax" for PAX kind', () => {
    expect(overrideFieldForKind(PricingKind.PAX)).toBe('pax');
  });

  it('should return "cantidad" for UNITS kind', () => {
    expect(overrideFieldForKind(PricingKind.UNITS)).toBe('cantidad');
  });

  it('should return "duracionMin" for TIME kind', () => {
    expect(overrideFieldForKind(PricingKind.TIME)).toBe('duracionMin');
  });

  it('should return null for NONE kind', () => {
    expect(overrideFieldForKind(PricingKind.NONE)).toBeNull();
  });

  it('should return null for unknown kind', () => {
    expect(overrideFieldForKind('UNKNOWN')).toBeNull();
  });

  it('should return null for undefined', () => {
    expect(overrideFieldForKind(undefined)).toBeNull();
  });
});

describe('fixedAmountForKind()', () => {
  const defaults = {
    pax: 50,
    cantidad: 20,
    duracionMin: 120
  };

  it('should return pax amount for PAX kind', () => {
    expect(fixedAmountForKind(PricingKind.PAX, defaults)).toBe(50);
  });

  it('should return cantidad for UNITS kind', () => {
    expect(fixedAmountForKind(PricingKind.UNITS, defaults)).toBe(20);
  });

  it('should return duracionMin for TIME kind', () => {
    expect(fixedAmountForKind(PricingKind.TIME, defaults)).toBe(120);
  });

  it('should return 0 for NONE kind', () => {
    expect(fixedAmountForKind(PricingKind.NONE, defaults)).toBe(0);
  });

  it('should return 0 for unknown kind', () => {
    expect(fixedAmountForKind('UNKNOWN', defaults)).toBe(0);
  });

  it('should return 0 when defaults are empty', () => {
    expect(fixedAmountForKind(PricingKind.PAX, {})).toBe(0);
  });

  it('should use default empty object', () => {
    expect(fixedAmountForKind(PricingKind.PAX)).toBe(0);
  });

  it('should handle string values (coerced to numbers)', () => {
    const stringDefaults = {
      pax: '50',
      cantidad: '20',
      duracionMin: '120'
    };
    expect(fixedAmountForKind(PricingKind.PAX, stringDefaults)).toBe(50);
  });

  it('should handle undefined individual fields', () => {
    expect(fixedAmountForKind(PricingKind.PAX, { pax: undefined })).toBe(0);
  });

  it('should handle zero values', () => {
    expect(fixedAmountForKind(PricingKind.PAX, { pax: 0 })).toBe(0);
  });
});
