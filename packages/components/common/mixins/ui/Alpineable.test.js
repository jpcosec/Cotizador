import { describe, expect, it } from 'vitest';
import { Alpineable } from './Alpineable.js';

describe('Alpineable', () => {
  it('throws when subclass does not implement toDisplayObject', () => {
    const AlpineableClass = Alpineable(class {});
    const target = new AlpineableClass();

    expect(() => target.toDisplayObject()).toThrow('must implement toDisplayObject()');
  });

  it('allows subclasses to implement toDisplayObject', () => {
    class Custom extends Alpineable(class {}) {
      toDisplayObject() {
        return { ok: true };
      }
    }

    expect(new Custom().toDisplayObject()).toEqual({ ok: true });
  });
});
