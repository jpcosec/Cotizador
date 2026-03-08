import { assign, createActor, createMachine } from 'xstate';
import { createCategoryActor } from '../../category/machine/categoryMachine.js';

const DEFAULT_CONTEXT = {
  paxGlobal: 20,
  dia: 1,
  hora: '09:00',
};

function cleanupSubscription(subscription) {
  if (!subscription) return;
  if (typeof subscription === 'function') {
    subscription();
    return;
  }
  if (typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
}

function toCategoryOptions(db) {
  const activeCounts = new Map();
  for (const row of db.items || []) {
    if (row.Activo === false) continue;
    const count = activeCounts.get(row.ID_Categoria) || 0;
    activeCounts.set(row.ID_Categoria, count + 1);
  }

  return (db.categorias || [])
    .filter((row) => row.Activo !== false)
    .map((row) => ({
      id: row.ID_Categoria,
      nombre: row.Nombre,
      icono: row.Icono_UI ?? null,
      itemCount: activeCounts.get(row.ID_Categoria) || 0,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function normalizeExpandedIds(categoryOptions, expandedIds = []) {
  const validIds = new Set(categoryOptions.map((category) => category.id));
  return [...new Set(expandedIds)].filter((categoryId) => validIds.has(categoryId));
}

function categoryStateFromRuntime(option, runtime, isExpanded) {
  const childState = runtime?.snapshot?.context?.state || null;
  return {
    id: option.id,
    nombre: option.nombre,
    icono: option.icono,
    definedItemCount: option.itemCount,
    itemCount: Number(childState?.itemCount || 0),
    subtotal: Number(childState?.subtotal || 0),
    hasErrors: !!childState?.hasErrors,
    hasWarnings: !!childState?.hasWarnings,
    loadErrors: childState?.loadErrors || [],
    isExpanded,
    isLoaded: !!runtime,
    state: childState,
  };
}

function buildCatalogState(categoryOptions, expandedCategoryIds, runtimeByCategoryId) {
  const expandedSet = new Set(expandedCategoryIds);
  const categories = categoryOptions.map((option) => {
    const runtime = runtimeByCategoryId.get(option.id);
    return categoryStateFromRuntime(option, runtime, expandedSet.has(option.id));
  });

  const summary = categories.reduce(
    (acc, category) => ({
      categoryCount: acc.categoryCount + 1,
      expandedCount: acc.expandedCount + (category.isExpanded ? 1 : 0),
      loadedCount: acc.loadedCount + (category.isLoaded ? 1 : 0),
      definedItemCount: acc.definedItemCount + category.definedItemCount,
      loadedItemCount: acc.loadedItemCount + category.itemCount,
      subtotal: acc.subtotal + category.subtotal,
      categoriesWithErrors: acc.categoriesWithErrors + (category.hasErrors ? 1 : 0),
      categoriesWithWarnings: acc.categoriesWithWarnings + (category.hasWarnings ? 1 : 0),
    }),
    {
      categoryCount: 0,
      expandedCount: 0,
      loadedCount: 0,
      definedItemCount: 0,
      loadedItemCount: 0,
      subtotal: 0,
      categoriesWithErrors: 0,
      categoriesWithWarnings: 0,
    }
  );

  return { categories, summary };
}

function startCategoryRuntime({
  categoryId,
  db,
  globalContext,
  runtimeByCategoryId,
  onSnapshot,
  createCategoryActorImpl,
}) {
  if (!categoryId || runtimeByCategoryId.has(categoryId)) return;

  const actor = createCategoryActorImpl({
    db,
    initialCategoryId: categoryId,
    initialContext: globalContext,
  });
  const runtime = {
    actor,
    snapshot: actor.getSnapshot(),
    subscription: null,
  };

  runtime.subscription = actor.subscribe((snapshot) => {
    runtime.snapshot = snapshot;
    onSnapshot(categoryId);
  });

  runtimeByCategoryId.set(categoryId, runtime);
}

function stopCategoryRuntime(runtimeByCategoryId, categoryId) {
  const runtime = runtimeByCategoryId.get(categoryId);
  if (!runtime) return;

  cleanupSubscription(runtime.subscription);
  runtime.actor?.stop?.();
  runtimeByCategoryId.delete(categoryId);
}

function stopAllRuntimes(runtimeByCategoryId) {
  for (const categoryId of runtimeByCategoryId.keys()) {
    stopCategoryRuntime(runtimeByCategoryId, categoryId);
  }
}

export function createCatalogActor({
  db,
  initialContext = {},
  initiallyExpandedCategoryIds = [],
  createCategoryActorImpl = createCategoryActor,
} = {}) {
  if (!db) {
    throw new Error('createCatalogActor: db is required');
  }

  const categoryOptions = toCategoryOptions(db);
  const runtimeByCategoryId = new Map();
  const globalContext = { ...DEFAULT_CONTEXT, ...(initialContext || {}) };
  const expandedCategoryIds = normalizeExpandedIds(categoryOptions, initiallyExpandedCategoryIds);
  let ownerActor = null;

  function notifyCategorySnapshotUpdated(categoryId) {
    ownerActor?.send({ type: 'CATEGORY_SNAPSHOT_UPDATED', categoryId });
  }

  for (const categoryId of expandedCategoryIds) {
    startCategoryRuntime({
      categoryId,
      db,
      globalContext,
      runtimeByCategoryId,
      onSnapshot: notifyCategorySnapshotUpdated,
      createCategoryActorImpl,
    });
  }

  const machine = createMachine({
    id: 'catalogStandalone',
    initial: 'active',
    context: {
      categoryOptions,
      expandedCategoryIds,
      globalContext,
      state: buildCatalogState(categoryOptions, expandedCategoryIds, runtimeByCategoryId),
    },
    states: {
      active: {
        on: {
          EXPAND_CATEGORY: {
            actions: assign(({ context, event }) => {
              const categoryId = event.categoryId;
              if (!categoryId || context.expandedCategoryIds.includes(categoryId)) {
                return {};
              }

              startCategoryRuntime({
                categoryId,
                db,
                globalContext: context.globalContext,
                runtimeByCategoryId,
                onSnapshot: notifyCategorySnapshotUpdated,
                createCategoryActorImpl,
              });

              const nextExpanded = [...context.expandedCategoryIds, categoryId];
              return {
                expandedCategoryIds: nextExpanded,
                state: buildCatalogState(categoryOptions, nextExpanded, runtimeByCategoryId),
              };
            }),
          },
          COLLAPSE_CATEGORY: {
            actions: assign(({ context, event }) => {
              const categoryId = event.categoryId;
              if (!categoryId || !context.expandedCategoryIds.includes(categoryId)) {
                return {};
              }

              stopCategoryRuntime(runtimeByCategoryId, categoryId);
              const nextExpanded = context.expandedCategoryIds.filter((id) => id !== categoryId);
              return {
                expandedCategoryIds: nextExpanded,
                state: buildCatalogState(categoryOptions, nextExpanded, runtimeByCategoryId),
              };
            }),
          },
          TOGGLE_CATEGORY: {
            actions: assign(({ context, event }) => {
              const categoryId = event.categoryId;
              if (!categoryId) return {};

              if (context.expandedCategoryIds.includes(categoryId)) {
                stopCategoryRuntime(runtimeByCategoryId, categoryId);
                const nextExpanded = context.expandedCategoryIds.filter((id) => id !== categoryId);
                return {
                  expandedCategoryIds: nextExpanded,
                  state: buildCatalogState(categoryOptions, nextExpanded, runtimeByCategoryId),
                };
              }

              startCategoryRuntime({
                categoryId,
                db,
                globalContext: context.globalContext,
                runtimeByCategoryId,
                onSnapshot: notifyCategorySnapshotUpdated,
                createCategoryActorImpl,
              });
              const nextExpanded = [...context.expandedCategoryIds, categoryId];
              return {
                expandedCategoryIds: nextExpanded,
                state: buildCatalogState(categoryOptions, nextExpanded, runtimeByCategoryId),
              };
            }),
          },
          SET_CONTEXT: {
            actions: assign(({ context, event }) => {
              const patch = { ...(event.patch || {}) };
              const nextContext = {
                ...context.globalContext,
                ...patch,
              };

              for (const runtime of runtimeByCategoryId.values()) {
                runtime.actor.send({ type: 'SET_CONTEXT', patch });
              }

              return {
                globalContext: nextContext,
                state: buildCatalogState(categoryOptions, context.expandedCategoryIds, runtimeByCategoryId),
              };
            }),
          },
          CATEGORY_SNAPSHOT_UPDATED: {
            actions: assign(({ context }) => ({
              state: buildCatalogState(categoryOptions, context.expandedCategoryIds, runtimeByCategoryId),
            })),
          },
        },
      },
    },
  });

  const actor = createActor(machine);
  ownerActor = actor;

  const originalStop = actor.stop.bind(actor);
  actor.stop = () => {
    stopAllRuntimes(runtimeByCategoryId);
    originalStop();
  };

  actor.start();
  return actor;
}
