import { assign, createActor, createMachine } from 'xstate';
import { Item } from '../../item/Item.js';
import { createItemActor } from '../../item/machine/itemMachine.js';
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';

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

function getCategoryById(db, categoryId) {
  return (db.categorias || []).find((row) => row.ID_Categoria === categoryId) || null;
}

function getActiveCategoryItems(db, categoryId) {
  return (db.items || []).filter(
    (row) => row.Activo !== false && row.ID_Categoria === categoryId
  );
}

function createEntryId() {
  return `CAT_ENTRY_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function annotateRules(entry, rules = []) {
  return rules.map((rule) => ({
    ...rule,
    entryId: entry.entryId,
    itemId: entry.itemId,
    itemName: entry.name,
  }));
}

function toEntryState(entry) {
  const snapshot = entry.snapshot || {};
  const definition = snapshot.definition || {};
  const categoriaRaw = snapshot.categoria || definition.categoria || null;
  const categoriaId =
    categoriaRaw?.ID_Categoria || categoriaRaw?.id || definition.categoriaId || null;
  const categoriaNombre =
    definition.category || categoriaRaw?.Nombre || categoriaRaw?.nombre || null;

  return {
    entryId: entry.entryId,
    id: entry.entryId,
    itemId: entry.itemId,
    item: entry.itemId,
    name: entry.name,
    nombre: entry.name,
    categoriaId,
    categoria: categoriaNombre,
    total: Number(snapshot.total || 0),
    available: snapshot.available ?? true,
    warnings: (snapshot.ruleWarnings || []).length,
    errors: (snapshot.ruleErrors || []).length,
    state: snapshot,
  };
}

function buildCategoryState(db, categoryId, runtimeEntries, loadErrors = []) {
  const category = getCategoryById(db, categoryId);
  const items = Array.from(runtimeEntries.values()).map(toEntryState);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const ruleErrors = items.flatMap((item) => annotateRules(item, item.state.ruleErrors || []));
  const ruleWarnings = items.flatMap((item) => annotateRules(item, item.state.ruleWarnings || []));
  const appliedRules = items.flatMap((item) => annotateRules(item, item.state.appliedRules || []));

  return {
    id: category?.ID_Categoria || categoryId || null,
    nombre: category?.Nombre || 'Category',
    icono: category?.Icono_UI ?? null,
    itemCount: items.length,
    subtotal,
    hasErrors: ruleErrors.length > 0,
    hasWarnings: ruleWarnings.length > 0,
    items,
    ruleErrors,
    ruleWarnings,
    appliedRules,
    loadErrors,
  };
}

function createEntryRuntime(db, itemRow, globalContext, onSnapshot, createItemActorImpl) {
  const resolvedDef = resolveItemDefinition(itemRow.ID_Item, db);
  const seed = Item.fromDefinition(resolvedDef, {
    externalContext: { ...globalContext },
  }).toSeed();
  seed.mode = 'catalog';

  const actor = createItemActorImpl(seed);
  const entry = {
    entryId: createEntryId(),
    itemId: resolvedDef.ID_Item,
    name: resolvedDef.Nombre,
    actor,
    snapshot: actor.getSnapshot().context,
    subscription: null,
  };

  entry.subscription = actor.subscribe((snapshot) => {
    entry.snapshot = snapshot.context;
    onSnapshot();
  });

  return entry;
}

function destroyRuntimeEntries(runtimeEntries) {
  for (const entry of runtimeEntries.values()) {
    cleanupSubscription(entry.subscription);
    entry.actor?.stop?.();
  }
  runtimeEntries.clear();
}

/**
 * Create a category actor for the Step 01 playground.
 * @param {{db: object, initialCategoryId?: string|null, initialContext?: object}} input
 */
export function createCategoryActor({
  db,
  initialCategoryId = null,
  initialContext = {},
  createItemActorImpl = createItemActor,
} = {}) {
  if (!db) {
    throw new Error('createCategoryActor: db is required');
  }

  const categoryOptions = toCategoryOptions(db);
  const selectedCategoryId = initialCategoryId || categoryOptions[0]?.id || null;
  const globalContext = { ...DEFAULT_CONTEXT, ...(initialContext || {}) };
  const runtimeEntries = new Map();
  let ownerActor = null;

  function notifySnapshotUpdate() {
    ownerActor?.send({ type: 'CHILD_SNAPSHOT_UPDATED' });
  }

  function hydrateCategory(categoryId, context) {
    destroyRuntimeEntries(runtimeEntries);
    const loadErrors = [];
    const itemRows = getActiveCategoryItems(db, categoryId);

    for (const row of itemRows) {
      try {
        const entry = createEntryRuntime(db, row, context, notifySnapshotUpdate, createItemActorImpl);
        runtimeEntries.set(entry.entryId, entry);
      } catch (error) {
        loadErrors.push({
          itemId: row.ID_Item,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return buildCategoryState(db, categoryId, runtimeEntries, loadErrors);
  }

  function pushContextToChildren(patch) {
    for (const entry of runtimeEntries.values()) {
      entry.actor.send({ type: 'SET_CONTEXT', patch });
    }
  }

  const machine = createMachine({
    id: 'categoryStandalone',
    initial: 'active',
    context: {
      categoryOptions,
      selectedCategoryId,
      globalContext,
      state: hydrateCategory(selectedCategoryId, globalContext),
    },
    states: {
      active: {
        on: {
          SELECT_CATEGORY: {
            actions: assign(({ context, event }) => {
              const nextCategoryId = event.categoryId;
              if (!nextCategoryId || nextCategoryId === context.selectedCategoryId) {
                return {};
              }
              return {
                selectedCategoryId: nextCategoryId,
                state: hydrateCategory(nextCategoryId, context.globalContext),
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
              pushContextToChildren(patch);
              return {
                globalContext: nextContext,
                state: buildCategoryState(db, context.selectedCategoryId, runtimeEntries),
              };
            }),
          },
          CHILD_SNAPSHOT_UPDATED: {
            actions: assign(({ context }) => ({
              state: buildCategoryState(db, context.selectedCategoryId, runtimeEntries),
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
    destroyRuntimeEntries(runtimeEntries);
    originalStop();
  };

  actor.start();
  return actor;
}
