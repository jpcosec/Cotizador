/* eslint-disable max-lines-per-function */
import { describe, expect, it } from 'vitest';
import { GenericContainerBase } from './GenericContainerBase.js';
import { GenericUnitBase } from './GenericUnitBase.js';

describe('GenericContainerBase', () => {
  it('aggregates child state and derived pricing totals', () => {
    const container = new GenericContainerBase({ id: 'workspace' }).initialize();
    const first = new GenericUnitBase({ id: 'a' }).initialize({}, {}, { count: 2 });
    const second = new GenericUnitBase({ id: 'b' }).initialize({}, {}, { count: 3 });

    first.applyMutation({ derived: { pricing: { subtotal: 10 } } });
    second.applyMutation({ derived: { pricing: { subtotal: 20 } } });

    container.registerChild(first);
    container.registerChild(second);

    expect(container.aggregate()).toEqual({
      childCount: 2,
      visibleChildCount: 2,
      statuses: { a: 'ready', b: 'ready' },
      totals: { count: 5, subtotal: 30 },
    });
  });

  it('propagates context patches to children', () => {
    const container = new GenericContainerBase({ id: 'workspace' }).initialize();
    const child = new GenericUnitBase({ id: 'child' }).initialize();

    container.registerChild(child);
    container.propagateContext({ stage: 'review' });

    expect(container.context).toEqual({ stage: 'review' });
    expect(child.context).toEqual({ stage: 'review' });
  });

  it('refreshes aggregate totals when a child mutates later', () => {
    const container = new GenericContainerBase({ id: 'workspace' }).initialize();
    const child = new GenericUnitBase({ id: 'child' }).initialize({}, {}, { count: 1 });

    container.registerChild(child);
    child.applyMutation({ patch: { count: 4 } });

    expect(container.getProjection().aggregate.totals.count).toBe(4);
  });
});
