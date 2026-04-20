import { describe, expect, it } from 'vitest';
import { Modalable } from './Modalable.js';

describe('Modalable', () => {
  it('opens and closes with chaining', () => {
    const ModalableClass = Modalable(class {});
    const target = new ModalableClass();

    const result = target.open().close();

    expect(result).toBe(target);
    expect(target.isOpen()).toBe(false);
  });

  it('tracks loading state', () => {
    const ModalableClass = Modalable(class {});
    const target = new ModalableClass();

    target.setLoading(true);

    expect(target.isLoading()).toBe(true);
  });

  it('adds and clears errors', () => {
    const ModalableClass = Modalable(class {});
    const target = new ModalableClass();

    target.addError('boom').addError('again').clearErrors();

    expect(target.getErrors()).toEqual([]);
  });
});
