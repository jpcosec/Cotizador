import { describe, it, expect } from 'vitest';
import { validate } from '../../../../src/Pricing/operations/validate.js';
import { createSeededStore } from '../../../helpers/store_factory.js';

describe('Pricing/operations/validate', () => {
  const store = createSeededStore();

  it('performs full basket validation and recalculation', () => {
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

    const result = validate(lineas, quotation, store);

    expect(result.lineas).toHaveLength(2);
    expect(result.lineas[0]._netoBase).toBe(385000);
    expect(result.lineas[1]._netoBase).toBe(6380 * 25);
    expect(result.errors).toHaveLength(0);
  });

  it('filters out soft-deleted items', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
      },
      {
        ID_Linea: 'L2',
        ID_Item: 'ITEM_COFFEE_BASIC',
        _removed: true,
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = validate(lineas, quotation, store);

    expect(result.lineas).toHaveLength(1);
    expect(result.lineas[0].ID_Item).toBe('ITEM_CHINOOK');
  });

  it('calculates totals with taxes', () => {
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

    const result = validate(lineas, quotation, store);

    expect(result.totals.subtotal).toBeGreaterThan(0);
    expect(result.totals.taxes).toHaveLength(1);
    expect(result.totals.taxes[0].name).toBe('IVA');
    expect(result.totals.total).toBeCloseTo(result.totals.subtotal * 1.19, 0);
  });

  it('applies manual adjustments during validation', () => {
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
          Valor_Nuevo: 50000,
        },
      ],
    };

    const result = validate(lineas, quotation, store);

    expect(result.lineas[0]._netoFinal).toBe(385000 - 50000);
  });

  it('restores computed fields during validation', () => {
    const lineas = [
      {
        ID_Linea: 'L1',
        ID_Item: 'ITEM_CHINOOK',
        // Simulate database state: no computed fields
      },
    ];
    const quotation = {
      paxGlobal: 25,
      ajustesManuales: [],
    };

    const result = validate(lineas, quotation, store);

    expect(result.lineas[0]._categoriaId).toBeDefined();
    expect(result.lineas[0]._pax).toBeDefined();
    expect(result.lineas[0]._duracionMin).toBeDefined();
    expect(result.lineas[0]._netoBase).toBeDefined();
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

    const result = validate(lineas, quotation, store);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].ruleId).toBe('VALIDATE_ERROR');
  });

  it('returns required response structure', () => {
    const lineas = [];
    const quotation = { paxGlobal: 25, ajustesManuales: [] };

    const result = validate(lineas, quotation, store);

    expect(result).toHaveProperty('lineas');
    expect(result).toHaveProperty('quotation');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('errors');
  });
});
