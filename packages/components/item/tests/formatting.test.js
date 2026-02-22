import { describe, it, expect } from 'vitest';
import {
  money,
  formatCatalogTerms,
  policyHint,
  legendForBasket,
  profileHumanText,
  lineRateLabel
} from '../domain/formatting.js';
import { PricingKind, InitializationMode } from '../domain/pricing.js';

describe('money', () => {
  it('should format 0 as "$0"', () => {
    expect(money(0)).toBe('$0');
  });

  it('should format 1500 as "$1.500" (Chilean locale)', () => {
    expect(money(1500)).toBe('$1.500');
  });

  it('should format 1000000 as "$1.000.000"', () => {
    expect(money(1000000)).toBe('$1.000.000');
  });

  it('should handle decimal values by rounding', () => {
    expect(money(1500.7)).toBe('$1.501');
  });

  it('should handle decimal values rounding down', () => {
    expect(money(1500.4)).toBe('$1.500');
  });

  it('should handle negative values', () => {
    expect(money(-500)).toBe('$-500');
  });

  it('should handle string numbers', () => {
    expect(money('2000')).toBe('$2.000');
  });

  it('should handle invalid input as $0', () => {
    expect(money(null)).toBe('$0');
    expect(money(undefined)).toBe('$0');
    expect(money('invalid')).toBe('$0');
  });
});

describe('formatCatalogTerms', () => {
  describe('when kind is NONE', () => {
    it('should return "$0" when base is 0', () => {
      const result = formatCatalogTerms(0, PricingKind.NONE, InitializationMode.NONE, 0, {});
      expect(result).toBe('$0');
    });

    it('should return formatted base when base > 0', () => {
      const result = formatCatalogTerms(500, PricingKind.NONE, InitializationMode.NONE, 0, {});
      expect(result).toBe('$500 fijo');
    });

    it('should ignore rate when kind is NONE', () => {
      const result = formatCatalogTerms(100, PricingKind.NONE, InitializationMode.NONE, 1000, {});
      expect(result).toBe('$100 fijo');
    });
  });

  describe('when kind is PAX', () => {
    it('should use FIXED_AMOUNT mode with default pax count', () => {
      const result = formatCatalogTerms(400, PricingKind.PAX, InitializationMode.FIXED_AMOUNT, 1000, { pax: 3 });
      expect(result).toBe('$400 fijo + 3 pax x $1.000');
    });

    it('should use per-pax rate without base', () => {
      const result = formatCatalogTerms(0, PricingKind.PAX, InitializationMode.CONTEXT_PAX, 1000, {});
      expect(result).toBe('$1.000 por pax');
    });

    it('should include per-pax rate with base', () => {
      const result = formatCatalogTerms(500, PricingKind.PAX, InitializationMode.CONTEXT_PAX, 1000, {});
      expect(result).toBe('$500 fijo + $1.000 por pax');
    });

    it('should handle decimal pax defaults by rounding', () => {
      const result = formatCatalogTerms(0, PricingKind.PAX, InitializationMode.FIXED_AMOUNT, 1000, { pax: 2.5 });
      expect(result).toBe('3 pax x $1.000');
    });
  });

  describe('when kind is UNITS', () => {
    it('should use FIXED_AMOUNT mode with cantidad', () => {
      const result = formatCatalogTerms(0, PricingKind.UNITS, InitializationMode.FIXED_AMOUNT, 100, { cantidad: 5 });
      expect(result).toBe('5 und x $100');
    });

    it('should use CONTEXT_PAX mode with unidades per user', () => {
      const result = formatCatalogTerms(200, PricingKind.UNITS, InitializationMode.CONTEXT_PAX, 50, { unidadesPorUsuario: 3 });
      expect(result).toBe('$200 fijo + 3 und/pax x $50');
    });

    it('should use CONTEXT_TIME mode with unidades per hour', () => {
      const result = formatCatalogTerms(0, PricingKind.UNITS, InitializationMode.CONTEXT_TIME, 75, { unidadesPorHora: 2.5 });
      expect(result).toBe('2.5 und/h x $75');
    });

    it('should use CONTEXT_TIME mode with 0 unidades per hour', () => {
      const result = formatCatalogTerms(100, PricingKind.UNITS, InitializationMode.CONTEXT_TIME, 50, {});
      expect(result).toBe('$100 fijo + 0 und/h x $50');
    });
  });

  describe('when kind is TIME', () => {
    it('should use FIXED_AMOUNT mode with duration minutes', () => {
      const result = formatCatalogTerms(500, PricingKind.TIME, InitializationMode.FIXED_AMOUNT, 10, { duracionMin: 120 });
      expect(result).toBe('$500 fijo + 120 min x $10');
    });

    it('should use CONTEXT_PAX mode with minutes per user', () => {
      const result = formatCatalogTerms(0, PricingKind.TIME, InitializationMode.CONTEXT_PAX, 5, { minutosPorUsuario: 30 });
      expect(result).toBe('30 min/pax x $5');
    });

    it('should use CONTEXT_TIME mode as fallback', () => {
      const result = formatCatalogTerms(200, PricingKind.TIME, InitializationMode.CONTEXT_TIME, 2, {});
      expect(result).toBe('$200 fijo + $2 por minuto');
    });

    it('should handle decimal minutes', () => {
      const result = formatCatalogTerms(0, PricingKind.TIME, InitializationMode.CONTEXT_PAX, 1, { minutosPorUsuario: 15.5 });
      expect(result).toBe('15.5 min/pax x $1');
    });
  });

  describe('edge cases', () => {
    it('should handle zero rate', () => {
      const result = formatCatalogTerms(100, PricingKind.PAX, InitializationMode.FIXED_AMOUNT, 0, { pax: 10 });
      expect(result).toBe('$100 fijo + 10 pax x $0');
    });

    it('should handle zero base with variable pricing', () => {
      const result = formatCatalogTerms(0, PricingKind.PAX, InitializationMode.FIXED_AMOUNT, 500, { pax: 2 });
      expect(result).toBe('2 pax x $500');
    });

    it('should handle missing defaults object', () => {
      const result = formatCatalogTerms(100, PricingKind.PAX, InitializationMode.FIXED_AMOUNT, 50, {});
      expect(result).toBe('$100 fijo + 0 pax x $50');
    });
  });
});

