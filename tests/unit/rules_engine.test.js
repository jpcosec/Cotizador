import { describe, it, expect } from 'vitest';
import { evaluateCondition, executeAction, getRulesForStage } from '../../src/Pipeline/rules_engine.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('rules_engine (JsonLogic)', () => {
  const store = createSeededStore();

  describe('evaluateCondition', () => {
    it('> operator: pax=80 > 50 → true', () => {
      expect(evaluateCondition({ ">": [{ "var": "pax" }, 50] }, { pax: 80 })).toBe(true);
    });

    it('> operator: pax=30 > 50 → false', () => {
      expect(evaluateCondition({ ">": [{ "var": "pax" }, 50] }, { pax: 30 })).toBe(false);
    });

    it('literal true → true (always fire)', () => {
      expect(evaluateCondition(true, {})).toBe(true);
    });

    it('=== operator', () => {
      expect(evaluateCondition({ "===": [{ "var": "x" }, "A"] }, { x: 'A' })).toBe(true);
      expect(evaluateCondition({ "===": [{ "var": "x" }, "A"] }, { x: 'B' })).toBe(false);
    });

    it('AND compound', () => {
      const logic = { "and": [{ ">": [{ "var": "a" }, 5] }, { "===": [{ "var": "b" }, "X"] }] };
      expect(evaluateCondition(logic, { a: 10, b: 'X' })).toBe(true);
      expect(evaluateCondition(logic, { a: 10, b: 'Y' })).toBe(false);
    });

    it('OR compound', () => {
      const logic = { "or": [{ "===": [{ "var": "a" }, 1] }, { "===": [{ "var": "a" }, 2] }] };
      expect(evaluateCondition(logic, { a: 2 })).toBe(true);
      expect(evaluateCondition(logic, { a: 3 })).toBe(false);
    });

    it('nested var paths', () => {
      const logic = { ">": [{ "var": "totals.subtotal" }, 1000] };
      expect(evaluateCondition(logic, { totals: { subtotal: 5000 } })).toBe(true);
    });

    it('in operator (category membership)', () => {
      const logic = { "in": [{ "var": "cat" }, ["A", "B", "C"]] };
      expect(evaluateCondition(logic, { cat: 'B' })).toBe(true);
      expect(evaluateCondition(logic, { cat: 'Z' })).toBe(false);
    });
  });

  describe('executeAction', () => {
    it('MULTIPLY factor 1.25 on neto 100,000 → delta 25,000', () => {
      const result = executeAction('MULTIPLY', { factor: 1.25 }, { neto: 100000 });
      expect(result.delta).toBe(25000);
    });

    it('ADD_FIXED -50,000 → delta -50,000', () => {
      const result = executeAction('ADD_FIXED', { amount: -50000 }, {});
      expect(result.delta).toBe(-50000);
    });

    it('SET_TAX IVA 19% on subtotal 1,000,000', () => {
      const result = executeAction('SET_TAX', { name: 'IVA', rate: 0.19 }, { subtotal: 1000000 });
      expect(result.amount).toBe(190000);
      expect(result.name).toBe('IVA');
    });
  });

  describe('getRulesForStage', () => {
    it('IMPUESTO → sorted by Prioridad ascending', () => {
      const rules = getRulesForStage('IMPUESTO', store);
      expect(rules.length).toBeGreaterThanOrEqual(1);
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i].Prioridad).toBeGreaterThanOrEqual(rules[i - 1].Prioridad);
      }
    });

    it('AJUSTE_LINEA rules exist', () => {
      const rules = getRulesForStage('AJUSTE_LINEA', store);
      expect(rules.length).toBeGreaterThanOrEqual(1);
    });
  });
});
