import { describe, it, expect, beforeEach } from 'vitest';
import { Prizable } from '../../../src/mixins/Prizable.js';

describe('Prizable Mixin', () => {
  let PrizableItem;

  beforeEach(() => {
    class Base {}
    PrizableItem = class extends Prizable(Base) {};
  });

  describe('initial state', () => {
    it('should initialize all quantities as null', () => {
      const item = new PrizableItem();
      expect(item.pax).toBeNull();
      expect(item.cantidad).toBeNull();
      expect(item.duracion).toBeNull();
    });

    it('should initialize all isUserSet flags as false', () => {
      const item = new PrizableItem();
      expect(item.paxIsUserSet).toBe(false);
      expect(item.cantidadIsUserSet).toBe(false);
      expect(item.duracionIsUserSet).toBe(false);
    });

    it('should initialize internal state to null', () => {
      const item = new PrizableItem();
      expect(item._profile).toBeNull();
      expect(item._price).toBeNull();
      expect(item._defaultPax).toBeNull();
      expect(item._defaultCantidad).toBeNull();
      expect(item._defaultDuracion).toBeNull();
      expect(item._pricingFn).toBeNull();
    });
  });

  describe('resolveQuantities with containerContext', () => {
    it('should set pax from containerContext when not user-set', () => {
      const item = new PrizableItem();
      item.resolveQuantities({ pax: 100 });
      expect(item.pax).toBe(100);
    });

    it('should set cantidad from containerContext when not user-set', () => {
      const item = new PrizableItem();
      item.resolveQuantities({ cantidad: 50 });
      expect(item.cantidad).toBe(50);
    });

    it('should set duracion from containerContext when not user-set', () => {
      const item = new PrizableItem();
      item.resolveQuantities({ duracion: 4 });
      expect(item.duracion).toBe(4);
    });

    it('should set all quantities from containerContext at once', () => {
      const item = new PrizableItem();
      item.resolveQuantities({ pax: 100, cantidad: 50, duracion: 4 });
      expect(item.pax).toBe(100);
      expect(item.cantidad).toBe(50);
      expect(item.duracion).toBe(4);
    });
  });

  describe('resolveQuantities with item defaults', () => {
    it('should fall back to _defaultPax when no containerContext', () => {
      const item = new PrizableItem();
      item._defaultPax = 75;
      item.resolveQuantities({});
      expect(item.pax).toBe(75);
    });

    it('should fall back to _defaultCantidad when no containerContext', () => {
      const item = new PrizableItem();
      item._defaultCantidad = 25;
      item.resolveQuantities({});
      expect(item.cantidad).toBe(25);
    });

    it('should fall back to _defaultDuracion when no containerContext', () => {
      const item = new PrizableItem();
      item._defaultDuracion = 3;
      item.resolveQuantities({});
      expect(item.duracion).toBe(3);
    });

    it('should fall back to all defaults at once', () => {
      const item = new PrizableItem();
      item._defaultPax = 75;
      item._defaultCantidad = 25;
      item._defaultDuracion = 3;
      item.resolveQuantities({});
      expect(item.pax).toBe(75);
      expect(item.cantidad).toBe(25);
      expect(item.duracion).toBe(3);
    });
  });

  describe('resolveQuantities priority: containerContext > defaults', () => {
    it('should prefer containerContext over _defaultPax', () => {
      const item = new PrizableItem();
      item._defaultPax = 75;
      item.resolveQuantities({ pax: 100 });
      expect(item.pax).toBe(100);
    });

    it('should prefer containerContext over _defaultCantidad', () => {
      const item = new PrizableItem();
      item._defaultCantidad = 25;
      item.resolveQuantities({ cantidad: 50 });
      expect(item.cantidad).toBe(50);
    });

    it('should prefer containerContext over _defaultDuracion', () => {
      const item = new PrizableItem();
      item._defaultDuracion = 2;
      item.resolveQuantities({ duracion: 4 });
      expect(item.duracion).toBe(4);
    });
  });

  describe('resolveQuantities respects paxIsUserSet', () => {
    it('should skip pax when paxIsUserSet is true', () => {
      const item = new PrizableItem();
      item.pax = 200;
      item.paxIsUserSet = true;
      item.resolveQuantities({ pax: 100 });
      expect(item.pax).toBe(200);
    });

    it('should skip pax even if default exists when paxIsUserSet is true', () => {
      const item = new PrizableItem();
      item.pax = 200;
      item.paxIsUserSet = true;
      item._defaultPax = 75;
      item.resolveQuantities({});
      expect(item.pax).toBe(200);
    });
  });

  describe('resolveQuantities respects cantidadIsUserSet', () => {
    it('should skip cantidad when cantidadIsUserSet is true', () => {
      const item = new PrizableItem();
      item.cantidad = 75;
      item.cantidadIsUserSet = true;
      item.resolveQuantities({ cantidad: 50 });
      expect(item.cantidad).toBe(75);
    });

    it('should skip cantidad even if default exists when cantidadIsUserSet is true', () => {
      const item = new PrizableItem();
      item.cantidad = 75;
      item.cantidadIsUserSet = true;
      item._defaultCantidad = 25;
      item.resolveQuantities({});
      expect(item.cantidad).toBe(75);
    });
  });

  describe('resolveQuantities respects duracionIsUserSet', () => {
    it('should skip duracion when duracionIsUserSet is true', () => {
      const item = new PrizableItem();
      item.duracion = 5;
      item.duracionIsUserSet = true;
      item.resolveQuantities({ duracion: 4 });
      expect(item.duracion).toBe(5);
    });

    it('should skip duracion even if default exists when duracionIsUserSet is true', () => {
      const item = new PrizableItem();
      item.duracion = 5;
      item.duracionIsUserSet = true;
      item._defaultDuracion = 2;
      item.resolveQuantities({});
      expect(item.duracion).toBe(5);
    });
  });

  describe('resolveQuantities with empty context and no defaults', () => {
    it('should leave quantities as null', () => {
      const item = new PrizableItem();
      item.resolveQuantities({});
      expect(item.pax).toBeNull();
      expect(item.cantidad).toBeNull();
      expect(item.duracion).toBeNull();
    });

    it('should leave undefined containerContext as null', () => {
      const item = new PrizableItem();
      item.resolveQuantities(undefined);
      expect(item.pax).toBeNull();
      expect(item.cantidad).toBeNull();
      expect(item.duracion).toBeNull();
    });
  });

  describe('calculatePrice', () => {
    it('should call pricingFn with profile, pax, cantidad, duracion', () => {
      const item = new PrizableItem();
      const profile = { id: 'p1' };
      item._profile = profile;
      item.pax = 100;
      item.cantidad = 50;
      item.duracion = 4;

      const mockPricingFn = vi.fn().mockReturnValue(5000);
      item._pricingFn = mockPricingFn;

      item.calculatePrice();

      expect(mockPricingFn).toHaveBeenCalledOnce();
      expect(mockPricingFn).toHaveBeenCalledWith(profile, 100, 50, 4);
    });

    it('should set _price to the result of pricingFn', () => {
      const item = new PrizableItem();
      item._profile = { id: 'p1' };
      item._pricingFn = vi.fn().mockReturnValue(5000);

      item.calculatePrice();

      expect(item._price).toBe(5000);
    });

    it('should set _price to null when no profile', () => {
      const item = new PrizableItem();
      item._profile = null;
      item._pricingFn = vi.fn().mockReturnValue(5000);
      item._price = 9999;

      item.calculatePrice();

      expect(item._price).toBeNull();
    });

    it('should set _price to null when no pricingFn', () => {
      const item = new PrizableItem();
      item._profile = { id: 'p1' };
      item._pricingFn = null;
      item._price = 9999;

      item.calculatePrice();

      expect(item._price).toBeNull();
    });

    it('should set _price to null when both profile and pricingFn are null', () => {
      const item = new PrizableItem();
      item._profile = null;
      item._pricingFn = null;
      item._price = 9999;

      item.calculatePrice();

      expect(item._price).toBeNull();
    });

    it('should not call pricingFn when profile is null', () => {
      const item = new PrizableItem();
      item._profile = null;
      const mockPricingFn = vi.fn();
      item._pricingFn = mockPricingFn;

      item.calculatePrice();

      expect(mockPricingFn).not.toHaveBeenCalled();
    });

    it('should not call pricingFn when pricingFn is null', () => {
      const item = new PrizableItem();
      item._profile = { id: 'p1' };
      item._pricingFn = null;

      expect(() => item.calculatePrice()).not.toThrow();
    });
  });

  describe('total getter', () => {
    it('should return 0 when _price is null', () => {
      const item = new PrizableItem();
      item._price = null;
      expect(item.total).toBe(0);
    });

    it('should return _price when set', () => {
      const item = new PrizableItem();
      item._price = 5000;
      expect(item.total).toBe(5000);
    });

    it('should return 0 when _price is 0', () => {
      const item = new PrizableItem();
      item._price = 0;
      expect(item.total).toBe(0);
    });
  });

  describe('displayPrice getter', () => {
    it('should return 0 when _price is null', () => {
      const item = new PrizableItem();
      item._price = null;
      item.pax = 100;
      expect(item.displayPrice).toBe(0);
    });

    it('should return _price / pax when both set', () => {
      const item = new PrizableItem();
      item._price = 5000;
      item.pax = 100;
      expect(item.displayPrice).toBe(50);
    });

    it('should round displayPrice', () => {
      const item = new PrizableItem();
      item._price = 5050;
      item.pax = 100;
      expect(item.displayPrice).toBe(51);
    });

    it('should use 1 as divisor when pax is null', () => {
      const item = new PrizableItem();
      item._price = 5000;
      item.pax = null;
      expect(item.displayPrice).toBe(5000);
    });

    it('should use 1 as divisor when pax is 0', () => {
      const item = new PrizableItem();
      item._price = 5000;
      item.pax = 0;
      expect(item.displayPrice).toBe(5000);
    });

    it('should round correctly with fractional division', () => {
      const item = new PrizableItem();
      item._price = 1000;
      item.pax = 3;
      expect(item.displayPrice).toBe(333);
    });

    it('should round correctly up', () => {
      const item = new PrizableItem();
      item._price = 1005;
      item.pax = 3;
      expect(item.displayPrice).toBe(335);
    });
  });

  describe('integration: resolve → calculate → display', () => {
    it('should resolve quantities, calculate price, and display correctly', () => {
      const item = new PrizableItem();
      item._defaultPax = 75;
      item._profile = { id: 'p1' };
      item._pricingFn = (profile, pax, cantidad, duracion) => pax * 100;

      item.resolveQuantities({ pax: 100 });
      item.calculatePrice();

      expect(item.pax).toBe(100);
      expect(item._price).toBe(10000);
      expect(item.displayPrice).toBe(100);
      expect(item.total).toBe(10000);
    });

    it('should prioritize user-set values in full workflow', () => {
      const item = new PrizableItem();
      item.pax = 200;
      item.paxIsUserSet = true;
      item._defaultPax = 75;
      item._profile = { id: 'p1' };
      item._pricingFn = (profile, pax) => pax * 100;

      item.resolveQuantities({ pax: 100 });
      item.calculatePrice();

      expect(item.pax).toBe(200);
      expect(item._price).toBe(20000);
      expect(item.displayPrice).toBe(100);
    });

    it('should cascade containerContext → default → null', () => {
      const item = new PrizableItem();
      item._defaultPax = 75;
      item._defaultCantidad = 25;
      item._profile = { id: 'p1' };
      item._pricingFn = (profile, pax, cantidad) => (pax ?? 1) * (cantidad ?? 1);

      item.resolveQuantities({ pax: 100 });
      item.calculatePrice();

      expect(item.pax).toBe(100);
      expect(item.cantidad).toBe(25);
      expect(item._price).toBe(2500);
    });

    it('should handle null pax in displayPrice correctly', () => {
      const item = new PrizableItem();
      item._profile = { id: 'p1' };
      item._pricingFn = () => 5000;

      item.resolveQuantities({});
      item.calculatePrice();

      expect(item.pax).toBeNull();
      expect(item._price).toBe(5000);
      expect(item.displayPrice).toBe(5000);
    });
  });

  describe('edge cases', () => {
    it('should handle negative prices', () => {
      const item = new PrizableItem();
      item._price = -1000;
      item.pax = 100;
      expect(item.displayPrice).toBe(-10);
    });

    it('should handle very large prices', () => {
      const item = new PrizableItem();
      item._price = 999999999;
      item.pax = 100;
      expect(item.displayPrice).toBe(10000000);
    });

    it('should preserve user-set flag across resolveQuantities calls', () => {
      const item = new PrizableItem();
      item.pax = 200;
      item.paxIsUserSet = true;

      item.resolveQuantities({ pax: 100 });
      expect(item.paxIsUserSet).toBe(true);

      item.resolveQuantities({ pax: 150 });
      expect(item.pax).toBe(200);
      expect(item.paxIsUserSet).toBe(true);
    });
  });
});
