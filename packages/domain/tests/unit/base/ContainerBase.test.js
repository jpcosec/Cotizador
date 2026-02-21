import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContainerBase } from '../../../src/base/ContainerBase.js';

describe('ContainerBase', () => {
  let container;

  beforeEach(() => {
    container = new ContainerBase();
  });

  // ── Instantiation ──────────────────────────────────────────────

  describe('instantiation', () => {
    it('should create with empty _children Map', () => {
      expect(container._children).toBeInstanceOf(Map);
      expect(container._children.size).toBe(0);
    });

    it('should create with empty _calculationParams', () => {
      expect(container._calculationParams).toEqual({});
    });

    it('should create with null _evaluator', () => {
      expect(container._evaluator).toBeNull();
    });

    it('should have empty _rules array from Rulable mixin', () => {
      expect(container._rules).toEqual([]);
    });

    it('should have empty _appliedRules array from Rulable mixin', () => {
      expect(container._appliedRules).toEqual([]);
    });

    it('should have empty _inheritedContext from Rulable mixin', () => {
      expect(container._inheritedContext).toEqual({});
    });

    it('should have null _actorRef from XStateable mixin', () => {
      expect(container._actorRef).toBeNull();
    });
  });

  // ── Child management ───────────────────────────────────────────

  describe('child management', () => {
    it('should add child with addChild', () => {
      const child = { id: 'child1', _price: 100 };
      container.addChild('child1', child);

      expect(container.childCount).toBe(1);
      expect(container.getChild('child1')).toBe(child);
    });

    it('should return this from addChild for chaining', () => {
      const result = container.addChild('child1', {});
      expect(result).toBe(container);
    });

    it('should add multiple children', () => {
      container.addChild('c1', { id: 'c1', _price: 100 });
      container.addChild('c2', { id: 'c2', _price: 200 });
      container.addChild('c3', { id: 'c3', _price: 300 });

      expect(container.childCount).toBe(3);
    });

    it('should overwrite child when adding with same id', () => {
      const child1 = { id: 'child1', _price: 100 };
      const child2 = { id: 'child1', _price: 200 };

      container.addChild('child1', child1);
      container.addChild('child1', child2);

      expect(container.childCount).toBe(1);
      expect(container.getChild('child1')).toBe(child2);
    });

    it('should retrieve child with getChild', () => {
      const child = { id: 'child1', _price: 100 };
      container.addChild('child1', child);

      expect(container.getChild('child1')).toBe(child);
    });

    it('should return null from getChild when child not found', () => {
      expect(container.getChild('nonexistent')).toBeNull();
    });

    it('should remove child with removeChild', () => {
      container.addChild('c1', { id: 'c1' });
      container.addChild('c2', { id: 'c2' });

      container.removeChild('c1');

      expect(container.childCount).toBe(1);
      expect(container.getChild('c1')).toBeNull();
      expect(container.getChild('c2')).not.toBeNull();
    });

    it('should return this from removeChild for chaining', () => {
      container.addChild('c1', {});
      const result = container.removeChild('c1');
      expect(result).toBe(container);
    });

    it('should handle removing nonexistent child silently', () => {
      expect(() => container.removeChild('nonexistent')).not.toThrow();
      expect(container.childCount).toBe(0);
    });

    it('should iterate children with children() generator', () => {
      const c1 = { id: 'c1' };
      const c2 = { id: 'c2' };
      const c3 = { id: 'c3' };

      container.addChild('1', c1);
      container.addChild('2', c2);
      container.addChild('3', c3);

      const children = [...container.children()];

      expect(children).toHaveLength(3);
      expect(children).toContain(c1);
      expect(children).toContain(c2);
      expect(children).toContain(c3);
    });

    it('should yield nothing from children() when empty', () => {
      const children = [...container.children()];
      expect(children).toEqual([]);
    });
  });

  // ── Context propagation ────────────────────────────────────────

  describe('context propagation', () => {
    it('should propagate _calculationParams to children', () => {
      const mockChild = { receiveContext: vi.fn() };
      container.setCalculationParams({ pax: 50, duracion: 8 });
      container.addChild('c1', mockChild);

      container.pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({ pax: 50, duracion: 8 })
      );
    });

    it('should propagate inherited context to children', () => {
      const mockChild = { receiveContext: vi.fn() };
      container.receiveContext({ eventType: 'wedding', venue: 'lodge' });
      container.addChild('c1', mockChild);

      container.pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'wedding', venue: 'lodge' })
      );
    });

    it('should merge _calculationParams and inherited context', () => {
      const mockChild = { receiveContext: vi.fn() };
      container.setCalculationParams({ pax: 50 });
      container.receiveContext({ eventType: 'wedding' });
      container.addChild('c1', mockChild);

      container.pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({ pax: 50, eventType: 'wedding' })
      );
    });

    it('should call receiveContext on all children', () => {
      const mock1 = { receiveContext: vi.fn() };
      const mock2 = { receiveContext: vi.fn() };
      const mock3 = { receiveContext: vi.fn() };

      container.addChild('c1', mock1);
      container.addChild('c2', mock2);
      container.addChild('c3', mock3);

      container.pushContextToChildren();

      expect(mock1.receiveContext).toHaveBeenCalled();
      expect(mock2.receiveContext).toHaveBeenCalled();
      expect(mock3.receiveContext).toHaveBeenCalled();
    });

    it('should skip children without receiveContext method', () => {
      const mockWithMethod = { receiveContext: vi.fn() };
      const mockWithout = {}; // no receiveContext
      const mockNull = null;

      container.addChild('with', mockWithMethod);
      container.addChild('without', mockWithout);

      expect(() => {
        container.pushContextToChildren();
      }).not.toThrow();

      expect(mockWithMethod.receiveContext).toHaveBeenCalled();
    });

    it('should return this from pushContextToChildren for chaining', () => {
      const result = container.pushContextToChildren();
      expect(result).toBe(container);
    });

    it('should evaluate rules if _evaluator is set', () => {
      const mockEvaluator = vi.fn().mockReturnValue({
        delta: 100,
        description: 'test rule',
        field: 'discount',
        value: 10,
      });

      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];
      container._evaluator = mockEvaluator;
      container.addChild('c1', { receiveContext: vi.fn() });

      container.pushContextToChildren();

      expect(mockEvaluator).toHaveBeenCalled();
      expect(container._appliedRules).toHaveLength(1);
    });

    it('should not evaluate rules if _evaluator is null', () => {
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];
      container._evaluator = null;

      expect(() => {
        container.pushContextToChildren();
      }).not.toThrow();
    });

    it('should include rule outputs in propagated context', () => {
      const mockEvaluator = vi.fn().mockReturnValue({
        delta: 100,
        field: 'appliedDiscount',
        value: 15,
      });

      const mockChild = { receiveContext: vi.fn() };
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];
      container._evaluator = mockEvaluator;
      container.setCalculationParams({ pax: 50 });
      container.addChild('c1', mockChild);

      container.pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({
          pax: 50,
          appliedDiscount: 15,
        })
      );
    });

    it('should give rule outputs highest priority in context merge', () => {
      const mockEvaluator = vi.fn().mockReturnValue({
        delta: 100,
        field: 'pax',
        value: 999, // override param
      });

      const mockChild = { receiveContext: vi.fn() };
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];
      container._evaluator = mockEvaluator;
      container.setCalculationParams({ pax: 50 });
      container.addChild('c1', mockChild);

      container.pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({ pax: 999 })
      );
    });
  });

  // ── Aggregation (from Aggregable mixin) ─────────────────────────

  describe('aggregation', () => {
    it('should aggregate leaf children with _price property', () => {
      container.addChild('i1', { id: 'i1', _price: 100 });
      container.addChild('i2', { id: 'i2', _price: 200 });
      container.addChild('i3', { id: 'i3', _price: 300 });

      const result = container.aggregate();

      expect(result.subtotal).toBe(600);
      expect(result.breakdown).toHaveLength(3);
    });

    it('should aggregate nested containers recursively', () => {
      const nested = new ContainerBase();
      nested.addChild('n1', { id: 'n1', _price: 50 });
      nested.addChild('n2', { id: 'n2', _price: 75 });

      container.addChild('nested', nested);
      container.addChild('leaf', { id: 'leaf', _price: 100 });

      const result = container.aggregate();

      expect(result.subtotal).toBe(225); // 50 + 75 + 100
    });

    it('should handle zero prices', () => {
      container.addChild('i1', { id: 'i1', _price: 0 });
      container.addChild('i2', { id: 'i2', _price: 0 });

      const result = container.aggregate();

      expect(result.subtotal).toBe(0);
      expect(result.breakdown).toHaveLength(2);
    });

    it('should handle missing _price as 0', () => {
      container.addChild('i1', { id: 'i1' }); // no _price
      container.addChild('i2', { id: 'i2', _price: 100 });

      const result = container.aggregate();

      expect(result.subtotal).toBe(100);
    });

    it('should return empty breakdown for empty container', () => {
      const result = container.aggregate();

      expect(result.subtotal).toBe(0);
      expect(result.breakdown).toEqual([]);
    });

    it('should include breakdown entries with id, nombre, and total', () => {
      container.addChild('item1', {
        ID_Item: 'ID_123',
        Nombre: 'Item Name',
        _price: 250,
      });

      const result = container.aggregate();

      expect(result.breakdown[0]).toEqual({
        id: 'ID_123',
        nombre: 'Item Name',
        total: 250,
      });
    });
  });

  // ── Display for Alpine.js ──────────────────────────────────────

  describe('toDisplayObject', () => {
    it('should skip children that do not implement toDisplayObject', () => {
      const badChild = {
        id: 'bad',
        _price: 100,
        // no toDisplayObject method
      };
      container.addChild('bad', badChild);

      const result = container.toDisplayObject();
      
      // Bad child should not be in the result
      expect(result.children).toHaveLength(0);
    });

    it('should return object with children and totals keys', () => {
      const mockChild = {
        id: 'child1',
        _price: 100,
        toDisplayObject: vi.fn().mockReturnValue({ id: 'child1', name: 'Test' }),
      };
      container.addChild('c1', mockChild);

      const result = container.toDisplayObject();

      expect(result).toHaveProperty('children');
      expect(result).toHaveProperty('totals');
    });

    it('should return children array from toDisplayObject calls', () => {
      const mock1 = {
        id: 'c1',
        _price: 100,
        toDisplayObject: vi.fn().mockReturnValue({ id: 'c1', name: 'Child 1' }),
      };
      const mock2 = {
        id: 'c2',
        _price: 200,
        toDisplayObject: vi.fn().mockReturnValue({ id: 'c2', name: 'Child 2' }),
      };
      container.addChild('c1', mock1);
      container.addChild('c2', mock2);

      const result = container.toDisplayObject();

      expect(result.children).toHaveLength(2);
      expect(result.children[0]).toEqual({ id: 'c1', name: 'Child 1' });
      expect(result.children[1]).toEqual({ id: 'c2', name: 'Child 2' });
    });

    it('should return totals from aggregate', () => {
      container.addChild('i1', {
        id: 'i1',
        _price: 100,
        toDisplayObject: vi.fn().mockReturnValue({}),
      });

      const result = container.toDisplayObject();

      expect(result.totals).toHaveProperty('subtotal');
      expect(result.totals).toHaveProperty('breakdown');
      expect(result.totals.subtotal).toBe(100);
    });

    it('should skip children without toDisplayObject', () => {
      const good = {
        id: 'good',
        _price: 100,
        toDisplayObject: vi.fn().mockReturnValue({ id: 'good' }),
      };
      const bad = {
        id: 'bad',
        _price: 50,
        // no toDisplayObject
      };
      container.addChild('good', good);
      container.addChild('bad', bad);

      const result = container.toDisplayObject();

      expect(result.children).toHaveLength(1);
      expect(result.children[0]).toEqual({ id: 'good' });
    });

    it('should handle empty container', () => {
      const result = container.toDisplayObject();

      expect(result.children).toEqual([]);
      expect(result.totals.subtotal).toBe(0);
      expect(result.totals.breakdown).toEqual([]);
    });
  });

  // ── Configuration ──────────────────────────────────────────────

  describe('setCalculationParams', () => {
    it('should set _calculationParams', () => {
      container.setCalculationParams({ pax: 50, duracion: 8 });

      expect(container._calculationParams).toEqual({ pax: 50, duracion: 8 });
    });

    it('should return this for chaining', () => {
      const result = container.setCalculationParams({ pax: 50 });
      expect(result).toBe(container);
    });

    it('should merge multiple setCalculationParams calls', () => {
      container.setCalculationParams({ pax: 50 });
      container.setCalculationParams({ duracion: 8 });

      expect(container._calculationParams).toEqual({
        pax: 50,
        duracion: 8,
      });
    });

    it('should overwrite keys on subsequent calls', () => {
      container.setCalculationParams({ pax: 50 });
      container.setCalculationParams({ pax: 75 });

      expect(container._calculationParams.pax).toBe(75);
    });
  });

  describe('setEvaluator', () => {
    it('should set _evaluator', () => {
      const mockEvaluator = vi.fn();
      container.setEvaluator(mockEvaluator);

      expect(container._evaluator).toBe(mockEvaluator);
    });

    it('should return this for chaining', () => {
      const evaluator = () => {};
      const result = container.setEvaluator(evaluator);
      expect(result).toBe(container);
    });

    it('should allow chaining with other methods', () => {
      const evaluator = () => {};
      const result = container
        .setCalculationParams({ pax: 50 })
        .setEvaluator(evaluator)
        .addChild('c1', {});

      expect(result).toBe(container);
      expect(container._evaluator).toBe(evaluator);
      expect(container._calculationParams.pax).toBe(50);
    });
  });

  // ── Mixin integration ──────────────────────────────────────────

  describe('Rulable mixin integration', () => {
    it('should have receiveContext from Rulable', () => {
      expect(typeof container.receiveContext).toBe('function');
    });

    it('should have evaluateRules from Rulable', () => {
      expect(typeof container.evaluateRules).toBe('function');
    });

    it('should allow receiveContext calls', () => {
      container.receiveContext({ key: 'value' });
      expect(container._inheritedContext).toEqual({ key: 'value' });
    });

    it('should allow evaluateRules calls with evaluator', () => {
      const evaluator = vi.fn().mockReturnValue({
        delta: 10,
        description: 'test',
      });
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];

      const result = container.evaluateRules(evaluator);

      expect(result).toHaveLength(1);
      expect(evaluator).toHaveBeenCalled();
    });
  });

  describe('XStateable mixin integration', () => {
    it('should have setActorRef from XStateable', () => {
      expect(typeof container.setActorRef).toBe('function');
    });

    it('should have sendEvent from XStateable', () => {
      expect(typeof container.sendEvent).toBe('function');
    });

    it('should allow setActorRef calls', () => {
      const mockRef = { send: vi.fn() };
      container.setActorRef(mockRef);

      expect(container._actorRef).toBe(mockRef);
    });

    it('should allow sendEvent calls', () => {
      const mockRef = { send: vi.fn() };
      container.setActorRef(mockRef);

      container.sendEvent('TEST_EVENT', { data: 'test' });

      expect(mockRef.send).toHaveBeenCalledWith({
        type: 'TEST_EVENT',
        data: 'test',
      });
    });

    it('should return this from setActorRef for chaining', () => {
      const mockRef = { send: vi.fn() };
      const result = container.setActorRef(mockRef);

      expect(result).toBe(container);
    });
  });

  describe('Alpineable mixin integration', () => {
    it('should require toDisplayObject implementation', () => {
      // We override toDisplayObject in ContainerBase, so this should not throw
      expect(() => container.toDisplayObject()).not.toThrow();
    });
  });

  // ── Complex scenarios ──────────────────────────────────────────

  describe('complex scenarios', () => {
    it('should handle multi-level context flow: parent -> container -> children', () => {
      // Create a multi-level hierarchy
      const grandparent = new ContainerBase();
      const parent = new ContainerBase();
      const child = new ContainerBase();

      const mockGrandchild = { receiveContext: vi.fn() };
      child.addChild('gc1', mockGrandchild);
      parent.addChild('c1', child);
      grandparent.addChild('p1', parent);

      // Flow context down
      grandparent.setCalculationParams({ pax: 100 });
      grandparent.receiveContext({ eventType: 'wedding' });
      grandparent.pushContextToChildren();

      parent.setCalculationParams({ duration: 8 });
      parent.pushContextToChildren();

      child.pushContextToChildren();

      // Check that grandchild received all context
      expect(mockGrandchild.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'wedding',
          pax: 100,
          duration: 8,
        })
      );
    });

    it('should aggregate prices through multiple levels', () => {
      const parent = new ContainerBase();
      const child1 = new ContainerBase();
      const child2 = new ContainerBase();

      // Add leaf children to containers
      child1.addChild('l1', { id: 'l1', _price: 100 });
      child1.addChild('l2', { id: 'l2', _price: 50 });

      child2.addChild('l3', { id: 'l3', _price: 75 });
      child2.addChild('l4', { id: 'l4', _price: 25 });

      parent.addChild('c1', child1);
      parent.addChild('c2', child2);

      const result = parent.aggregate();

      expect(result.subtotal).toBe(250); // 100 + 50 + 75 + 25
    });

    it('should handle rules and context propagation together', () => {
      const evaluator = vi.fn()
        .mockReturnValueOnce({
          delta: 10,
          description: 'rule 1',
          field: 'discount',
          value: 0.1,
        })
        .mockReturnValueOnce({
          delta: 20,
          description: 'rule 2',
          field: 'surcharge',
          value: 0.05,
        });

      const mockChild1 = { receiveContext: vi.fn() };
      const mockChild2 = { receiveContext: vi.fn() };

      container.setEvaluator(evaluator);
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
        { ID_Regla: 'r2', Activo: true, Acumulable: true },
      ];
      container.setCalculationParams({ pax: 50 });
      container.addChild('c1', mockChild1);
      container.addChild('c2', mockChild2);

      container.pushContextToChildren();

      // Both children should have pax, discount, and surcharge
      expect(mockChild1.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({
          pax: 50,
          discount: 0.1,
          surcharge: 0.05,
        })
      );
      expect(mockChild2.receiveContext).toHaveBeenCalledWith(
        expect.objectContaining({
          pax: 50,
          discount: 0.1,
          surcharge: 0.05,
        })
      );
    });

    it('should support full-chain operations with method chaining', () => {
      const mockEvaluator = vi.fn().mockReturnValue({
        delta: 5,
        description: 'test',
      });
      const mockChild = { receiveContext: vi.fn() };

      container
        .setCalculationParams({ pax: 40, duracion: 6 })
        .setEvaluator(mockEvaluator)
        .addChild('c1', mockChild)
        .addChild('c2', { receiveContext: vi.fn() })
        .receiveContext({ venue: 'lodge' })
        .pushContextToChildren();

      expect(mockChild.receiveContext).toHaveBeenCalled();
      expect(container.childCount).toBe(2);
    });

    it('should handle propagateContext with no evaluator', () => {
      container.setCalculationParams({ pax: 50 });
      container.receiveContext({ eventType: 'wedding' });

      const ctx = container.propagateContext();

      expect(ctx).toEqual({
        pax: 50,
        eventType: 'wedding',
      });
    });

    it('should handle propagateContext when rule outputs have no field', () => {
      const evaluator = vi.fn().mockReturnValue({
        delta: 100,
        description: 'test rule',
        // no field or value
      });

      container.setEvaluator(evaluator);
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];
      container.setCalculationParams({ pax: 50 });

      container.pushContextToChildren(); // triggers evaluateRules

      const ctx = container.propagateContext();

      expect(ctx).toEqual({ pax: 50 }); // rule output not included
    });

    it('should handle rule with undefined value', () => {
      const evaluator = vi.fn().mockReturnValue({
        delta: 100,
        description: 'test rule',
        field: 'discount',
        value: undefined, // undefined value
      });

      container.setEvaluator(evaluator);
      container._rules = [
        { ID_Regla: 'r1', Activo: true, Acumulable: true },
      ];

      container.pushContextToChildren();

      const ctx = container.propagateContext();

      expect(ctx).not.toHaveProperty('discount');
    });
  });
});
