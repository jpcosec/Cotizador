import { describe, it, expect, beforeEach } from 'vitest';
import { Alpineable } from '../../../src/mixins/Alpineable.js';

describe('Alpineable Mixin', () => {
  let Base;

  beforeEach(() => {
    Base = class {};
  });

  describe('toDisplayObject() contract enforcement', () => {
    it('should throw an Error when toDisplayObject() is not overridden', () => {
      const AlpineableClass = class extends Alpineable(Base) {};
      const instance = new AlpineableClass();

      expect(() => instance.toDisplayObject()).toThrow(Error);
    });

    it('should include the class name in the error message', () => {
      const MyCustomClass = class extends Alpineable(Base) {};
      const instance = new MyCustomClass();

      expect(() => instance.toDisplayObject()).toThrow(
        /MyCustomClass must implement toDisplayObject/
      );
    });

    it('should include the exact error message text', () => {
      const TestClass = class extends Alpineable(Base) {};
      const instance = new TestClass();

      expect(() => instance.toDisplayObject()).toThrow(
        'TestClass must implement toDisplayObject()'
      );
    });
  });

  describe('toDisplayObject() override', () => {
    it('should not throw when toDisplayObject() is overridden', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return { key: 'value' };
        }
      };
      const instance = new AlpineableClass();

      expect(() => instance.toDisplayObject()).not.toThrow();
    });

    it('should return the value from the overridden toDisplayObject()', () => {
      const displayObj = { name: 'Test', count: 42 };
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return displayObj;
        }
      };
      const instance = new AlpineableClass();

      expect(instance.toDisplayObject()).toBe(displayObj);
    });

    it('should return a plain object from toDisplayObject()', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return { id: 1, name: 'Item', price: 99.99 };
        }
      };
      const instance = new AlpineableClass();
      const result = instance.toDisplayObject();

      expect(result).toEqual({ id: 1, name: 'Item', price: 99.99 });
      expect(typeof result).toBe('object');
    });

    it('should allow toDisplayObject() to return an empty object', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return {};
        }
      };
      const instance = new AlpineableClass();

      expect(instance.toDisplayObject()).toEqual({});
    });

    it('should allow toDisplayObject() to return null', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return null;
        }
      };
      const instance = new AlpineableClass();

      expect(instance.toDisplayObject()).toBeNull();
    });

    it('should allow toDisplayObject() to return undefined', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return undefined;
        }
      };
      const instance = new AlpineableClass();

      expect(instance.toDisplayObject()).toBeUndefined();
    });

    it('should allow toDisplayObject() to return an array', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return [1, 2, 3];
        }
      };
      const instance = new AlpineableClass();

      expect(instance.toDisplayObject()).toEqual([1, 2, 3]);
    });
  });

  describe('multiple subclass independence', () => {
    it('should allow each subclass its own toDisplayObject() implementation', () => {
      const SubclassA = class extends Alpineable(Base) {
        toDisplayObject() {
          return { type: 'A', value: 100 };
        }
      };

      const SubclassB = class extends Alpineable(Base) {
        toDisplayObject() {
          return { type: 'B', value: 200 };
        }
      };

      const instanceA = new SubclassA();
      const instanceB = new SubclassB();

      expect(instanceA.toDisplayObject()).toEqual({ type: 'A', value: 100 });
      expect(instanceB.toDisplayObject()).toEqual({ type: 'B', value: 200 });
    });

    it('should throw for subclass that does not override', () => {
      const SubclassWithImpl = class extends Alpineable(Base) {
        toDisplayObject() {
          return { implemented: true };
        }
      };

      const SubclassWithoutImpl = class extends Alpineable(Base) {};

      const instanceWithImpl = new SubclassWithImpl();
      const instanceWithoutImpl = new SubclassWithoutImpl();

      expect(() => instanceWithImpl.toDisplayObject()).not.toThrow();
      expect(() => instanceWithoutImpl.toDisplayObject()).toThrow();
    });

    it('should keep implementations separate across instances', () => {
      const ClassA = class extends Alpineable(Base) {
        toDisplayObject() {
          return { id: 'a' };
        }
      };

      const ClassB = class extends Alpineable(Base) {
        toDisplayObject() {
          return { id: 'b' };
        }
      };

      const a1 = new ClassA();
      const a2 = new ClassA();
      const b1 = new ClassB();

      expect(a1.toDisplayObject()).toEqual({ id: 'a' });
      expect(a2.toDisplayObject()).toEqual({ id: 'a' });
      expect(b1.toDisplayObject()).toEqual({ id: 'b' });
    });
  });

  describe('inheritance chains', () => {
    it('should work with deep inheritance chains', () => {
      const GrandparentClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return { level: 'grandparent' };
        }
      };

      const ParentClass = class extends GrandparentClass {};
      const ChildClass = class extends ParentClass {};

      const instance = new ChildClass();
      expect(instance.toDisplayObject()).toEqual({ level: 'grandparent' });
    });

    it('should allow override at any level in the chain', () => {
      const GrandparentClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return { level: 'grandparent' };
        }
      };

      const ParentClass = class extends GrandparentClass {
        toDisplayObject() {
          return { level: 'parent' };
        }
      };

      const ChildClass = class extends ParentClass {};

      const grandparent = new GrandparentClass();
      const parent = new ParentClass();
      const child = new ChildClass();

      expect(grandparent.toDisplayObject()).toEqual({ level: 'grandparent' });
      expect(parent.toDisplayObject()).toEqual({ level: 'parent' });
      expect(child.toDisplayObject()).toEqual({ level: 'parent' });
    });

    it('should throw at any level that does not implement toDisplayObject()', () => {
      const MissingImpl = class extends Alpineable(Base) {};
      const instance = new MissingImpl();

      expect(() => instance.toDisplayObject()).toThrow(
        'MissingImpl must implement toDisplayObject()'
      );
    });
  });

  describe('dynamic toDisplayObject() behavior', () => {
    it('should support toDisplayObject() that computes values', () => {
      const DynamicClass = class extends Alpineable(Base) {
        constructor() {
          super();
          this.count = 5;
        }

        toDisplayObject() {
          return { doubled: this.count * 2 };
        }
      };

      const instance = new DynamicClass();
      expect(instance.toDisplayObject()).toEqual({ doubled: 10 });

      instance.count = 20;
      expect(instance.toDisplayObject()).toEqual({ doubled: 40 });
    });

    it('should support toDisplayObject() that references instance properties', () => {
      const PropertyClass = class extends Alpineable(Base) {
        constructor(name, price) {
          super();
          this.name = name;
          this.price = price;
        }

        toDisplayObject() {
          return { name: this.name, price: this.price };
        }
      };

      const instance = new PropertyClass('Widget', 99);
      expect(instance.toDisplayObject()).toEqual({ name: 'Widget', price: 99 });
    });

    it('should support conditional logic in toDisplayObject()', () => {
      const ConditionalClass = class extends Alpineable(Base) {
        constructor(value) {
          super();
          this.value = value;
        }

        toDisplayObject() {
          return {
            status: this.value > 100 ? 'high' : 'low',
            value: this.value
          };
        }
      };

      const high = new ConditionalClass(150);
      const low = new ConditionalClass(50);

      expect(high.toDisplayObject()).toEqual({ status: 'high', value: 150 });
      expect(low.toDisplayObject()).toEqual({ status: 'low', value: 50 });
    });
  });

  describe('edge cases', () => {
    it('should work with minimal Base class', () => {
      const MinimalBase = class {};
      const AlpineableClass = class extends Alpineable(MinimalBase) {
        toDisplayObject() {
          return { minimal: true };
        }
      };

      const instance = new AlpineableClass();
      expect(instance.toDisplayObject()).toEqual({ minimal: true });
    });

    it('should work with Base class that has methods', () => {
      const BaseWithMethods = class {
        getValue() {
          return 42;
        }
      };

      const AlpineableClass = class extends Alpineable(BaseWithMethods) {
        toDisplayObject() {
          return { value: this.getValue() };
        }
      };

      const instance = new AlpineableClass();
      expect(instance.toDisplayObject()).toEqual({ value: 42 });
      expect(instance.getValue()).toBe(42);
    });

    it('should preserve Base constructor behavior', () => {
      const BaseWithConstructor = class {
        constructor(initialValue) {
          this.value = initialValue;
        }
      };

      const AlpineableClass = class extends Alpineable(BaseWithConstructor) {
        constructor(initialValue) {
          super(initialValue);
          this.doubled = initialValue * 2;
        }

        toDisplayObject() {
          return { original: this.value, doubled: this.doubled };
        }
      };

      const instance = new AlpineableClass(10);
      expect(instance.toDisplayObject()).toEqual({ original: 10, doubled: 20 });
    });

    it('should work with Base that has static methods', () => {
      const BaseWithStatic = class {
        static create() {
          return new this();
        }
      };

      const AlpineableClass = class extends Alpineable(BaseWithStatic) {
        toDisplayObject() {
          return { created: true };
        }
      };

      const instance = AlpineableClass.create();
      expect(instance.toDisplayObject()).toEqual({ created: true });
    });
  });

  describe('Alpine.js compatibility', () => {
    it('should return serializable object suitable for Alpine store', () => {
      const AlpineableClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return { id: 1, name: 'Item', active: true };
        }
      };

      const instance = new AlpineableClass();
      const displayObj = instance.toDisplayObject();

      // Should be JSON serializable
      expect(() => JSON.stringify(displayObj)).not.toThrow();
      expect(JSON.parse(JSON.stringify(displayObj))).toEqual(displayObj);
    });

    it('should support reactive properties in display object', () => {
      const ReactiveClass = class extends Alpineable(Base) {
        constructor() {
          super();
          this._count = 0;
        }

        increment() {
          this._count++;
        }

        toDisplayObject() {
          return { count: this._count };
        }
      };

      const instance = new ReactiveClass();
      expect(instance.toDisplayObject()).toEqual({ count: 0 });

      instance.increment();
      expect(instance.toDisplayObject()).toEqual({ count: 1 });

      instance.increment();
      expect(instance.toDisplayObject()).toEqual({ count: 2 });
    });

    it('should handle nested objects in toDisplayObject()', () => {
      const NestedClass = class extends Alpineable(Base) {
        toDisplayObject() {
          return {
            user: { id: 1, name: 'Alice' },
            settings: { theme: 'dark', notifications: true }
          };
        }
      };

      const instance = new NestedClass();
      const result = instance.toDisplayObject();

      expect(result.user).toEqual({ id: 1, name: 'Alice' });
      expect(result.settings).toEqual({ theme: 'dark', notifications: true });
    });

    it('should handle arrays in toDisplayObject()', () => {
      const ArrayClass = class extends Alpineable(Base) {
        constructor(items) {
          super();
          this.items = items;
        }

        toDisplayObject() {
          return { items: this.items.map(item => ({ ...item })) };
        }
      };

      const instance = new ArrayClass([
        { id: 1, label: 'A' },
        { id: 2, label: 'B' }
      ]);

      const result = instance.toDisplayObject();
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ id: 1, label: 'A' });
      expect(result.items[1]).toEqual({ id: 2, label: 'B' });
    });
  });
});
