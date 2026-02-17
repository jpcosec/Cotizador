import { describe, it, expect } from 'vitest';
import { calculateLinePrice, resolvePerfil } from '../../src/Pipeline/04_pricing.js';
import { resolveDefaults } from '../../src/Pipeline/03_defaults.js';
import { createSeededStore } from '../helpers/store_factory.js';

describe('04_pricing — Base Price Calculation', () => {
  const store = createSeededStore();

  function pricedLine(itemId, overrides = {}, paxGlobal = 80) {
    const linea = { ID_Item: itemId, ...overrides };
    resolveDefaults(linea, { paxGlobal }, store);
    calculateLinePrice(linea, store);
    return linea;
  }

  it('Salon Chinook (fixed): _netoBase=385,000', () => {
    const linea = pricedLine('ITEM_CHINOOK');
    expect(linea._netoBase).toBe(385000);
  });

  it('Coffee Basic (per-pax, 25 pax): Cp=6,380 × 25 = 159,500', () => {
    const linea = pricedLine('ITEM_COFFEE_BASIC', {}, 25);
    expect(linea._netoBase).toBe(6380 * 25);
  });

  it('Ticket Cerveza (per-unit, 40 units from 80 pax × 0.5): Cq=3,529 × 40', () => {
    const linea = pricedLine('ITEM_TICKET_CERVEZA');
    expect(linea._cantidad).toBe(40);
    expect(linea._netoBase).toBe(3529 * 40);
  });

  it('Caminata (base + per-pax): 300,000 + 80×10,000 = 1,100,000', () => {
    const linea = pricedLine('ITEM_CAMINATA');
    expect(linea._netoBase).toBe(300000 + 80 * 10000);
  });

  it('Item with profile override → uses override profile, not category', () => {
    const linea = pricedLine('ITEM_CHINOOK');
    expect(linea._perfil).toBe('PP_SALON_CHINOOK');
  });

  it('Item without override → uses category default profile', () => {
    const linea = pricedLine('ITEM_BEBIDA_LATA');
    expect(linea._perfil).toBe('PP_PER_UNIT_BEBIDA');
  });

  it('Pack parent (no pricing profile override, cat default is per-pax) → still gets a profile', () => {
    // PACK_COFFEE_COMPLETO has no override, falls back to CAT_COFFEE default
    const perfil = resolvePerfil({ ID_Item: 'PACK_COFFEE_COMPLETO' }, store);
    expect(perfil).not.toBeNull();
  });
});
