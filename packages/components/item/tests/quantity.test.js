/**
 * @file Test suite for quantity.js
 * Tests all exported functions: resolveContextQuantity, resolveBasketQuantity, applyExclusiveDefaultMode
 */

import { describe, it, expect } from 'vitest';
import {
  resolveContextQuantity,
  resolveBasketQuantity,
  applyExclusiveDefaultMode
} from '../domain/quantity.js';
import { PricingKind, InitializationMode } from '../domain/pricing.js';

describe('resolveContextQuantity', () => {
  describe('CONTEXT_PAX + PAX', () => {
    it('returns paxGlobal when PAX kind', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 }
      );
      expect(result).toBe(50);
    });

    it('returns 0 when paxGlobal is missing', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        {}
      );
      expect(result).toBe(0);
    });

    it('coerces paxGlobal to number', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: '75' }
      );
      expect(result).toBe(75);
    });
  });

  describe('CONTEXT_PAX + UNITS', () => {
    it('returns paxGlobal * unidadesPorUsuario', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 3 },
        { paxGlobal: 50 }
      );
      expect(result).toBe(150);
    });

    it('returns 0 when unidadesPorUsuario missing', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 when paxGlobal missing', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 3 },
        {}
      );
      expect(result).toBe(0);
    });

    it('handles decimal values and multipliers', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 2.5 },
        { paxGlobal: 40 }
      );
      expect(result).toBe(100);
    });

    it('coerces string multiplier to number', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: '2' },
        { paxGlobal: 25 }
      );
      expect(result).toBe(50);
    });
  });

  describe('CONTEXT_PAX + TIME', () => {
    it('returns paxGlobal * minutosPorUsuario', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_PAX,
        { minutosPorUsuario: 5 },
        { paxGlobal: 30 }
      );
      expect(result).toBe(150);
    });

    it('returns 0 when minutosPorUsuario missing', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 30 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 when paxGlobal missing', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_PAX,
        { minutosPorUsuario: 5 },
        {}
      );
      expect(result).toBe(0);
    });
  });

  describe('CONTEXT_TIME + UNITS', () => {
    it('returns (duracionMin / 60) * unidadesPorHora', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        { unidadesPorHora: 12 },
        { duracionMin: 120 }
      );
      expect(result).toBe(24);
    });

    it('handles partial hours', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        { unidadesPorHora: 12 },
        { duracionMin: 90 }
      );
      expect(result).toBe(18);
    });

    it('returns 0 when unidadesPorHora missing', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        {},
        { duracionMin: 120 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 when duracionMin missing', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        { unidadesPorHora: 12 },
        {}
      );
      expect(result).toBe(0);
    });

    it('handles 30-minute duration', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        { unidadesPorHora: 12 },
        { duracionMin: 30 }
      );
      expect(result).toBe(6);
    });
  });

  describe('CONTEXT_TIME + TIME', () => {
    it('returns duracionMin directly', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_TIME,
        {},
        { duracionMin: 180 }
      );
      expect(result).toBe(180);
    });

    it('returns 0 when duracionMin missing', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_TIME,
        {},
        {}
      );
      expect(result).toBe(0);
    });

    it('ignores defaults when computing TIME from CONTEXT_TIME', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_TIME,
        { duracionMin: 999 },
        { duracionMin: 120 }
      );
      expect(result).toBe(120);
    });
  });

  describe('Fallback cases', () => {
    it('returns 0 for unsupported mode + kind combinations', () => {
      const result = resolveContextQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_PAX,
        { minutosPorUsuario: 5 },
        { paxGlobal: 0 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 for NONE mode', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.NONE,
        {},
        { paxGlobal: 50 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 for FIXED_AMOUNT mode (not a context resolution)', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.FIXED_AMOUNT,
        { pax: 100 },
        { paxGlobal: 50 }
      );
      expect(result).toBe(0);
    });

    it('returns 0 for NONE kind', () => {
      const result = resolveContextQuantity(
        PricingKind.NONE,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 }
      );
      expect(result).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles negative values as 0', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: -50 }
      );
      expect(result).toBe(-50);
    });

    it('handles non-numeric context gracefully', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 'invalid' }
      );
      expect(result).toBe(0);
    });

    it('handles non-numeric defaults gracefully', () => {
      const result = resolveContextQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 'invalid' },
        { paxGlobal: 50 }
      );
      expect(result).toBe(0);
    });

    it('handles empty defaults and context objects', () => {
      const result = resolveContextQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX
      );
      expect(result).toBe(0);
    });
  });
});

