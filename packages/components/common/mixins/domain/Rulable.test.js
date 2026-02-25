import { describe, expect, it, vi } from 'vitest';
import { Rulable } from './Rulable.js';

describe('Rulable', () => {
  it('merges inherited context', () => {
    const RulableClass = Rulable(class {});
    const target = new RulableClass();

    const result = target.receiveContext({ pax: 10 }).receiveContext({ duracion: 120 });

    expect(result).toBe(target);
    expect(target._inheritedContext).toEqual({ pax: 10, duracion: 120 });
  });

  it('evaluates active rules and stores results', () => {
    const evaluator = vi.fn((rule) => (rule.ID_Regla === 'R1' ? { kind: 'warning' } : null));
    const RulableClass = Rulable(class {});
    const target = new RulableClass();

    target.setRules([
      { ID_Regla: 'R1', Activo: true, Acumulable: true },
      { ID_Regla: 'R2', Activo: false, Acumulable: true }
    ]);

    const result = target.evaluateRules(evaluator);

    expect(result).toBe(target);
    expect(target.getAppliedRules()).toEqual([{ ruleId: 'R1', kind: 'warning' }]);
    expect(evaluator).toHaveBeenCalledTimes(1);
  });

  it('stops on first non-accumulable hit', () => {
    const evaluator = vi.fn(() => ({ matched: true }));
    const RulableClass = Rulable(class {});
    const target = new RulableClass();

    target.setRules([
      { ID_Regla: 'R1', Activo: true, Acumulable: false },
      { ID_Regla: 'R2', Activo: true, Acumulable: true }
    ]);
    target.evaluateRules(evaluator);

    expect(evaluator).toHaveBeenCalledTimes(1);
    expect(target.getAppliedRules()).toHaveLength(1);
  });

  it('propagates merged context to children', () => {
    const child = { receiveContext: vi.fn() };
    const Base = class {
      _children = new Map([['c1', child]]);
    };
    const RulableClass = Rulable(Base);
    const target = new RulableClass();
    target.receiveContext({ pax: 10 });

    const result = target.propagateContext({ surcharge: true });

    expect(result).toBe(target);
    expect(child.receiveContext).toHaveBeenCalledWith({ pax: 10, surcharge: true });
  });
});
