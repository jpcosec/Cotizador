export function Alpineable(Base) {
  return class extends Base {
    toDisplayObject() {
      throw new Error(`${this.constructor.name} must implement toDisplayObject()`);
    }
  };
}
