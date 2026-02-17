import { describe, it, expect } from 'vitest';
import { resolvePerfil, calculateLinePrice } from '../../../src/Pricing/pricing.js';
import { createSeededStore } from '../../helpers/store_factory.js';

describe('Pricing/pricing', () => {
  const store = createSeededStore();

  it('resolvePerfil uses item override when present', () => {
    const linea = { ID_Item: 'ITEM_CHINOOK' };
    const perfil = resolvePerfil(linea, store);
    expect(perfil.ID_Perfil_Precio).toBe('PP_SALON_CHINOOK');
  });

  it('resolvePerfil falls back to category default', () => {
    const linea = { ID_Item: 'ITEM_BEBIDA_LATA' };
    const perfil = resolvePerfil(linea, store);
    expect(perfil.ID_Perfil_Precio).toBe('PP_PER_UNIT_BEBIDA');
  });

  it('calculateLinePrice: salon fixed = 385,000', () => {
    const linea = { ID_Item: 'ITEM_CHINOOK', _pax: 0, _duracionMin: 480, _cantidad: 0 };
    calculateLinePrice(linea, store);
    expect(linea._netoBase).toBe(385000);
  });

  it('calculateLinePrice: coffee per pax = 6380 * pax', () => {
    const linea = { ID_Item: 'ITEM_COFFEE_BASIC', _pax: 25, _duracionMin: 0, _cantidad: 0 };
    calculateLinePrice(linea, store);
    expect(linea._netoBase).toBe(6380 * 25);
  });

  it('calculateLinePrice: cerveza per unit = 3529 * qty', () => {
    const linea = { ID_Item: 'ITEM_TICKET_CERVEZA', _pax: 80, _duracionMin: 0, _cantidad: 40 };
    calculateLinePrice(linea, store);
    expect(linea._netoBase).toBe(3529 * 40);
  });

  it('calculateLinePrice: activity base + per pax', () => {
    const linea = { ID_Item: 'ITEM_CAMINATA', _pax: 80, _duracionMin: 0, _cantidad: 0 };
    calculateLinePrice(linea, store);
    expect(linea._netoBase).toBe(300000 + 10000 * 80);
  });

  it('calculateLinePrice: DJ large fixed = 1,200,000', () => {
    const linea = { ID_Item: 'ITEM_DJ_LARGE', _pax: 0, _duracionMin: 0, _cantidad: 0 };
    calculateLinePrice(linea, store);
    expect(linea._netoBase).toBe(1200000);
  });
});