describe('policyHint', () => {
  describe('when kind is UNITS', () => {
    it('should return hint for CONTEXT_PAX mode', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_PAX, { unidadesPorUsuario: 3 });
      expect(result).toBe('3 und/persona');
    });

    it('should return hint for CONTEXT_TIME mode', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_TIME, { unidadesPorHora: 2.5 });
      expect(result).toBe('2.5 und/hora');
    });

    it('should return empty string for FIXED_AMOUNT mode', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.FIXED_AMOUNT, { cantidad: 5 });
      expect(result).toBe('');
    });

    it('should return empty string for NONE mode', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.NONE, {});
      expect(result).toBe('');
    });
  });

  describe('when kind is TIME', () => {
    it('should return hint for CONTEXT_PAX mode', () => {
      const result = policyHint(PricingKind.TIME, InitializationMode.CONTEXT_PAX, { minutosPorUsuario: 10 });
      expect(result).toBe('10 min/persona');
    });

    it('should return empty string for FIXED_AMOUNT mode', () => {
      const result = policyHint(PricingKind.TIME, InitializationMode.FIXED_AMOUNT, { duracionMin: 60 });
      expect(result).toBe('');
    });

    it('should return empty string for CONTEXT_TIME mode', () => {
      const result = policyHint(PricingKind.TIME, InitializationMode.CONTEXT_TIME, {});
      expect(result).toBe('');
    });
  });

  describe('when kind is PAX or NONE', () => {
    it('should return empty string for PAX kind', () => {
      const result = policyHint(PricingKind.PAX, InitializationMode.FIXED_AMOUNT, { pax: 3 });
      expect(result).toBe('');
    });

    it('should return empty string for NONE kind', () => {
      const result = policyHint(PricingKind.NONE, InitializationMode.NONE, {});
      expect(result).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle missing defaults', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_PAX);
      expect(result).toBe('0 und/persona');
    });

    it('should handle zero values', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_PAX, { unidadesPorUsuario: 0 });
      expect(result).toBe('0 und/persona');
    });

    it('should handle decimal values', () => {
      const result = policyHint(PricingKind.UNITS, InitializationMode.CONTEXT_TIME, { unidadesPorHora: 2.75 });
      expect(result).toBe('2.75 und/hora');
    });
  });
});