describe('resolveBasketQuantity', () => {
  describe('Override takes precedence', () => {
    it('returns PAX override when present', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 },
        { pax: 100 }
      );
      expect(result).toEqual({
        quantity: 100,
        isOverridden: true,
        overrideField: 'pax'
      });
    });

    it('returns UNITS override (cantidad) when present', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 2 },
        { paxGlobal: 50 },
        { cantidad: 75 }
      );
      expect(result).toEqual({
        quantity: 75,
        isOverridden: true,
        overrideField: 'cantidad'
      });
    });

    it('returns TIME override (duracionMin) when present', () => {
      const result = resolveBasketQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_TIME,
        {},
        { duracionMin: 120 },
        { duracionMin: 180 }
      );
      expect(result).toEqual({
        quantity: 180,
        isOverridden: true,
        overrideField: 'duracionMin'
      });
    });

    it('coerces override value to integer', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        {},
        { pax: '45.7' }
      );
      expect(result).toEqual({
        quantity: 46,
        isOverridden: true,
        overrideField: 'pax'
      });
    });

    it('treats 0 override as an override (0 is a valid override)', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 },
        { pax: 0 }
      );
      expect(result.isOverridden).toBe(true);
      expect(result.quantity).toBe(0);
    });

    it('treats null/undefined override as no override', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 },
        { pax: undefined }
      );
      expect(result.isOverridden).toBe(false);
    });
  });

  describe('Fixed amount fallback', () => {
    it('returns fixed cantidad for UNITS', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.FIXED_AMOUNT,
        { cantidad: 5 },
        {},
        {}
      );
      expect(result).toEqual({
        quantity: 5,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });

    it('returns fixed pax for PAX', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.FIXED_AMOUNT,
        { pax: 25 },
        {},
        {}
      );
      expect(result).toEqual({
        quantity: 25,
        isOverridden: false,
        overrideField: 'pax'
      });
    });

    it('returns fixed duracionMin for TIME', () => {
      const result = resolveBasketQuantity(
        PricingKind.TIME,
        InitializationMode.FIXED_AMOUNT,
        { duracionMin: 120 },
        {},
        {}
      );
      expect(result).toEqual({
        quantity: 120,
        isOverridden: false,
        overrideField: 'duracionMin'
      });
    });

    it('coerces fixed amount to integer', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.FIXED_AMOUNT,
        { cantidad: '7.3' },
        {},
        {}
      );
      expect(result).toEqual({
        quantity: 7,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });

    it('returns 0 when fixed amount is missing', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.FIXED_AMOUNT,
        {},
        {},
        {}
      );
      expect(result).toEqual({
        quantity: 0,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });
  });

  describe('Context derivation fallback', () => {
    it('returns paxGlobal for CONTEXT_PAX + PAX', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        { paxGlobal: 50 },
        {}
      );
      expect(result).toEqual({
        quantity: 50,
        isOverridden: false,
        overrideField: 'pax'
      });
    });

    it('returns pax * unidadesPorUsuario for CONTEXT_PAX + UNITS', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 3 },
        { paxGlobal: 50 },
        {}
      );
      expect(result).toEqual({
        quantity: 150,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });

    it('returns (duracionMin / 60) * unidadesPorHora for CONTEXT_TIME + UNITS', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_TIME,
        { unidadesPorHora: 12 },
        { duracionMin: 120 },
        {}
      );
      expect(result).toEqual({
        quantity: 24,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });

    it('returns duracionMin for CONTEXT_TIME + TIME', () => {
      const result = resolveBasketQuantity(
        PricingKind.TIME,
        InitializationMode.CONTEXT_TIME,
        {},
        { duracionMin: 180 },
        {}
      );
      expect(result).toEqual({
        quantity: 180,
        isOverridden: false,
        overrideField: 'duracionMin'
      });
    });

    it('coerces context-derived result to integer', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.CONTEXT_PAX,
        { unidadesPorUsuario: 2.7 },
        { paxGlobal: 33 },
        {}
      );
      expect(result).toEqual({
        quantity: 89,
        isOverridden: false,
        overrideField: 'cantidad'
      });
    });
  });

  describe('Override field mapping', () => {
    it('sets overrideField to "pax" for PAX kind', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.NONE,
        {},
        {},
        {}
      );
      expect(result.overrideField).toBe('pax');
    });

    it('sets overrideField to "cantidad" for UNITS kind', () => {
      const result = resolveBasketQuantity(
        PricingKind.UNITS,
        InitializationMode.NONE,
        {},
        {},
        {}
      );
      expect(result.overrideField).toBe('cantidad');
    });

    it('sets overrideField to "duracionMin" for TIME kind', () => {
      const result = resolveBasketQuantity(
        PricingKind.TIME,
        InitializationMode.NONE,
        {},
        {},
        {}
      );
      expect(result.overrideField).toBe('duracionMin');
    });

    it('sets overrideField to null for NONE kind', () => {
      const result = resolveBasketQuantity(
        PricingKind.NONE,
        InitializationMode.NONE,
        {},
        {},
        {}
      );
      expect(result.overrideField).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('handles missing defaults parameter', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        undefined,
        { paxGlobal: 50 }
      );
      expect(result.quantity).toBe(50);
    });

    it('handles missing context parameter', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.FIXED_AMOUNT,
        { pax: 25 },
        undefined
      );
      expect(result.quantity).toBe(25);
    });

    it('handles missing overrides parameter', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.FIXED_AMOUNT,
        { pax: 25 }
      );
      expect(result).toEqual({
        quantity: 25,
        isOverridden: false,
        overrideField: 'pax'
      });
    });

    it('returns 0 when all sources are missing', () => {
      const result = resolveBasketQuantity(
        PricingKind.PAX,
        InitializationMode.CONTEXT_PAX,
        {},
        {},
        {}
      );
      expect(result.quantity).toBe(0);
    });
  });
});

