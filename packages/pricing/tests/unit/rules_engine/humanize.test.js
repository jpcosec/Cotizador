import { describe, it, expect } from 'vitest';
import { humanizeCondition, humanizePayload, humanizeRule } from '../../../src/RulesEngine/humanize.js';

// ── humanizeCondition ────────────────────────────────────────────────────────

describe('humanizeCondition', () => {
  it('returns "always" for boolean true', () => {
    expect(humanizeCondition(true)).toBe('always');
    expect(humanizeCondition('true')).toBe('always');
  });

  it('returns "never" for boolean false', () => {
    expect(humanizeCondition(false)).toBe('never');
    expect(humanizeCondition('false')).toBe('never');
  });

  it('formats simple equality', () => {
    const cond = { '===': [{ var: '_categoriaId' }, 'CAT_SALON'] };
    expect(humanizeCondition(cond)).toBe('_categoriaId = CAT_SALON');
  });

  it('formats inequality', () => {
    const cond = { '!==': [{ var: 'estado' }, 'ACTIVO'] };
    expect(humanizeCondition(cond)).toBe('estado ≠ ACTIVO');
  });

  it('formats greater-than', () => {
    const cond = { '>': [{ var: '_duracionMin' }, 480] };
    expect(humanizeCondition(cond)).toBe('_duracionMin > 480');
  });

  it('formats greater-than-or-equal', () => {
    const cond = { '>=': [{ var: 'pax' }, 50] };
    expect(humanizeCondition(cond)).toBe('pax ≥ 50');
  });

  it('formats less-than', () => {
    const cond = { '<': [{ var: 'pax' }, 10] };
    expect(humanizeCondition(cond)).toBe('pax < 10');
  });

  it('formats less-than-or-equal', () => {
    const cond = { '<=': [{ var: 'pax' }, 10] };
    expect(humanizeCondition(cond)).toBe('pax ≤ 10');
  });

  it('formats AND compound with parentheses', () => {
    const cond = {
      and: [
        { '===': [{ var: '_categoriaId' }, 'CAT_SALON'] },
        { '>': [{ var: '_duracionMin' }, 480] },
      ],
    };
    const result = humanizeCondition(cond);
    expect(result).toContain('AND');
    expect(result).toContain('_categoriaId = CAT_SALON');
    expect(result).toContain('_duracionMin > 480');
  });

  it('formats OR compound with parentheses', () => {
    const cond = {
      or: [
        { '===': [{ var: 'tipo' }, 'A'] },
        { '===': [{ var: 'tipo' }, 'B'] },
      ],
    };
    const result = humanizeCondition(cond);
    expect(result).toContain('OR');
    expect(result).toContain('tipo = A');
    expect(result).toContain('tipo = B');
  });

  it('formats NOT expression', () => {
    const cond = { '!': { '===': [{ var: 'activo' }, true] } };
    expect(humanizeCondition(cond)).toMatch(/NOT/);
  });

  it('formats "in" membership check', () => {
    const cond = { in: [{ var: 'categoria' }, ['CAT_SALON', 'CAT_BAR']] };
    expect(humanizeCondition(cond)).toBe('categoria in [CAT_SALON, CAT_BAR]');
  });

  it('handles equality with null right-hand side', () => {
    const cond = { '===': [{ var: 'Override_Cantidad' }, null] };
    expect(humanizeCondition(cond)).toBe('Override_Cantidad = not set');
  });

  it('accepts JSON string input', () => {
    const condStr = JSON.stringify({ '===': [{ var: 'x' }, 1] });
    expect(humanizeCondition(condStr)).toBe('x = 1');
  });

  it('falls back to JSON.stringify for unknown operator', () => {
    const cond = { unknownOp: [1, 2] };
    const result = humanizeCondition(cond);
    expect(result).toBe(JSON.stringify(cond));
  });
});

// ── humanizePayload ──────────────────────────────────────────────────────────

