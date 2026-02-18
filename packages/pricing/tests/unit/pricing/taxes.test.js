import { describe, it, expect } from 'vitest';
import { calculateTaxes } from '../../../src/Pricing/taxes.js';
import { createSeededStore } from '../../helpers/store_factory.js';

describe('Pricing/taxes', () => {
  const store = createSeededStore();

  it('calculates IVA 19% on subtotal', () => {
    const lineas = [
      { _netoFinal: 385000 },
      { _netoFinal: 159500 },
    ];
    const result = calculateTaxes(lineas, store);
    const expectedSub = 544500;
    expect(result.subtotal).toBe(expectedSub);
    expect(result.taxes).toHaveLength(1);
    expect(result.taxes[0].name).toBe('IVA');
    expect(result.taxes[0].amount).toBeCloseTo(expectedSub * 0.19);
    expect(result.total).toBeCloseTo(expectedSub * 1.19);
  });

  it('falls back through _netoAjustado and _netoBase', () => {
    const lineas = [{ _netoBase: 100000 }];
    const result = calculateTaxes(lineas, store);
    expect(result.subtotal).toBe(100000);
  });
});
