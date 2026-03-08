import { describe, expect, it, vi } from 'vitest';
import { createCatalogActor } from '../machine/catalogMachine.js';

function makeDbFixture() {
  return {
    categorias: [
      { ID_Categoria: 'CAT_A', Nombre: 'Categoria A', Icono_UI: 'alpha', Activo: true },
      { ID_Categoria: 'CAT_B', Nombre: 'Categoria B', Icono_UI: 'beta', Activo: true },
    ],
    items: [
      { ID_Item: 'ITEM_A1', ID_Categoria: 'CAT_A', Activo: true },
      { ID_Item: 'ITEM_A2', ID_Categoria: 'CAT_A', Activo: true },
      { ID_Item: 'ITEM_B1', ID_Categoria: 'CAT_B', Activo: true },
    ],
  };
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeStubCategoryActorFactory() {
  const created = [];

  function buildChildState(categoryId, globalContext) {
    const pax = Number(globalContext?.paxGlobal || 0);
    const base = categoryId === 'CAT_A' ? 100 : 300;
    const subtotal = base + pax;
    const hasWarnings = categoryId === 'CAT_A' && pax >= 25;

    return {
      id: categoryId,
      nombre: `Categoria ${categoryId}`,
      icono: null,
      itemCount: categoryId === 'CAT_A' ? 2 : 1,
      subtotal,
      hasErrors: false,
      hasWarnings,
      items: [],
      ruleErrors: [],
      ruleWarnings: hasWarnings ? [{ id: `WARN_${categoryId}` }] : [],
      appliedRules: [],
      loadErrors: [],
    };
  }

  function createCategoryActorImpl({ initialCategoryId, initialContext }) {
    let listener = null;
    const unsubscribe = vi.fn(() => {
      listener = null;
    });

    let snapshot = {
      context: {
        selectedCategoryId: initialCategoryId,
        globalContext: { ...(initialContext || {}) },
        state: buildChildState(initialCategoryId, initialContext),
      },
    };

    const actor = {
      send: vi.fn((event) => {
        if (event.type !== 'SET_CONTEXT') return;
        const nextGlobalContext = {
          ...snapshot.context.globalContext,
          ...(event.patch || {}),
        };
        snapshot = {
          context: {
            ...snapshot.context,
            globalContext: nextGlobalContext,
            state: buildChildState(initialCategoryId, nextGlobalContext),
          },
        };
        listener?.(snapshot);
      }),
      stop: vi.fn(),
      subscribe: vi.fn((next) => {
        listener = next;
        return { unsubscribe };
      }),
      getSnapshot: vi.fn(() => snapshot),
      _emitState(patch = {}) {
        snapshot = {
          context: {
            ...snapshot.context,
            state: {
              ...snapshot.context.state,
              ...patch,
            },
          },
        };
        listener?.(snapshot);
      },
      _unsubscribe: unsubscribe,
    };

    created.push({ categoryId: initialCategoryId, actor });
    return actor;
  }

  return { createCategoryActorImpl, created };
}

describe('catalogMachine', () => {
  it('starts with all categories listed and no category runtimes loaded', () => {
    const { createCategoryActorImpl, created } = makeStubCategoryActorFactory();
    const actor = createCatalogActor({
      db: makeDbFixture(),
      createCategoryActorImpl,
    });

    const snapshot = actor.getSnapshot().context;

    expect(snapshot.categoryOptions).toHaveLength(2);
    expect(snapshot.expandedCategoryIds).toEqual([]);
    expect(snapshot.state.summary.categoryCount).toBe(2);
    expect(snapshot.state.summary.loadedCount).toBe(0);
    expect(snapshot.state.summary.definedItemCount).toBe(3);
    expect(created).toHaveLength(0);

    actor.stop();
  });

  it('expands categories lazily and aggregates loaded subtotals', () => {
    const { createCategoryActorImpl, created } = makeStubCategoryActorFactory();
    const actor = createCatalogActor({
      db: makeDbFixture(),
      initialContext: { paxGlobal: 10, dia: 1, hora: '09:00' },
      createCategoryActorImpl,
    });

    actor.send({ type: 'EXPAND_CATEGORY', categoryId: 'CAT_A' });
    actor.send({ type: 'EXPAND_CATEGORY', categoryId: 'CAT_A' });

    let snapshot = actor.getSnapshot().context;
    expect(created).toHaveLength(1);
    expect(snapshot.expandedCategoryIds).toEqual(['CAT_A']);
    expect(snapshot.state.summary.loadedCount).toBe(1);
    expect(snapshot.state.summary.subtotal).toBe(110);

    actor.send({ type: 'EXPAND_CATEGORY', categoryId: 'CAT_B' });
    snapshot = actor.getSnapshot().context;

    expect(created).toHaveLength(2);
    expect(snapshot.expandedCategoryIds).toEqual(['CAT_A', 'CAT_B']);
    expect(snapshot.state.summary.loadedCount).toBe(2);
    expect(snapshot.state.summary.subtotal).toBe(420);

    actor.stop();
  });

  it('collapses categories with deterministic runtime teardown', () => {
    const { createCategoryActorImpl, created } = makeStubCategoryActorFactory();
    const actor = createCatalogActor({
      db: makeDbFixture(),
      createCategoryActorImpl,
    });

    actor.send({ type: 'EXPAND_CATEGORY', categoryId: 'CAT_A' });
    const runtime = created[0].actor;

    actor.send({ type: 'COLLAPSE_CATEGORY', categoryId: 'CAT_A' });

    const snapshot = actor.getSnapshot().context;
    const categoryA = snapshot.state.categories.find((category) => category.id === 'CAT_A');

    expect(categoryA?.isExpanded).toBe(false);
    expect(categoryA?.isLoaded).toBe(false);
    expect(snapshot.state.summary.loadedCount).toBe(0);
    expect(runtime._unsubscribe).toHaveBeenCalledTimes(1);
    expect(runtime.stop).toHaveBeenCalledTimes(1);

    actor.stop();
  });

  it('broadcasts context patches to loaded categories and updates aggregates from child snapshots', async () => {
    const { createCategoryActorImpl, created } = makeStubCategoryActorFactory();
    const actor = createCatalogActor({
      db: makeDbFixture(),
      initialContext: { paxGlobal: 10, dia: 1, hora: '09:00' },
      createCategoryActorImpl,
    });

    actor.send({ type: 'EXPAND_CATEGORY', categoryId: 'CAT_A' });
    actor.send({ type: 'SET_CONTEXT', patch: { paxGlobal: 30 } });
    await nextTick();

    const runtimeA = created.find((entry) => entry.categoryId === 'CAT_A')?.actor;
    const snapshot = actor.getSnapshot().context;

    expect(runtimeA.send).toHaveBeenCalledWith({ type: 'SET_CONTEXT', patch: { paxGlobal: 30 } });
    expect(snapshot.globalContext.paxGlobal).toBe(30);
    expect(snapshot.state.summary.subtotal).toBe(130);
    expect(snapshot.state.summary.categoriesWithWarnings).toBe(1);

    runtimeA._emitState({ subtotal: 999, hasWarnings: false, ruleWarnings: [] });
    await nextTick();

    const afterChildUpdate = actor.getSnapshot().context;
    expect(afterChildUpdate.state.summary.subtotal).toBe(999);
    expect(afterChildUpdate.state.summary.categoriesWithWarnings).toBe(0);

    actor.stop();
  });
});
