import { describe, expect, it } from 'vitest';
import { ContainerBase } from './ContainerBase.js';

class TestContainer extends ContainerBase {
  toDisplayObject() {
    return { subtotal: this.subtotal };
  }

  toStorageObject() {
    return { id: this.ID_Cotizacion };
  }
}

describe('ContainerBase', () => {
  it('composes expected container methods', () => {
    const container = new TestContainer();

    expect(typeof container.addChild).toBe('function');
    expect(typeof container.aggregate).toBe('function');
    expect(typeof container.receiveContext).toBe('function');
    expect(typeof container.markDirty).toBe('function');
    expect(typeof container.sendEvent).toBe('function');
    expect(typeof container.toDisplayObject).toBe('function');
  });

  it('aggregates child totals via mixin', () => {
    const container = new TestContainer();
    container
      .addChild('a', { total: 10 })
      .addChild('b', { aggregate: () => ({ subtotal: 5, breakdown: [] }) });

    const result = container.aggregate();

    expect(result.subtotal).toBe(15);
    expect(container.toDisplayObject()).toEqual({ subtotal: 15 });
  });
});
