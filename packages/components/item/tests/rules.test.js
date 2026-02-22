import { describe, it, expect } from 'vitest';
import { evaluateRules } from '../domain/rules.js';

describe('evaluateRules()', () => {
  describe('Empty rules', () => {
    it('should return available=true and empty appliedRules when rules array is empty', () => {
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules([], snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should return available=true and empty appliedRules when rules is undefined', () => {
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(undefined, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should handle null rules in array gracefully', () => {
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules([null, null], snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });
  });

  describe('Inactive rules', () => {
    it('should skip rules where active=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: false,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should skip all inactive rules even if some would trigger', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: false,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: false,
          blocking: true,
          label: 'Min 10 pax',
          value: 10
        }
      ];
      const snapshot = {
        quantities: { pax: 5, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should only skip rules with active=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: false,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 10 pax',
          value: 10
        }
      ];
      const snapshot = {
        quantities: { pax: 5, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 10 pax');
      expect(result.available).toBe(false);
    });
  });

  describe('MAX_PAX rule', () => {
    it('should not trigger when pax equals max value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 100, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should not trigger when pax is below max value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 75, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should trigger when pax exceeds max value with blocking=true', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.available).toBe(false);
    });

    it('should trigger but not block when pax exceeds max and blocking=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: false,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.available).toBe(true);
    });

    it('should use default label when not provided', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('MAX_PAX violated');
      expect(result.available).toBe(false);
    });

    it('should handle string pax value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: '150', cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.available).toBe(false);
    });

    it('should handle string value in rule', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: '100'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.available).toBe(false);
    });
  });

  describe('MIN_PAX rule', () => {
    it('should not trigger when pax equals min value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 20, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should not trigger when pax is above min value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 100, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should trigger when pax is below min value with blocking=true', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 10, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 20 pax');
      expect(result.available).toBe(false);
    });

    it('should trigger but not block when pax is below min and blocking=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: false,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 10, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 20 pax');
      expect(result.available).toBe(true);
    });

    it('should use default label when not provided', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 10, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('MIN_PAX violated');
      expect(result.available).toBe(false);
    });

    it('should handle string pax value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: '10', cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 20 pax');
      expect(result.available).toBe(false);
    });

    it('should handle string value in rule', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: '20'
        }
      ];
      const snapshot = {
        quantities: { pax: 10, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 20 pax');
      expect(result.available).toBe(false);
    });
  });

  describe('ONLY_HOUR_RANGE rule', () => {
    it('should not trigger when hora is within range (inclusive)', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should not trigger when hora equals min time', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '09:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should not trigger when hora equals max time', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '18:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should trigger when hora is before min time with blocking=true', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '08:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(false);
    });

    it('should trigger when hora is after max time with blocking=true', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '19:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(false);
    });

    it('should trigger but not block when hora is out of range and blocking=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: false,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(true);
    });

    it('should use default label when not provided', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('hour out of range');
      expect(result.available).toBe(false);
    });

    it('should default to 00:00 when min is not provided', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only until 18:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '10:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should default to 23:59 when max is not provided', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'From 09:00',
          min: '09:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should trigger when hora is missing (defaults to 00:00, which is before min)', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(false);
    });
  });

  describe('Non-blocking rules', () => {
    it('should add non-blocking rule to appliedRules without setting available=false', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: false,
          label: 'Warning: Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Warning: Max 100 pax');
      expect(result.available).toBe(true);
    });

    it('should allow multiple non-blocking rules without blocking', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: false,
          label: 'Warning: Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: false,
          label: 'Warning: Peak hours',
          min: '12:00',
          max: '14:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '15:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Warning: Max 100 pax');
      expect(result.appliedRules).toContain('Warning: Peak hours');
      expect(result.available).toBe(true);
    });
  });

  describe('Multiple rules simultaneously', () => {
    it('should apply multiple rules and combine results', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.appliedRules).not.toContain('Min 20 pax');
      expect(result.available).toBe(false);
    });

    it('should apply both MAX_PAX and ONLY_HOUR_RANGE if both violate', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(false);
    });

    it('should apply all three rule types if all violate', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: true,
          blocking: false,
          label: 'Min 20 pax (warning)',
          value: 20
        },
        {
          id: 'rule3',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 100 pax');
      expect(result.appliedRules).not.toContain('Min 20 pax (warning)');
      expect(result.appliedRules).toContain('Only 09:00-18:00');
      expect(result.available).toBe(false);
    });

    it('should evaluate all rules even after finding blocking violation', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        },
        {
          id: 'rule2',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules.length).toBe(2);
      expect(result.available).toBe(false);
    });

    it('should preserve order of applied rules', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'First rule',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Second rule',
          value: 20
        },
        {
          id: 'rule3',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Third rule',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '20:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules[0]).toBe('First rule');
      expect(result.appliedRules[1]).toBe('Third rule');
    });

    it('should mix blocking and non-blocking rules correctly', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: false,
          label: 'Warning: Max exceeded',
          value: 100
        },
        {
          id: 'rule2',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax required',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Warning: Max exceeded');
      expect(result.appliedRules).not.toContain('Min 20 pax required');
      expect(result.available).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle rules with undefined active property', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: undefined,
          blocking: true,
          label: 'Max 100 pax',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should handle unknown rule type silently', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'UNKNOWN_TYPE',
          active: true,
          blocking: true,
          label: 'Unknown rule',
          value: 100
        }
      ];
      const snapshot = {
        quantities: { pax: 150, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result).toEqual({ available: true, appliedRules: [] });
    });

    it('should handle very large pax values', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MAX_PAX',
          active: true,
          blocking: true,
          label: 'Max 1000 pax',
          value: 1000
        }
      ];
      const snapshot = {
        quantities: { pax: 999999, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Max 1000 pax');
      expect(result.available).toBe(false);
    });

    it('should handle zero pax value', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'MIN_PAX',
          active: true,
          blocking: true,
          label: 'Min 20 pax',
          value: 20
        }
      ];
      const snapshot = {
        quantities: { pax: 0, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Min 20 pax');
      expect(result.available).toBe(false);
    });

    it('should handle time in different formats (with/without leading zero)', () => {
      const rules = [
        {
          id: 'rule1',
          type: 'ONLY_HOUR_RANGE',
          active: true,
          blocking: true,
          label: 'Only 09:00-18:00',
          min: '09:00',
          max: '18:00'
        }
      ];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '9:00' }
      };
      const result = evaluateRules(rules, snapshot);
      expect(result.appliedRules).toContain('Only 09:00-18:00');
    });

    it('should return new array instance for appliedRules each call', () => {
      const rules = [];
      const snapshot = {
        quantities: { pax: 50, cantidad: 10, duracionMin: 120 },
        schedule: { dia: '2026-02-22', hora: '14:00' }
      };
      const result1 = evaluateRules(rules, snapshot);
      const result2 = evaluateRules(rules, snapshot);
      expect(result1.appliedRules).not.toBe(result2.appliedRules);
      expect(result1.appliedRules).toEqual(result2.appliedRules);
    });
  });
});
