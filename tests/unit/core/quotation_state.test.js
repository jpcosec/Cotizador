import { describe, it, expect, beforeEach } from 'vitest';
import { QuotationState, resetLineSeq } from '../../../mock/Core/QuotationState.js';

describe('QuotationState', () => {
  beforeEach(() => resetLineSeq());

  it('initializes with header, empty lines, and zero totals', () => {
    const state = new QuotationState({
      paxGlobal: 25, fechaEvento: '2025-06-15',
      duracionDias: 1, clienteId: 'CLI_CORP', cotizacionId: 'COT_1',
    });

    expect(state.cotizacion.Pax_Global).toBe(25);
    expect(state.cotizacion.Estado).toBe('Borrador');
    expect(state.lineas).toHaveLength(0);
    expect(state.totals.total).toBe(0);
  });

  it('nextLineId returns incrementing IDs', () => {
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_T' });
    expect(state.nextLineId()).toBe('LIN_1');
    expect(state.nextLineId()).toBe('LIN_2');
  });

  it('addLine / findLineById / removeLine', () => {
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_T' });
    const line = { ID_Linea: 'LIN_1', ID_Item: 'ITEM_A' };
    state.addLine(line);
    expect(state.findLineById('LIN_1')).toBe(line);
    expect(state.findLineById('LIN_X')).toBeNull();

    state.removeLine('LIN_1');
    expect(state.lineas).toHaveLength(0);
  });

  it('removeLinesByParent removes children', () => {
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_T' });
    state.addLine({ ID_Linea: 'LIN_1', _parentItem: 'PACK_A' });
    state.addLine({ ID_Linea: 'LIN_2', _parentItem: 'PACK_A' });
    state.addLine({ ID_Linea: 'LIN_3', _parentItem: 'PACK_B' });

    state.removeLinesByParent('PACK_A');
    expect(state.lineas).toHaveLength(1);
    expect(state.lineas[0].ID_Linea).toBe('LIN_3');
  });

  it('stripComputed removes all underscore-prefixed fields', () => {
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_T' });
    state.addLine({
      ID_Linea: 'LIN_1', ID_Item: 'ITEM_A',
      Override_Pax: 20,
      _netoBase: 1000, _pax: 20, _cantidad: 5, _categoriaId: 'CAT_A',
    });

    state.stripComputed();
    const line = state.lineas[0];
    expect(line.ID_Linea).toBe('LIN_1');
    expect(line.ID_Item).toBe('ITEM_A');
    expect(line.Override_Pax).toBe(20);
    expect(line._netoBase).toBeUndefined();
    expect(line._pax).toBeUndefined();
  });
});
