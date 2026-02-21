import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Rulable } from '../../../src/mixins/Rulable.js';

describe('Rulable Mixin', () => {
  let RulableClass;
  let instance;

  beforeEach(() => {
    class Base {}
    RulableClass = class extends Rulable(Base) {
      constructor() {
        super();
        this._rules = [];
      }
    };
    instance = new RulableClass();
  });

  describe('receiveContext', () => {
    it('should merge context correctly on first call', () => {
      instance.receiveContext({ key1: 'value1', key2: 'value2' });
      expect(instance._inheritedContext).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should return this for chaining', () => {
      const result = instance.receiveContext({ key: 'value' });
      expect(result).toBe(instance);
    });

    it('should merge multiple context calls cumulatively', () => {
      instance.receiveContext({ key1: 'value1' });
      instance.receiveContext({ key2: 'value2' });
      expect(instance._inheritedContext).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should overwrite existing keys in subsequent calls', () => {
      instance.receiveContext({ key: 'original' });
      instance.receiveContext({ key: 'overwritten' });
      expect(instance._inheritedContext.key).toBe('overwritten');
    });

    it('should not mutate the input object', () => {
      const ctx = { key: 'value' };
      instance.receiveContext(ctx);
      instance._inheritedContext.key = 'modified';
      expect(ctx.key).toBe('value');
    });
  });

  describe('evaluateRules', () => {
    it('should call evaluator for each active rule', () => {
      const evaluator = vi.fn().mockReturnValue({ delta: 10, description: 'test' });
      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      instance.evaluateRules(evaluator);

      expect(evaluator).toHaveBeenCalledTimes(2);
    });

    it('should skip rules with Activo = false', () => {
      const evaluator = vi.fn().mockReturnValue({ delta: 10, description: 'test' });
      instance._rules = [
        { ID_Regla: 'r1', Activo: false, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      instance.evaluateRules(evaluator);

      expect(evaluator).toHaveBeenCalledTimes(1);
      expect(evaluator).toHaveBeenCalledWith(
        expect.objectContaining({ ID_Regla: 'r2' }),
        expect.any(Object)
      );
    });

    it('should stop after first match when Acumulable = false', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce({ delta: 10, description: 'first' })
        .mockReturnValueOnce({ delta: 20, description: 'second' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: false },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(evaluator).toHaveBeenCalledTimes(1);
      expect(applied).toHaveLength(1);
      expect(applied[0].ruleId).toBe('r1');
    });

    it('should continue when Acumulable = true', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce({ delta: 10, description: 'first' })
        .mockReturnValueOnce({ delta: 20, description: 'second' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(evaluator).toHaveBeenCalledTimes(2);
      expect(applied).toHaveLength(2);
    });

    it('should skip rules where evaluator returns null', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ delta: 20, description: 'second' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(applied).toHaveLength(1);
      expect(applied[0].ruleId).toBe('r2');
    });

    it('should include ruleId and all result fields in appliedRules', () => {
      const evaluator = vi.fn().mockReturnValue({
        delta: 100,
        description: 'test rule',
        metadata: { source: 'test' },
      });

      instance._rules = [
        { ID_Regla: 'rule-123', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(applied[0]).toEqual({
        ruleId: 'rule-123',
        delta: 100,
        description: 'test rule',
        metadata: { source: 'test' },
      });
    });

    it('should reset _appliedRules on each call', () => {
      const evaluator = vi.fn().mockReturnValue({ delta: 10, description: 'test' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];

      instance.evaluateRules(evaluator);
      const firstResult = instance._appliedRules.length;

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];

      instance.evaluateRules(evaluator);
      const secondResult = instance._appliedRules.length;

      expect(firstResult).toBe(1);
      expect(secondResult).toBe(2);
    });

    it('should pass inherited context to evaluator', () => {
      const evaluator = vi.fn().mockReturnValue({ delta: 10, description: 'test' });

      instance.receiveContext({ userId: 'user123', eventType: 'wedding' });
      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];

      instance.evaluateRules(evaluator);

      expect(evaluator).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ userId: 'user123', eventType: 'wedding' })
      );
    });
  });

  describe('_buildRuleContext', () => {
    it('should return a copy of inherited context', () => {
      instance.receiveContext({ key: 'value' });
      const ctx = instance._buildRuleContext();

      expect(ctx).toEqual({ key: 'value' });
      ctx.key = 'modified';
      expect(instance._inheritedContext.key).toBe('value');
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed active/inactive rules with all acumulable', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce({ delta: 10, description: 'first' })
        .mockReturnValueOnce({ delta: 30, description: 'third' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: false, Acumulable: true }, // skipped
        { ID_Regla: 'r3', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(applied).toHaveLength(2);
      expect(applied.map(a => a.ruleId)).toEqual(['r1', 'r3']);
      expect(evaluator).toHaveBeenCalledTimes(2);
    });

    it('should handle empty rules array', () => {
      const evaluator = vi.fn();
      instance._rules = [];

      const applied = instance.evaluateRules(evaluator);

      expect(applied).toEqual([]);
      expect(evaluator).not.toHaveBeenCalled();
    });

    it('should handle context merging across multiple evaluation cycles', () => {
      const evaluator = vi.fn().mockReturnValue({ delta: 10, description: 'test' });

      instance.receiveContext({ step: 1 });
      instance._rules = [{ ID_Regla: 'r1', Activo: true, Acumulable: true }];
      instance.evaluateRules(evaluator);

      instance.receiveContext({ step: 2, newKey: 'value' });
      instance._rules = [{ ID_Regla: 'r2', Activo: true, Acumulable: true }];
      const secondCall = instance.evaluateRules(evaluator);

      expect(secondCall[0]).toEqual(
        expect.objectContaining({ ruleId: 'r2', delta: 10, description: 'test' })
      );
    });

    it('should stop processing after non-acumulable rule matches', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce({ delta: 10, description: 'first' });

      instance._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: false },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
        { ID_Regla: 'r3', Activo: true, Acumulable: true },
      ];

      const applied = instance.evaluateRules(evaluator);

      expect(applied).toHaveLength(1);
      expect(applied[0].ruleId).toBe('r1');
      expect(evaluator).toHaveBeenCalledTimes(1);
    });
  });
});
