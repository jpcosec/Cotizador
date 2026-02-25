import { describe, expect, it, vi } from 'vitest';
import { Prizable } from './Prizable.js';

describe('Prizable', () => {
  it('resolves quantities from inherited context when user did not override', () => {
    const Base = class {
      _inheritedContext = {
        pax: 80,
        cantidad: 12,
        duracion: 180
      };
    };
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target.resolveQuantities();

    expect(target.pax).toBe(80);
    expect(target.cantidad).toBe(12);
    expect(target.duracion).toBe(180);
  });

  it('keeps user-set quantities during resolution', () => {
    const Base = class {
      _inheritedContext = {
        pax: 80,
        cantidad: 12,
        duracion: 180
      };
    };
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target.pax = 10;
    target.paxIsUserSet = true;
    target.resolveQuantities();

    expect(target.pax).toBe(10);
  });

  it('resolves quantities from provided container context before inherited context', () => {
    const Base = class {
      _inheritedContext = {
        pax: 80,
        cantidad: 12,
        duracion: 180
      };
    };
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target.resolveQuantities({ pax: 20, cantidad: 5, duracion: 60 });

    expect(target.pax).toBe(20);
    expect(target.cantidad).toBe(5);
    expect(target.duracion).toBe(60);
  });

  it('falls back to defaults when context has no quantity values', () => {
    const Base = class {};
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target._defaultPax = 30;
    target._defaultCantidad = 4;
    target._defaultDuracion = 90;
    target.resolveQuantities();

    expect(target.pax).toBe(30);
    expect(target.cantidad).toBe(4);
    expect(target.duracion).toBe(90);
  });

  it('calculates price with injected pricing function', () => {
    const Base = class {};
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();
    const pricingFn = vi.fn(() => 12345);

    target._profile = { porPersona: 100 };
    target._pricingFn = pricingFn;
    target.pax = 50;
    target.cantidad = 3;
    target.duracion = 120;

    const result = target.calculatePrice();

    expect(result).toBe(target);
    expect(pricingFn).toHaveBeenCalledWith(target._profile, 50, 3, 120);
    expect(target.total).toBe(12345);
  });

  it('sets price to null when pricing dependencies are missing', () => {
    const Base = class {};
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target._price = 500;
    target.calculatePrice();

    expect(target.total).toBe(0);
  });

  it('sets user quantity and recalculates price', () => {
    const Base = class {};
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();
    const pricingFn = vi.fn(() => 9000);

    target._profile = { porPersona: 100 };
    target._pricingFn = pricingFn;
    target.pax = 50;
    target.cantidad = 1;
    target.duracion = 60;

    const result = target.setUserQuantity('pax', 75);

    expect(result).toBe(target);
    expect(target.pax).toBe(75);
    expect(target.paxIsUserSet).toBe(true);
    expect(target.total).toBe(9000);
  });

  it('returns displayPrice as rounded per-pax value', () => {
    const Base = class {};
    const PrizableClass = Prizable(Base);
    const target = new PrizableClass();

    target._price = 1005;
    target.pax = 2;

    expect(target.displayPrice).toBe(503);
  });
});
