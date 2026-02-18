import { describe, it, expect } from 'vitest';
import { applyManualAdjustments, getGlobalManualAdjustments } from '../../../src/Pricing/manual.js';

describe('Pricing/manual', () => {
  it('OVERRIDE_PRECIO replaces line price', () => {
    const lineas = [{ ID_Linea: 'L1', _netoAjustado: 100000 }];
    const ajustes = [{ ID_Linea: 'L1', Tipo_Ajuste: 'OVERRIDE_PRECIO', Valor_Nuevo: 80000 }];
    applyManualAdjustments(lineas, ajustes);
    expect(lineas[0]._netoFinal).toBe(80000);
    expect(lineas[0]._valorOriginal).toBe(100000);
  });

  it('DESCUENTO_LINEA subtracts from line price', () => {
    const lineas = [{ ID_Linea: 'L1', _netoAjustado: 100000 }];
    const ajustes = [{ ID_Linea: 'L1', Tipo_Ajuste: 'DESCUENTO_LINEA', Valor_Nuevo: 10000 }];
    applyManualAdjustments(lineas, ajustes);
    expect(lineas[0]._netoFinal).toBe(90000);
  });

  it('skips global adjustments in line processing', () => {
    const lineas = [{ ID_Linea: 'L1', _netoAjustado: 100000 }];
    const ajustes = [{ Tipo_Ajuste: 'DESCUENTO_GLOBAL', Valor_Nuevo: 5000 }];
    applyManualAdjustments(lineas, ajustes);
    expect(lineas[0]._netoFinal).toBe(100000);
  });

  it('getGlobalManualAdjustments filters correctly', () => {
    const ajustes = [
      { Tipo_Ajuste: 'DESCUENTO_GLOBAL' },
      { Tipo_Ajuste: 'OVERRIDE_PRECIO' },
      { Tipo_Ajuste: 'RECARGO' },
    ];
    const global = getGlobalManualAdjustments(ajustes);
    expect(global).toHaveLength(2);
  });
});
