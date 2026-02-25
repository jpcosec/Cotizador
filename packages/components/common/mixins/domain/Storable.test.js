import { describe, expect, it } from 'vitest';
import { Storable } from './Storable.js';

describe('Storable', () => {
  it('throws when toStorageObject is not implemented', () => {
    const StorableClass = Storable(class {});
    const target = new StorableClass();

    expect(() => target.toStorageObject()).toThrow('must implement toStorageObject()');
  });

  it('tracks dirty/clean state with chaining', () => {
    const StorableClass = Storable(class {});
    const target = new StorableClass();
    target.ID_Linea = 'L1';

    const result = target.markDirty().markClean();

    expect(result).toBe(target);
    expect(target.isSaved()).toBe(true);
  });

  it('returns false for unsaved objects without identity', () => {
    const StorableClass = Storable(class {});
    const target = new StorableClass();

    expect(target.isSaved()).toBe(false);
  });
});
