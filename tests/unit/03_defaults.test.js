import { describe, it, expect } from 'vitest';
import { resolveDefaults } from '../../src/Pipeline/03_defaults.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('03_defaults — Defaults Resolution', () => {
  const store = createSeededStore();
  const ctx = { paxGlobal: 80 };

  function makeLine(itemId, overrides = {}) {
    return { ID_Item: itemId, ...overrides };
  }

  it('Salon (Requiere_Tiempo=true): _duracionMin=480, _pax=0, _cantidad=0', () => {
    const linea = makeLine('ITEM_CHINOOK');
    resolveDefaults(linea, ctx, store);
    expect(linea._duracionMin).toBe(480);
    expect(linea._pax).toBe(0);
    expect(linea._cantidad).toBe(0);
  });

  it('Coffee (Requiere_Pax=true): _pax=80, _cantidad=0', () => {
    const linea = makeLine('ITEM_COFFEE_BASIC');
    resolveDefaults(linea, ctx, store);
    expect(linea._pax).toBe(80);
    expect(linea._cantidad).toBe(0);
    expect(linea._duracionMin).toBe(0);
  });

  it('Cerveza (Requiere_Pax+Cant): _pax=80, _cantidad=40 (0.5 × 80)', () => {
    const linea = makeLine('ITEM_TICKET_CERVEZA');
    resolveDefaults(linea, ctx, store);
    expect(linea._pax).toBe(80);
    expect(linea._cantidad).toBe(40);
  });

  it('Cerveza with Override_Pax=50: _pax=50, _cantidad=25', () => {
    const linea = makeLine('ITEM_TICKET_CERVEZA', { Override_Pax: 50 });
    resolveDefaults(linea, ctx, store);
    expect(linea._pax).toBe(50);
    expect(linea._cantidad).toBe(25);
  });

  it('Salon with Override_Duracion=360: _duracionMin=360', () => {
    const linea = makeLine('ITEM_CHINOOK', { Override_Duracion_Min: 360 });
    resolveDefaults(linea, ctx, store);
    expect(linea._duracionMin).toBe(360);
  });

  it('Bebida lata uses category default Def_Unidades_Por_Pax (0.5)', () => {
    const linea = makeLine('ITEM_BEBIDA_LATA');
    resolveDefaults(linea, ctx, store);
    expect(linea._pax).toBe(80);
    expect(linea._cantidad).toBe(40);
  });
});
