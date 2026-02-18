import { describe, it, expect } from 'vitest';
import { resolveDefaults } from '../../../src/Pricing/calculations/defaults.js';
import { createSeededStore } from '../../helpers/store_factory.js';

describe('Pricing/defaults', () => {
  const store = createSeededStore();

  it('salon: time-based, no pax, default duration 480', () => {
    const linea = { ID_Item: 'ITEM_CHINOOK' };
    resolveDefaults(linea, 25, store);
    expect(linea._pax).toBe(0);
    expect(linea._duracionMin).toBe(480);
    expect(linea._cantidad).toBe(0);
  });

  it('coffee: pax-based, inherits global pax', () => {
    const linea = { ID_Item: 'ITEM_COFFEE_BASIC' };
    resolveDefaults(linea, 25, store);
    expect(linea._pax).toBe(25);
    expect(linea._duracionMin).toBe(0);
  });

  it('cerveza: pax + qty, auto-calculates quantity from Def_Unidades_Por_Pax', () => {
    const linea = { ID_Item: 'ITEM_TICKET_CERVEZA' };
    resolveDefaults(linea, 80, store);
    expect(linea._pax).toBe(80);
    expect(linea._cantidad).toBe(40); // 80 * 0.5
  });

  it('respects Override_Pax', () => {
    const linea = { ID_Item: 'ITEM_COFFEE_BASIC', Override_Pax: 50 };
    resolveDefaults(linea, 25, store);
    expect(linea._pax).toBe(50);
  });

  it('respects Override_Duracion_Min', () => {
    const linea = { ID_Item: 'ITEM_CHINOOK', Override_Duracion_Min: 600 };
    resolveDefaults(linea, 25, store);
    expect(linea._duracionMin).toBe(600);
  });

  it('respects Override_Cantidad', () => {
    const linea = { ID_Item: 'ITEM_TICKET_CERVEZA', Override_Cantidad: 100 };
    resolveDefaults(linea, 80, store);
    expect(linea._cantidad).toBe(100);
  });
});
