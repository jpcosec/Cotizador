/* eslint-disable jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { describe, expect, it } from 'vitest';
import { GenericContainerBase } from './GenericContainerBase.js';
import { GenericUnitBase } from './GenericUnitBase.js';
import { GenericViewBase } from './GenericViewBase.js';

function waitForAsyncWork() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('GenericViewBase', () => {
  it('orchestrates visible child units by stage', async () => {
    const view = new GenericViewBase({
      id: 'demo-view',
      stages: ['compose', 'review', 'export'],
    });

    const catalog = new GenericUnitBase({ id: 'catalog', title: 'Catalog' }).initialize({}, {}, { count: 1 });
    const inspector = new GenericUnitBase({ id: 'inspector', title: 'Inspector' }).initialize();

    view.initialize({ flow: 'demo' }, {});
    view.registerChild(catalog, { title: 'Catalog', stages: ['compose', 'review', 'export'] });
    view.registerChild(inspector, { title: 'Inspector', stages: ['review', 'export'] });

    expect(view.getProjection().visibleUnits.map((unit) => unit.id)).toEqual(['catalog']);

    view.transition({ type: 'NEXT_STAGE' });
    await waitForAsyncWork();

    expect(view.stage).toBe('review');
    expect(view.getProjection().visibleUnits.map((unit) => unit.id)).toEqual(['catalog', 'inspector']);
  });

  it('routes signals to children and records child feedback in xstate context', async () => {
    const view = new GenericViewBase({
      id: 'signal-view',
      stages: ['compose', 'review'],
    }).initialize({}, {});

    const child = new GenericUnitBase({ id: 'child-a', title: 'Child A' }).initialize({}, {}, { count: 0 });
    view.registerChild(child, { stages: ['compose', 'review'] });

    view.routeSignal({
      type: 'APPLY_MUTATION',
      mutation: {
        patch: { count: 2 },
      },
    }, 'child-a');

    child.emitSignal({
      type: 'CHILD_UPDATED',
      payload: { count: 2 },
    });

    await waitForAsyncWork();

    expect(child.state.count).toBe(2);
    expect(view.state.childSignals).toHaveLength(1);
    expect(view.state.childSignals[0]).toMatchObject({
      type: 'CHILD_UPDATED',
      sourceId: 'child-a',
    });
  });

  it('records nested child feedback bubbled through a container', async () => {
    const view = new GenericViewBase({
      id: 'nested-view',
      stages: ['compose', 'review'],
    }).initialize({}, {});
    const container = new GenericContainerBase({ id: 'workspace' }).initialize();
    const child = new GenericUnitBase({ id: 'leaf' }).initialize();

    container.registerChild(child);
    view.registerChild(container, { stages: ['compose', 'review'] });

    child.emitSignal({ type: 'LEAF_SIGNAL', payload: { count: 1 } }, 'workspace');
    await waitForAsyncWork();

    expect(view.state.childSignals.at(-1)).toMatchObject({
      type: 'LEAF_SIGNAL',
      sourceId: 'leaf',
      via: ['workspace'],
    });
  });

  it('executes persistence and pricing boundaries through xstate events', async () => {
    const view = new GenericViewBase({
      id: 'boundary-view',
      stages: ['compose', 'review'],
    }).initialize(
      { flow: 'boundaries' },
      {
        persistence: {
          save: async ({ payload }) => ({ ok: true, savedLabel: payload.label }),
        },
        pricing: {
          evaluate: async ({ payload }) => ({
            subtotal: Number(payload.quantity || 0) * Number(payload.unitPrice || 0),
          }),
        },
        store: {
          query: async ({ payload }) => ({
            results: [{ id: payload.id, label: 'Demo entity' }],
          }),
        },
      },
    );

    view.receiveSignal({
      type: 'REQUEST_SAVE',
      payload: { label: 'draft-a' },
    });

    view.receiveSignal({
      type: 'REQUEST_PRICING',
      payload: { quantity: 3, unitPrice: 7 },
    });

    view.receiveSignal({
      type: 'REQUEST_STORE',
      payload: { id: 'entity-1' },
    });

    await waitForAsyncWork();
    await waitForAsyncWork();

    expect(view.getProjection().boundaryStatus['persistence.save']).toMatchObject({
      status: 'success',
      result: { ok: true, savedLabel: 'draft-a' },
    });

    expect(view.getProjection().boundaryStatus['pricing.evaluate']).toMatchObject({
      status: 'success',
      result: { subtotal: 21 },
    });

    expect(view.getProjection().boundaryStatus['store.query']).toMatchObject({
      status: 'success',
      result: { results: [{ id: 'entity-1', label: 'Demo entity' }] },
    });

    expect(view.derived.pricing).toEqual({ subtotal: 21 });
  });
});
