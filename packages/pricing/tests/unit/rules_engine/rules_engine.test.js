import { describe, it, expect } from 'vitest';
import { getRulesForStageAndHook, evaluateCondition, executeAction } from '../../../src/RulesEngine/RulesEngine.js';
import { TableInMemoryStore as InMemoryStore } from '../../../../database/src/stores/TableInMemoryStore.js';
import { BUSINESS_RULES } from '../../fixtures/rules.js';

function makeStore(rules = BUSINESS_RULES) {
  const store = new InMemoryStore();
  store.seed('REGLAS_NEGOCIO', rules);
  return store;
}

describe('getRulesForStageAndHook', () => {
  it('returns rules for a given stage sorted by priority', () => {
    const store = makeStore();
    const rules = getRulesForStageAndHook('AJUSTE_LINEA', null, store);
    expect(rules).toHaveLength(1);
    expect(rules[0].ID_Regla).toBe('R001_OVERTIME');
  });

  it('returns empty for non-existent stage', () => {
    const store = makeStore();
    expect(getRulesForStageAndHook('NONEXISTENT', null, store)).toHaveLength(0);
  });

  it('filters by hook when specified', () => {
    const store = makeStore([
      { ...BUSINESS_RULES[0], Hook: 'post_execution' },
    ]);
    expect(getRulesForStageAndHook('AJUSTE_LINEA', 'pre_execution', store)).toHaveLength(0);
    expect(getRulesForStageAndHook('AJUSTE_LINEA', 'post_execution', store)).toHaveLength(1);
  });

  it('includes rules with no Hook when filtering', () => {
    const store = makeStore();
    expect(getRulesForStageAndHook('AJUSTE_LINEA', 'post_execution', store)).toHaveLength(1);
  });
});

describe('evaluateCondition', () => {
  it('evaluates JsonLogic conditions', () => {
    expect(evaluateCondition(true, {})).toBe(true);
    expect(evaluateCondition({ '>': [{ 'var': 'x' }, 10] }, { x: 15 })).toBe(true);
    expect(evaluateCondition({ '>': [{ 'var': 'x' }, 10] }, { x: 5 })).toBe(false);
  });
});

describe('executeAction', () => {
  it('delegates to registered handler', () => {
    const result = executeAction('MULTIPLY', { factor: 1.25 }, { neto: 100000 });
    expect(result.delta).toBe(25000);
  });

  it('throws on unknown action type', () => {
    expect(() => executeAction('BOGUS', {}, {})).toThrow('Unknown action type');
  });
});
