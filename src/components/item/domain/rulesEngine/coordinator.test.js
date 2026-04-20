import { describe, it, expect } from 'vitest';
import { RulesCoordinator } from './coordinator.js';

describe('RulesCoordinator', () => {
  describe('constructor - filtering', () => {
    it('filters rules by componentType', () => {
      const allRules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        },
        {
          ID_Regla: 'R2',
          Scope: 'CATEGORY',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules).toHaveLength(1);
      expect(coord.rules[0].ID_Regla).toBe('R1');
    });

    it('skips inactive rules', () => {
      const allRules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        },
        {
          ID_Regla: 'R2',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: false
        }
      ];

      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules).toHaveLength(1);
      expect(coord.rules[0].ID_Regla).toBe('R1');
    });

    it('sorts by priority (lower first)', () => {
      const allRules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 30,
          Activo: true
        },
        {
          ID_Regla: 'R2',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 10,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', allRules);
      expect(coord.rules[0].ID_Regla).toBe('R2');
      expect(coord.rules[1].ID_Regla).toBe('R1');
    });

    it('handles empty rules array', () => {
      const coord = new RulesCoordinator('ITEM', []);
      expect(coord.rules).toHaveLength(0);
    });

    it('handles null/undefined rules', () => {
      const coord = new RulesCoordinator('ITEM', null);
      expect(coord.rules).toHaveLength(0);
    });
  });

  describe('evaluate - simple conditions', () => {
    it('evaluates true condition', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Always triggered' },
          Prioridad: 1,
          Activo: true,
          Nombre: 'Always Rule'
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules).toHaveLength(1);
      expect(result.available).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('evaluates false condition', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: false,
          Payload_JSON: { message: 'Never triggered' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules).toHaveLength(0);
      expect(result.available).toBe(true);
    });

    it('handles no condition (undefined = true)', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: undefined,
          Payload_JSON: { message: 'No condition' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules).toHaveLength(1);
      expect(result.available).toBe(false);
    });
  });

  // Snapshots must use the item.* namespace matching REGLAS_NEGOCIO.csv var paths
  describe('evaluate - JSON-Logic conditions (item.* namespace)', () => {
    it('evaluates greater than condition against item.pax', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: { '>': [{ var: 'item.pax' }, 100] },
          Payload_JSON: { message: 'Too many pax' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);

      let result = coord.evaluate({ item: { pax: 150 } });
      expect(result.appliedRules).toHaveLength(1);
      expect(result.available).toBe(false);

      coord.invalidateCache();

      result = coord.evaluate({ item: { pax: 50 } });
      expect(result.appliedRules).toHaveLength(0);
      expect(result.available).toBe(true);
    });

    it('evaluates AND condition with item.id guard (real CSV pattern)', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: {
            and: [
              { '===': [{ var: 'item.id' }, 'ITEM_SALON'] },
              { '>':   [{ var: 'item.pax'    }, 320         ] }
            ]
          },
          Payload_JSON: { message: 'Max 320 pax' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);

      // Matches: correct item + pax exceeded
      let result = coord.evaluate({ item: { id: 'ITEM_SALON', pax: 400 } });
      expect(result.appliedRules).toHaveLength(1);

      coord.invalidateCache();

      // No match: different item
      result = coord.evaluate({ item: { id: 'ITEM_OTHER', pax: 400 } });
      expect(result.appliedRules).toHaveLength(0);

      coord.invalidateCache();

      // No match: pax within limit
      result = coord.evaluate({ item: { id: 'ITEM_SALON', pax: 100 } });
      expect(result.appliedRules).toHaveLength(0);
    });

    it('evaluates OR condition against item.hora', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'WARNING',
          Condicion_JSON: {
            or: [
              { '<': [{ var: 'item.hora' }, '09:00'] },
              { '>': [{ var: 'item.hora' }, '18:00'] }
            ]
          },
          Payload_JSON: { message: 'Outside hours' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);

      let result = coord.evaluate({ item: { hora: '08:00' } });
      expect(result.warnings).toHaveLength(1);

      coord.invalidateCache();

      result = coord.evaluate({ item: { hora: '20:00' } });
      expect(result.warnings).toHaveLength(1);

      coord.invalidateCache();

      result = coord.evaluate({ item: { hora: '14:00' } });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('action types', () => {
    it('handles ERROR as blocking', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Error' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.errors).toHaveLength(1);
      expect(result.available).toBe(false);
    });

    it('handles WARNING as non-blocking', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'WARNING',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Warning' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.warnings).toHaveLength(1);
      expect(result.available).toBe(true);
    });

    it('handles other action types without effect', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'MULTIPLY',
          Condicion_JSON: true,
          Payload_JSON: { factor: 1.5 },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.available).toBe(true); // No blocking effect
    });
  });

  describe('caching', () => {
    it('caches result after first evaluation', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'Test' }, Prioridad: 1, Activo: true }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result1 = coord.evaluate({});
      const result2 = coord.evaluate({ different: 'context' });
      expect(result1).toBe(result2);
    });

    it('returns same cached result even with different snapshot', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: { '>': [{ var: 'item.pax' }, 100] },
          Payload_JSON: { message: 'Too many' }, Prioridad: 1, Activo: true }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result1 = coord.evaluate({ item: { pax: 150 } });
      const result2 = coord.evaluate({ item: { pax: 50 } });
      expect(result1).toBe(result2);
      expect(result1.appliedRules).toHaveLength(1);
    });

    it('invalidateCache clears cached result', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: { '>': [{ var: 'item.pax' }, 100] },
          Payload_JSON: { message: 'Too many' }, Prioridad: 1, Activo: true }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result1 = coord.evaluate({ item: { pax: 150 } });
      expect(result1.appliedRules).toHaveLength(1);

      coord.invalidateCache();

      const result2 = coord.evaluate({ item: { pax: 50 } });
      expect(result2).not.toBe(result1);
      expect(result2.appliedRules).toHaveLength(0);
    });
  });

  describe('Acumulable flag', () => {
    it('stops evaluating ERROR rules after first non-accumulating match', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'First error' },
          Prioridad: 10, Activo: true, Acumulable: false },
        { ID_Regla: 'R2', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'Second error' },
          Prioridad: 20, Activo: true, Acumulable: false },
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      // Only R1 fires; R2 is skipped because R1 fired with Acumulable=false
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe('R1');
    });

    it('stops evaluating WARNING rules after first non-accumulating match', () => {
      const rules = [
        { ID_Regla: 'W1', Scope: 'ITEM', Tipo_Accion: 'WARNING',
          Condicion_JSON: true, Payload_JSON: { message: 'First warning' },
          Prioridad: 10, Activo: true, Acumulable: false },
        { ID_Regla: 'W2', Scope: 'ITEM', Tipo_Accion: 'WARNING',
          Condicion_JSON: true, Payload_JSON: { message: 'Second warning' },
          Prioridad: 20, Activo: true, Acumulable: false },
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].id).toBe('W1');
    });

    it('allows accumulation when Acumulable=true', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'First' },
          Prioridad: 10, Activo: true, Acumulable: true },
        { ID_Regla: 'R2', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'Second' },
          Prioridad: 20, Activo: true, Acumulable: true },
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.errors).toHaveLength(2);
    });

    it('ERROR and WARNING stop independently', () => {
      const rules = [
        { ID_Regla: 'E1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'Error' },
          Prioridad: 10, Activo: true, Acumulable: false },
        { ID_Regla: 'W1', Scope: 'ITEM', Tipo_Accion: 'WARNING',
          Condicion_JSON: true, Payload_JSON: { message: 'Warning' },
          Prioridad: 20, Activo: true, Acumulable: false },
        { ID_Regla: 'E2', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: true, Payload_JSON: { message: 'Second error (skipped)' },
          Prioridad: 30, Activo: true, Acumulable: false },
        { ID_Regla: 'W2', Scope: 'ITEM', Tipo_Accion: 'WARNING',
          Condicion_JSON: true, Payload_JSON: { message: 'Second warning (skipped)' },
          Prioridad: 40, Activo: true, Acumulable: false },
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].id).toBe('E1');
      expect(result.warnings[0].id).toBe('W1');
    });
  });

  describe('multiple rules', () => {
    it('applies multiple rules (Acumulable=true)', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: { '>': [{ var: 'item.pax' }, 100] },
          Payload_JSON: { message: 'Too many pax' }, Prioridad: 10, Activo: true, Acumulable: true },
        { ID_Regla: 'R2', Scope: 'ITEM', Tipo_Accion: 'WARNING',
          Condicion_JSON: { '<': [{ var: 'item.hora' }, '09:00'] },
          Payload_JSON: { message: 'Early morning' }, Prioridad: 20, Activo: true, Acumulable: true },
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({ item: { pax: 150, hora: '08:00' } });

      expect(result.appliedRules).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.available).toBe(false);
    });

    it('respects priority order', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'First' },
          Prioridad: 20,
          Activo: true
        },
        {
          ID_Regla: 'R2',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Second' },
          Prioridad: 10,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      // R2 should be first (lower priority number = higher priority)
      expect(result.appliedRules[0].id).toBe('R2');
      expect(result.appliedRules[1].id).toBe('R1');
    });
  });

  describe('convenience getters', () => {
    it('getAppliedRules returns applied rules', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      coord.evaluate({});

      expect(coord.getAppliedRules()).toHaveLength(1);
    });

    it('isAvailable returns availability', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      coord.evaluate({});

      expect(coord.isAvailable()).toBe(false);
    });

    it('getErrors returns errors', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Error' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      coord.evaluate({});

      expect(coord.getErrors()).toHaveLength(1);
    });

    it('getWarnings returns warnings', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'WARNING',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Warning' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      coord.evaluate({});

      expect(coord.getWarnings()).toHaveLength(1);
    });
  });

  describe('humanization', () => {
    it('includes humanCondition in applied rules', () => {
      const rules = [
        { ID_Regla: 'R1', Scope: 'ITEM', Tipo_Accion: 'ERROR',
          Condicion_JSON: { '>': [{ var: 'item.pax' }, 100] },
          Payload_JSON: { message: 'Too many' }, Prioridad: 1, Activo: true }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({ item: { pax: 150 } });

      expect(result.appliedRules[0].humanCondition).toBeDefined();
      expect(result.appliedRules[0].humanCondition).toContain('item.pax');
    });

    it('includes humanPayload in applied rules', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { message: 'Test message' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules[0].humanPayload).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles malformed JSON in condition gracefully', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: 'not valid json {',
          Payload_JSON: { message: 'Test' },
          Prioridad: 1,
          Activo: true
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      // Should not match (error in parsing)
      expect(result.appliedRules).toHaveLength(0);
    });

    it('handles missing message in payload', () => {
      const rules = [
        {
          ID_Regla: 'R1',
          Scope: 'ITEM',
          Tipo_Accion: 'ERROR',
          Condicion_JSON: true,
          Payload_JSON: { other: 'field' },
          Prioridad: 1,
          Activo: true,
          Nombre: 'Test Rule'
        }
      ];

      const coord = new RulesCoordinator('ITEM', rules);
      const result = coord.evaluate({});

      expect(result.appliedRules[0].message).toBe('Test Rule');
    });

    it('returns empty result for no rules', () => {
      const coord = new RulesCoordinator('ITEM', []);
      const result = coord.evaluate({});

      expect(result.appliedRules).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.available).toBe(true);
    });
  });
});