describe('legendForBasket', () => {
  describe('when kind is NONE', () => {
    it('should return fixed base cost only', () => {
      const result = legendForBasket(500, PricingKind.NONE, 0, 0, 500);
      expect(result).toBe('$500 fijo');
    });

    it('should ignore quantity and rate', () => {
      const result = legendForBasket(1000, PricingKind.NONE, 100, 50, 1000);
      expect(result).toBe('$1.000 fijo');
    });
  });

  describe('when kind is PAX', () => {
    it('should show base + pax calculation = total', () => {
      const result = legendForBasket(400, PricingKind.PAX, 50, 1000, 51400);
      expect(result).toBe('$400 + (50 pax x $1.000) = $51.400');
    });

    it('should format large numbers with thousands separator', () => {
      const result = legendForBasket(0, PricingKind.PAX, 100, 5000, 500000);
      expect(result).toBe('$0 + (100 pax x $5.000) = $500.000');
    });
  });

  describe('when kind is UNITS', () => {
    it('should show base + units calculation = total', () => {
      const result = legendForBasket(200, PricingKind.UNITS, 30, 100, 3200);
      expect(result).toBe('$200 + (30 und x $100) = $3.200');
    });

    it('should handle zero base', () => {
      const result = legendForBasket(0, PricingKind.UNITS, 5, 50, 250);
      expect(result).toBe('$0 + (5 und x $50) = $250');
    });
  });

  describe('when kind is TIME', () => {
    it('should show base + minutes calculation = total', () => {
      const result = legendForBasket(300, PricingKind.TIME, 120, 10, 1500);
      expect(result).toBe('$300 + (120 min x $10) = $1.500');
    });

    it('should handle decimal quantities', () => {
      const result = legendForBasket(0, PricingKind.TIME, 45.5, 20, 910);
      expect(result).toBe('$0 + (45.5 min x $20) = $910');
    });
  });

  describe('edge cases', () => {
    it('should handle very large totals', () => {
      const result = legendForBasket(0, PricingKind.PAX, 500, 10000, 5000000);
      expect(result).toBe('$0 + (500 pax x $10.000) = $5.000.000');
    });

    it('should handle zero rate', () => {
      const result = legendForBasket(100, PricingKind.UNITS, 20, 0, 100);
      expect(result).toBe('$100 + (20 und x $0) = $100');
    });

    it('should handle zero quantity', () => {
      const result = legendForBasket(500, PricingKind.PAX, 0, 1000, 500);
      expect(result).toBe('$500 + (0 pax x $1.000) = $500');
    });

    it('should display total even if mismatch with calculation', () => {
      // The function just displays what is passed; doesn't recalculate
      const result = legendForBasket(100, PricingKind.PAX, 50, 100, 9999);
      expect(result).toBe('$100 + (50 pax x $100) = $9.999');
    });
  });
});

describe('profileHumanText', () => {
  describe('when kind is NONE', () => {
    it('should return "$0" when base is 0', () => {
      const result = profileHumanText(0, PricingKind.NONE, 0);
      expect(result).toBe('$0');
    });

    it('should return fixed base when base > 0', () => {
      const result = profileHumanText(500, PricingKind.NONE, 0);
      expect(result).toBe('$500 fijo');
    });
  });

  describe('when kind is PAX', () => {
    it('should show base + per-pax rate', () => {
      const result = profileHumanText(400, PricingKind.PAX, 1000);
      expect(result).toBe('$400 fijo + $1.000 por pax');
    });

    it('should show only per-pax rate when base is 0', () => {
      const result = profileHumanText(0, PricingKind.PAX, 500);
      expect(result).toBe('$500 por pax');
    });

    it('should show only base when rate is 0', () => {
      const result = profileHumanText(300, PricingKind.PAX, 0);
      expect(result).toBe('$300 fijo');
    });

    it('should return "$0" when both are 0', () => {
      const result = profileHumanText(0, PricingKind.PAX, 0);
      expect(result).toBe('$0');
    });
  });

  describe('when kind is UNITS', () => {
    it('should show base + per-unit rate', () => {
      const result = profileHumanText(100, PricingKind.UNITS, 50);
      expect(result).toBe('$100 fijo + $50 por unidad');
    });

    it('should show only per-unit rate when base is 0', () => {
      const result = profileHumanText(0, PricingKind.UNITS, 250);
      expect(result).toBe('$250 por unidad');
    });
  });

  describe('when kind is TIME', () => {
    it('should show base + per-minute rate', () => {
      const result = profileHumanText(200, PricingKind.TIME, 15);
      expect(result).toBe('$200 fijo + $15 por minuto');
    });

    it('should show only per-minute rate when base is 0', () => {
      const result = profileHumanText(0, PricingKind.TIME, 10);
      expect(result).toBe('$10 por minuto');
    });
  });

  describe('edge cases', () => {
    it('should handle large values', () => {
      const result = profileHumanText(1000000, PricingKind.PAX, 5000);
      expect(result).toBe('$1.000.000 fijo + $5.000 por pax');
    });

    it('should handle decimal rates by rounding', () => {
      const result = profileHumanText(100, PricingKind.PAX, 123.5);
      expect(result).toBe('$100 fijo + $124 por pax');
    });

    it('should handle string inputs by coercion', () => {
      const result = profileHumanText('200', PricingKind.UNITS, '50');
      expect(result).toBe('$200 fijo + $50 por unidad');
    });
  });
});

describe('lineRateLabel', () => {
  it('should return "Pax" for PAX kind', () => {
    expect(lineRateLabel(PricingKind.PAX)).toBe('Pax');
  });

  it('should return "Unidades" for UNITS kind', () => {
    expect(lineRateLabel(PricingKind.UNITS)).toBe('Unidades');
  });

  it('should return "Duracion" for TIME kind', () => {
    expect(lineRateLabel(PricingKind.TIME)).toBe('Duracion');
  });

  it('should return "Cantidad" for NONE kind', () => {
    expect(lineRateLabel(PricingKind.NONE)).toBe('Cantidad');
  });

  it('should return "Cantidad" for unknown kind', () => {
    expect(lineRateLabel('UNKNOWN')).toBe('Cantidad');
  });

  it('should return "Cantidad" for null or undefined', () => {
    expect(lineRateLabel(null)).toBe('Cantidad');
    expect(lineRateLabel(undefined)).toBe('Cantidad');
  });
});
