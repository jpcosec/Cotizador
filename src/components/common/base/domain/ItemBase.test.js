import { describe, expect, it } from 'vitest';
import { ItemBase } from './ItemBase.js';

class TestItem extends ItemBase {
  toDisplayObject() {
    return { total: this.total };
  }

  toStorageObject() {
    return { id: this.ID_Linea };
  }
}

describe('ItemBase', () => {
  it('composes expected domain and actor methods', () => {
    const item = new TestItem();

    expect(typeof item.resolveQuantities).toBe('function');
    expect(typeof item.calculatePrice).toBe('function');
    expect(typeof item.receiveContext).toBe('function');
    expect(typeof item.markDirty).toBe('function');
    expect(typeof item.sendEvent).toBe('function');
    expect(typeof item.toDisplayObject).toBe('function');
  });

  it('supports chained pricing flow', () => {
    const item = new TestItem();
    item._profile = { baseFijo: 0 };
    item._pricingFn = () => 100;

    const result = item.setUserQuantity('pax', 10).calculatePrice();

    expect(result).toBe(item);
    expect(item.total).toBe(100);
  });
});