describe('humanizePayload', () => {
  it('MULTIPLY shows factor and percentage', () => {
    expect(humanizePayload('MULTIPLY', { factor: 1.25 })).toBe('×1.25 (+25%)');
  });

  it('MULTIPLY with discount (factor < 1) shows negative percentage', () => {
    // Implementation uses +${pct} so a negative pct gives "+-10%"
    expect(humanizePayload('MULTIPLY', { factor: 0.9 })).toBe('×0.9 (+-10%)');
  });

  it('ADD_FIXED with negative amount shows minus sign', () => {
    expect(humanizePayload('ADD_FIXED', { amount: -5000 })).toBe('−$5,000 flat');
  });

  it('ADD_FIXED with positive amount shows plus sign', () => {
    expect(humanizePayload('ADD_FIXED', { amount: 3000 })).toBe('+$3,000 flat');
  });

  it('SET_VALUE shows price', () => {
    expect(humanizePayload('SET_VALUE', { value: 100000 })).toBe('set price to $100,000');
  });

  it('SET_TAX shows name and rate percentage', () => {
    expect(humanizePayload('SET_TAX', { name: 'IVA', rate: 0.19 })).toBe('IVA 19%');
  });

  it('SET_DEFAULT shows field and value', () => {
    expect(humanizePayload('SET_DEFAULT', { field: 'Cantidad', value: 60 })).toBe('default Cantidad = 60');
  });

  it('ADD_ITEM shows item ID', () => {
    expect(humanizePayload('ADD_ITEM', { itemId: 'ITEM_MESA' })).toBe('auto-add ITEM_MESA');
  });

  it('WARNING shows message', () => {
    expect(humanizePayload('WARNING', { message: 'Capacity exceeded' })).toBe('Capacity exceeded');
  });

  it('ERROR shows message', () => {
    expect(humanizePayload('ERROR', { message: 'Invalid date range' })).toBe('Invalid date range');
  });

  it('INVALIDATE_BASKET shows message', () => {
    expect(humanizePayload('INVALIDATE_BASKET', { message: 'No salon available' })).toBe('No salon available');
  });

  it('unknown action type falls back to JSON.stringify', () => {
    const payload = { foo: 'bar' };
    expect(humanizePayload('UNKNOWN_TYPE', payload)).toBe(JSON.stringify(payload));
  });

  it('accepts JSON string payload', () => {
    expect(humanizePayload('SET_TAX', JSON.stringify({ name: 'IVA', rate: 0.16 }))).toBe('IVA 16%');
  });
});

// ── humanizeRule ─────────────────────────────────────────────────────────────

describe('humanizeRule', () => {
  it('produces "When <condition>, <action> <payload>"', () => {
    const rule = {
      Tipo_Accion: 'MULTIPLY',
      Condicion_JSON: {
        and: [
          { '===': [{ var: '_categoriaId' }, 'CAT_SALON'] },
          { '>': [{ var: '_duracionMin' }, 480] },
        ],
      },
      Payload_JSON: { factor: 1.25 },
    };
    const result = humanizeRule(rule);
    expect(result).toMatch(/^When /);
    expect(result).toContain('MULTIPLY');
    expect(result).toContain('×1.25 (+25%)');
    expect(result).toContain('_categoriaId = CAT_SALON');
  });

  it('handles always-true condition', () => {
    const rule = {
      Tipo_Accion: 'SET_TAX',
      Condicion_JSON: true,
      Payload_JSON: { name: 'IVA', rate: 0.19 },
    };
    expect(humanizeRule(rule)).toBe('When always, SET_TAX IVA 19%');
  });

  it('works with JSON string fields', () => {
    const rule = {
      Tipo_Accion: 'WARNING',
      Condicion_JSON: JSON.stringify({ '===': [{ var: 'x' }, 1] }),
      Payload_JSON: JSON.stringify({ message: 'Check value' }),
    };
    const result = humanizeRule(rule);
    expect(result).toContain('When');
    expect(result).toContain('WARNING');
    expect(result).toContain('Check value');
  });
});