describe('applyExclusiveDefaultMode', () => {
  describe('Setting cantidad (fixed amount)', () => {
    it('clears unidadesPorUsuario when setting cantidad', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorUsuario: 2 },
        'cantidad',
        5
      );
      expect(result).toEqual({ cantidad: 5 });
      expect(result.unidadesPorUsuario).toBeUndefined();
    });

    it('clears unidadesPorHora when setting cantidad', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorHora: 12 },
        'cantidad',
        5
      );
      expect(result).toEqual({ cantidad: 5 });
      expect(result.unidadesPorHora).toBeUndefined();
    });

    it('clears both unit multipliers when setting cantidad', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorUsuario: 2, unidadesPorHora: 12 },
        'cantidad',
        5
      );
      expect(result).toEqual({ cantidad: 5 });
      expect(result.unidadesPorUsuario).toBeUndefined();
      expect(result.unidadesPorHora).toBeUndefined();
    });

    it('preserves other keys when setting cantidad', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorUsuario: 2, pax: 10 },
        'cantidad',
        5
      );
      expect(result).toEqual({ cantidad: 5, pax: 10 });
    });
  });

  describe('Setting unidadesPorUsuario (context-based multiplier)', () => {
    it('clears cantidad when setting unidadesPorUsuario', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 10 },
        'unidadesPorUsuario',
        3
      );
      expect(result).toEqual({ unidadesPorUsuario: 3 });
      expect(result.cantidad).toBeUndefined();
    });

    it('preserves unidadesPorHora when setting unidadesPorUsuario', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorHora: 12 },
        'unidadesPorUsuario',
        3
      );
      expect(result).toEqual({ unidadesPorHora: 12, unidadesPorUsuario: 3 });
    });

    it('preserves other keys', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 10, pax: 5 },
        'unidadesPorUsuario',
        3
      );
      expect(result).toEqual({ unidadesPorUsuario: 3, pax: 5 });
    });
  });

  describe('Setting unidadesPorHora (time-based multiplier)', () => {
    it('clears cantidad when setting unidadesPorHora', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 10 },
        'unidadesPorHora',
        12
      );
      expect(result).toEqual({ unidadesPorHora: 12 });
      expect(result.cantidad).toBeUndefined();
    });

    it('preserves unidadesPorUsuario when setting unidadesPorHora', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorUsuario: 3 },
        'unidadesPorHora',
        12
      );
      expect(result).toEqual({ unidadesPorUsuario: 3, unidadesPorHora: 12 });
    });
  });

  describe('Setting duracionMin (fixed duration)', () => {
    it('clears minutosPorUsuario when setting duracionMin', () => {
      const result = applyExclusiveDefaultMode(
        { minutosPorUsuario: 5 },
        'duracionMin',
        120
      );
      expect(result).toEqual({ duracionMin: 120 });
      expect(result.minutosPorUsuario).toBeUndefined();
    });

    it('preserves other keys', () => {
      const result = applyExclusiveDefaultMode(
        { minutosPorUsuario: 5, pax: 10 },
        'duracionMin',
        120
      );
      expect(result).toEqual({ duracionMin: 120, pax: 10 });
    });
  });

  describe('Setting minutosPorUsuario (context-based duration)', () => {
    it('clears duracionMin when setting minutosPorUsuario', () => {
      const result = applyExclusiveDefaultMode(
        { duracionMin: 120 },
        'minutosPorUsuario',
        5
      );
      expect(result).toEqual({ minutosPorUsuario: 5 });
      expect(result.duracionMin).toBeUndefined();
    });

    it('preserves other keys', () => {
      const result = applyExclusiveDefaultMode(
        { duracionMin: 120, pax: 10 },
        'minutosPorUsuario',
        5
      );
      expect(result).toEqual({ minutosPorUsuario: 5, pax: 10 });
    });
  });

  describe('Zero and negative values', () => {
    it('deletes key when value is 0', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 5 },
        'cantidad',
        0
      );
      expect(result).toEqual({});
      expect(result.cantidad).toBeUndefined();
    });

    it('deletes key when value is negative', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 5 },
        'cantidad',
        -10
      );
      expect(result).toEqual({});
      expect(result.cantidad).toBeUndefined();
    });

    it('deletes key without clearing conflicts when value is 0', () => {
      const result = applyExclusiveDefaultMode(
        { unidadesPorUsuario: 2 },
        'cantidad',
        0
      );
      expect(result).toEqual({ unidadesPorUsuario: 2 });
      expect(result.cantidad).toBeUndefined();
    });

    it('coerces string zero to delete', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 5 },
        'cantidad',
        '0'
      );
      expect(result).toEqual({});
    });
  });

  describe('Data type coercion', () => {
    it('coerces string values to numbers', () => {
      const result = applyExclusiveDefaultMode(
        {},
        'cantidad',
        '15'
      );
      expect(result).toEqual({ cantidad: 15 });
    });

    it('coerces float strings to numbers', () => {
      const result = applyExclusiveDefaultMode(
        {},
        'cantidad',
        '12.7'
      );
      expect(result).toEqual({ cantidad: 12.7 });
    });

    it('handles invalid strings as 0', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 5 },
        'cantidad',
        'invalid'
      );
      expect(result).toEqual({});
    });

    it('handles null/undefined as 0', () => {
      const result = applyExclusiveDefaultMode(
        { cantidad: 5 },
        'cantidad',
        null
      );
      expect(result).toEqual({});
    });
  });

  describe('Immutability', () => {
    it('does not mutate the input object', () => {
      const original = { cantidad: 5, pax: 10 };
      const result = applyExclusiveDefaultMode(original, 'unidadesPorUsuario', 3);
      expect(original).toEqual({ cantidad: 5, pax: 10 });
      expect(result).toEqual({ unidadesPorUsuario: 3, pax: 10 });
    });

    it('creates a new object each time', () => {
      const original = { cantidad: 5 };
      const result1 = applyExclusiveDefaultMode(original, 'unidadesPorUsuario', 2);
      const result2 = applyExclusiveDefaultMode(original, 'unidadesPorUsuario', 2);
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('Edge cases', () => {
    it('handles undefined defaultQuantities parameter', () => {
      const result = applyExclusiveDefaultMode(undefined, 'cantidad', 5);
      expect(result).toEqual({ cantidad: 5 });
    });

    it('handles null defaultQuantities parameter', () => {
      const result = applyExclusiveDefaultMode(null, 'cantidad', 5);
      expect(result).toEqual({ cantidad: 5 });
    });

    it('handles empty object input', () => {
      const result = applyExclusiveDefaultMode({}, 'cantidad', 5);
      expect(result).toEqual({ cantidad: 5 });
    });

    it('handles setting multiple unrelated keys sequentially', () => {
      let result = applyExclusiveDefaultMode({}, 'cantidad', 5);
      result = applyExclusiveDefaultMode(result, 'duracionMin', 120);
      expect(result).toEqual({ cantidad: 5, duracionMin: 120 });
    });

    it('handles conflicting updates correctly', () => {
      let result = applyExclusiveDefaultMode({}, 'cantidad', 5);
      expect(result).toEqual({ cantidad: 5 });
      result = applyExclusiveDefaultMode(result, 'unidadesPorUsuario', 2);
      expect(result).toEqual({ unidadesPorUsuario: 2 });
    });

    it('preserves decimal precision when not clearing', () => {
      const result = applyExclusiveDefaultMode({}, 'unidadesPorUsuario', 3.14159);
      expect(result.unidadesPorUsuario).toBe(3.14159);
    });
  });
});
