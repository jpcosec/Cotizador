/**
 * Alpineable mixin — enforces the toDisplayObject() contract for Alpine.js reactivity.
 *
 * Usage: class Foo extends Alpineable(Base) { ... }
 *
 * Subclasses MUST implement toDisplayObject() to return a plain object
 * suitable for Alpine store assignment. The base implementation throws
 * to catch missing implementations early.
 */
export function Alpineable(Base) {
  return class extends Base {
    toDisplayObject() {
      throw new Error(
        `${this.constructor.name} must implement toDisplayObject()`
      );
    }
  };
}
