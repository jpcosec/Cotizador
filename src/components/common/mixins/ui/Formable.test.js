import { describe, expect, it } from 'vitest';
import { Formable } from './Formable.js';

describe('Formable', () => {
  it('sets and gets field values', () => {
    const FormableClass = Formable(class {});
    const target = new FormableClass();

    const result = target.setField('pax', 50);

    expect(result).toBe(target);
    expect(target.getField('pax')).toBe(50);
  });

  it('tracks field errors and supports clearing', () => {
    const FormableClass = Formable(class {});
    const target = new FormableClass();

    target.setFieldError('pax', 'required');
    expect(target.hasErrors()).toBe(true);
    target.clearFormErrors();

    expect(target.getFormErrors()).toEqual({});
    expect(target.hasErrors()).toBe(false);
  });

  it('throws if validate is not overridden', () => {
    const FormableClass = Formable(class {});
    const target = new FormableClass();

    expect(() => target.validate()).toThrow('must implement validate()');
  });
});
