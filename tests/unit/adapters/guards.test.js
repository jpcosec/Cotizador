import { describe, it, expect } from 'vitest';
import { guards } from '../../../src/Orchestration/adapters/guards.js';

describe('Guards', () => {
  describe('canMutateBasket', () => {
    it('returns false when quotation is null', () => {
      const context = {
        quotation: null,
        lineas: [],
        errors: [],
      };
      const result = guards.canMutateBasket({ context });
      expect(result).toBe(false);
    });

    it('returns true when quotation is initialized', () => {
      const context = {
        quotation: { cotizacion: { ID_Cotizacion: 'COT_001' } },
        lineas: [],
        errors: [],
      };
      const result = guards.canMutateBasket({ context });
      expect(result).toBe(true);
    });

    it('returns true even with empty lineas', () => {
      const context = {
        quotation: {},
        lineas: [],
        errors: [],
      };
      const result = guards.canMutateBasket({ context });
      expect(result).toBe(true);
    });

    it('returns true with errors (mutation is still allowed)', () => {
      const context = {
        quotation: {},
        lineas: [],
        errors: [{ message: 'some error' }],
      };
      const result = guards.canMutateBasket({ context });
      expect(result).toBe(true);
    });
  });

  describe('canAdvanceToValidation', () => {
    it('returns false when quotation is null', () => {
      const context = {
        quotation: null,
        lineas: [{ ID_Linea: 'L1' }],
        errors: [],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(false);
    });

    it('returns false when lineas is empty', () => {
      const context = {
        quotation: {},
        lineas: [],
        errors: [],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(false);
    });

    it('returns false with one blocking error', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [{ blocking: true, message: 'Price error' }],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(false);
    });

    it('returns false with multiple errors including one blocking', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [
          { blocking: false, message: 'warning' },
          { blocking: true, message: 'error' },
          { blocking: false, message: 'info' },
        ],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(false);
    });

    it('returns true with items and no blocking errors', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }, { ID_Linea: 'L2' }],
        errors: [{ blocking: false, message: 'warning only' }],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(true);
    });

    it('returns true with items and empty errors', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(true);
    });

    it('returns true with multiple items and no errors', () => {
      const context = {
        quotation: {},
        lineas: [
          { ID_Linea: 'L1', _netoBase: 100000 },
          { ID_Linea: 'L2', _netoBase: 200000 },
          { ID_Linea: 'L3', _netoBase: 150000 },
        ],
        errors: [],
      };
      const result = guards.canAdvanceToValidation({ context });
      expect(result).toBe(true);
    });
  });

  describe('canSaveQuotation', () => {
    it('returns false when quotation is null', () => {
      const context = {
        quotation: null,
        lineas: [{ ID_Linea: 'L1' }],
        errors: [],
      };
      const result = guards.canSaveQuotation({ context });
      expect(result).toBe(false);
    });

    it('returns false when lineas is empty', () => {
      const context = {
        quotation: {},
        lineas: [],
        errors: [],
      };
      const result = guards.canSaveQuotation({ context });
      expect(result).toBe(false);
    });

    it('returns false with blocking error', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [{ blocking: true, message: 'validation failed' }],
      };
      const result = guards.canSaveQuotation({ context });
      expect(result).toBe(false);
    });

    it('returns true with items and no blocking errors', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [],
      };
      const result = guards.canSaveQuotation({ context });
      expect(result).toBe(true);
    });

    it('returns true with non-blocking warnings', () => {
      const context = {
        quotation: {},
        lineas: [{ ID_Linea: 'L1' }],
        errors: [
          { blocking: false, message: 'warning 1' },
          { blocking: false, message: 'warning 2' },
        ],
      };
      const result = guards.canSaveQuotation({ context });
      expect(result).toBe(true);
    });
  });
});
