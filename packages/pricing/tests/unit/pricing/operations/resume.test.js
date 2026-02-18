import { describe, it, expect } from 'vitest';
import { resume } from '../../../../src/Pricing/operations/resume.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

describe('Pricing/operations/resume', () => {
  const store = createSeededStore();

  it('restores computed fields from database state', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
        // Simulate database state: only input fields
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = resume(lineas, quotation, store);

    expect(result.lineas[0]._netoBase).toBe(385000);
    expect(result.lineas[0]._duracionMin).toBe(480);
    expect(result.lineas[0]._pax).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('recalculates with multiple items', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
      {
        ID_Linea: 'L2',
        ID_Item: 'ITEM_COFFEE_BASIC',
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = resume(lineas, quotation, store);

    expect(result.lineas).toHaveLength(2);
    expect(result.lineas[0]._netoBase).toBe(385000);
    expect(result.lineas[1]._netoBase).toBe(6380 * 25);
  });

  it('preserves override fields from database', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
        Override_Duracion_Min: 600,
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = resume(lineas, quotation, store);

    expect(result.lineas[0]._duracionMin).toBe(600);
  });

  it('calculates totals after resume', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
      {
        ID_Linea: 'L2',
        ID_Item: 'ITEM_COFFEE_BASIC',
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = resume(lineas, quotation, store);

    expect(result.totals.subtotal).toBe(385000 + 6380 * 25);
    expect(result.totals.taxes).toHaveLength(1);
    expect(result.totals.total).toBeCloseTo((385000 + 6380 * 25) * 1.19, 0);
  });

  it('applies manual adjustments after resume', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [
        {
          ID_Linea: 'L1',
          Tipo_Ajuste: 'DESCUENTO_LINEA',
          Valor_Nuevo: 100000,
        },
      ],
    };

    const result = resume(lineas, quotation, store);

    expect(result.lineas[0]._netoFinal).toBe(385000 - 100000);
  });

  it('handles errors gracefully', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_DOES_NOT_EXIST',
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = resume(lineas, quotation, store);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ruleId).toBe('RESUME_ERROR');
  });

  it('returns required response structure', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };

    const result = resume(lineas, quotation, store);

    expect(result).toHaveProperty('lineas');
    expect(result).toHaveProperty('quotation');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('errors');
  });
});
