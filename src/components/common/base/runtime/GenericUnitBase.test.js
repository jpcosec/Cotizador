/* eslint-disable max-lines-per-function */
import { describe, expect, it } from 'vitest';
import { GenericUnitBase } from './GenericUnitBase.js';

describe('GenericUnitBase', () => {
  it('initializes serializable snapshot and projection state', () => {
    const unit = new GenericUnitBase({
      id: 'generic-demo',
      title: 'Generic Demo',
    });

    unit.initialize(
      { mode: 'playground' },
      { persistence: { save: async () => ({ ok: true }) } },
      { counter: 1 },
    );

    unit.applyMutation({
      type: 'APPLY_MUTATION',
      patch: { counter: 2 },
      contextPatch: { selected: 'alpha' },
      ui: { subtitle: 'Ready to render' },
      derived: { total: 2 },
      stage: 'review',
    });

    expect(unit.getSnapshot()).toEqual({
      id: 'generic-demo',
      type: 'generic-unit',
      status: 'ready',
      visible: true,
      enabled: true,
      stage: 'review',
      context: { mode: 'playground', selected: 'alpha' },
      state: { counter: 2 },
      ui: {
        title: 'Generic Demo',
        subtitle: 'Ready to render',
        variant: 'default',
        badges: [],
        panels: [],
        fields: [],
        actions: [],
        classes: [],
      },
      derived: { total: 2 },
      errors: [],
      warnings: [],
      boundaryStatus: {},
      meta: {},
      lastSignal: { type: 'APPLY_MUTATION', unitId: 'generic-demo' },
      childIds: [],
    });

    expect(unit.toDisplayObject()).toMatchObject({
      id: 'generic-demo',
      stage: 'review',
      ui: {
        title: 'Generic Demo',
        subtitle: 'Ready to render',
      },
      derived: { total: 2 },
    });
  });

  it('registers children and routes signals to parent and sibling targets', () => {
    const parent = new GenericUnitBase({ id: 'parent' }).initialize();
    const child = new GenericUnitBase({ id: 'child' }).initialize();
    const sibling = new GenericUnitBase({ id: 'sibling' }).initialize();

    parent.registerChild(child, { title: 'Child Unit' });
    parent.registerChild(sibling, { title: 'Sibling Unit' });

    child.emitSignal({
      type: 'PATCH_CONTEXT',
      patch: { source: 'child' },
    });

    child.emitSignal({
      type: 'APPLY_MUTATION',
      mutation: {
        patch: { count: 3 },
      },
    }, 'sibling');

    expect(child.parent).toBe(parent);
    expect(parent.context).toEqual({ source: 'child' });
    expect(parent.getProjection().children).toHaveLength(2);
    expect(sibling.state).toEqual({ count: 3 });
  });
});
