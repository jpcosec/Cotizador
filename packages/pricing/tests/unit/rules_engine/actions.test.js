import { describe, it, expect } from 'vitest';
import { getActionHandler, registeredActions } from '../../../src/RulesEngine/actions/index.js';

// Import to trigger registration
import '../../../src/RulesEngine/RulesEngine.js';

describe('Action Registry', () => {
  it('registers all expected actions', () => {
    const names = registeredActions();
    expect(names).toContain('MULTIPLY');
    expect(names).toContain('ADD_FIXED');
    expect(names).toContain('SET_VALUE');
    expect(names).toContain('SET_TAX');
    expect(names).toContain('SET_DEFAULT');
    expect(names).toContain('ADD_ITEM');
    expect(names).toContain('WARNING');
    expect(names).toContain('ERROR');
    expect(names).toContain('INVALIDATE_BASKET');
  });

  it('throws on unknown action', () => {
    expect(() => getActionHandler('UNKNOWN')).toThrow('Unknown action type: UNKNOWN');
  });
});

describe('MULTIPLY', () => {
  it('calculates delta from factor', () => {
    const handler = getActionHandler('MULTIPLY');
    const result = handler({ factor: 1.25 }, { neto: 100000 });
    expect(result.delta).toBe(25000);
  });
});

describe('ADD_FIXED', () => {
  it('returns fixed amount as delta', () => {
    const handler = getActionHandler('ADD_FIXED');
    const result = handler({ amount: -5000 }, { neto: 100000 });
    expect(result.delta).toBe(-5000);
  });
});

describe('SET_VALUE', () => {
  it('calculates delta to reach target value', () => {
    const handler = getActionHandler('SET_VALUE');
    const result = handler({ value: 50000 }, { neto: 100000 });
    expect(result.delta).toBe(-50000);
  });
});

describe('SET_TAX', () => {
  it('calculates tax amount from subtotal', () => {
    const handler = getActionHandler('SET_TAX');
    const result = handler({ name: 'IVA', rate: 0.19 }, { subtotal: 1000000 });
    expect(result.amount).toBe(190000);
    expect(result.name).toBe('IVA');
    expect(result.rate).toBe(0.19);
  });
});

describe('SET_DEFAULT', () => {
  it('returns value and field', () => {
    const handler = getActionHandler('SET_DEFAULT');
    const result = handler({ field: '_cantidad', value: 10 }, {});
    expect(result.delta).toBe(0);
    expect(result.field).toBe('_cantidad');
    expect(result.value).toBe(10);
  });
});
