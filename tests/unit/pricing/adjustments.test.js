import { describe, it, expect } from 'vitest';
import { applyLineAdjustments, applyGlobalAdjustments } from '../../../src/Pricing/calculations/rules.js';
import { createSeededStore } from '../../helpers/store_factory.js';

describe('Pricing/adjustments', () => {
  const store = createSeededStore();

  it('applies overtime surcharge to salon with duration > 480', () => {
    const lineas = [
      { _categoriaId: 'CAT_SALON', _duracionMin: 600, _netoBase: 385000 },
    ];
    applyLineAdjustments(lineas, store);
    expect(lineas[0]._netoAjustado).toBe(385000 * 1.25);
    expect(lineas[0]._ajustes).toHaveLength(1);
    expect(lineas[0]._ajustes[0].ruleId).toBe('R001_OVERTIME');
  });

  it('does not apply overtime for duration <= 480', () => {
    const lineas = [
      { _categoriaId: 'CAT_SALON', _duracionMin: 480, _netoBase: 385000 },
    ];
    applyLineAdjustments(lineas, store);
    expect(lineas[0]._netoAjustado).toBe(385000);
    expect(lineas[0]._ajustes).toHaveLength(0);
  });

  it('applyGlobalAdjustments collects messages', () => {
    const lineas = [{ _netoAjustado: 100000 }];
    const messages = [];
    applyGlobalAdjustments(lineas, messages, store);
    // No AJUSTE_GLOBAL rules in fixtures, so no messages
    expect(messages).toHaveLength(0);
  });
});
