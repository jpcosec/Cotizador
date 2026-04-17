import { assign, createActor, createMachine } from 'xstate';
import { Item } from '../../item/Item.js';
import { createItemActor } from '../../item/machine/itemMachine.js';
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';

const DEFAULT_CONTEXT = {
  paxGlobal: 20,
  dia: 1,
  hora: '09:00',
  duracionMin: 120,
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

function createEntryId() {
  return `BSK_ENTRY_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toItemOptions(db) {
  const categoryNames = new Map((db.categorias || []).map((row) => [row.ID_Categoria, row.Nombre]));

  return (db.items || [])
    .filter((row) => row.Activo !== false)
    .map((row) => ({
      id: row.ID_Item,
      nombre: row.Nombre,
      categoria: categoryNames.get(row.ID_Categoria) || 'Uncategorized',
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
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
  const ruleWarnings = snapshot.ruleWarnings || [];
  const ruleErrors = snapshot.ruleErrors || [];

  return {
    id: entry.entryId,
    entryId: entry.entryId,
    itemId: entry.itemId,
    groupId: entry.groupId || null,
    parentId: entry.parentId || null,
    kitContext: entry.kitContext || null,
    name: entry.name,
    hora: snapshot.overrides?.hora || snapshot.schedule?.hora || '09:00',
    duracionMin: snapshot.overrides?.duracionMin || snapshot.quantities?.duracionMin || 0,
    total: Number(snapshot.total || 0),
    warnings: ruleWarnings.length,
    errors: ruleErrors.length,
    state: snapshot,
  };
}

function buildDayState(dayIndex, runtimeEntries) {
  const entries = Array.from(runtimeEntries.values()).map(toEntryState);
  const subtotal = entries.reduce((sum, entry) => sum + entry.total, 0);
  const ruleErrors = entries.flatMap((entry) => annotateRules(entry, entry.state.ruleErrors || []));
  const ruleWarnings = entries.flatMap((entry) => annotateRules(entry, entry.state.ruleWarnings || []));
  const appliedRules = entries.flatMap((entry) => annotateRules(entry, entry.state.appliedRules || []));

  return {
    dayIndex,
    entryCount: entries.length,
    entries,
    subtotal,
    hasErrors: ruleErrors.length > 0,
    hasWarnings: ruleWarnings.length > 0,
    ruleErrors,
    ruleWarnings,
    appliedRules,
  };
}

function createEntryRuntime({
  resolvedDef,
  globalContext,
  onSnapshot,
  createItemActorImpl,
  groupId = null,
  parentId = null,
  kitContext = null,
}) {
  const seed = Item.fromDefinition(resolvedDef, {
    externalContext: { ...globalContext, kitContext },
  }).toSeed();
  seed.mode = 'basket';

  const actor = createItemActorImpl(seed);
  const entry = {
    entryId: createEntryId(),
    itemId: resolvedDef.ID_Item,
    groupId,
    parentId,
    kitContext,
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

function destroyRuntimeEntry(runtimeEntries, entryId) {
  const entry = runtimeEntries.get(entryId);
  if (!entry) return;
  cleanupSubscription(entry.subscription);
  entry.actor?.stop?.();
  runtimeEntries.delete(entryId);
}

export function createBasketDayActor({
  db,
  dayIndex = 1,
  initialContext = {},
  createItemActorImpl = createItemActor,
} = {}) {
  if (!db) {
    throw new Error('createBasketDayActor: db is required');
  }

  const itemOptions = toItemOptions(db);
  const selectedItemId = itemOptions[0]?.id || null;
  const globalContext = { ...DEFAULT_CONTEXT, dia: dayIndex, ...(initialContext || {}) };
  const runtimeEntries = new Map();
  let ownerActor = null;

  function notifySnapshotUpdate() {
    ownerActor?.send({ type: 'CHILD_SNAPSHOT_UPDATED' });
  }

  function addEntryByItemId(itemId, context, groupId = null, parentId = null, kitContext = null) {
    if (!itemId) return false;
    if (!itemOptions.some((item) => String(item.id) === String(itemId))) {
      return false;
    }

    try {
      const resolvedDef = resolveItemDefinition(itemId, db);
      const isKit = (resolvedDef.children || []).length > 0;
      const effectiveGroupId = groupId || (isKit ? `GRP_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` : null);

      const entry = createEntryRuntime({
        resolvedDef,
        globalContext: context,
        onSnapshot: notifySnapshotUpdate,
        createItemActorImpl,
        groupId: effectiveGroupId,
        parentId,
        kitContext,
      });
      runtimeEntries.set(entry.entryId, entry);

      // Recursive expansion for children
      if (isKit) {
        for (const child of resolvedDef.children) {
          addEntryByItemId(
            child.ID_Item_Hijo,
            context,
            effectiveGroupId,
            entry.entryId,
            { tipoPrecio: child.Tipo_Precio, multiplier: child.Cantidad }
          );
        }
      }

      return true;
    } catch (_error) {
      console.error('addEntryByItemId error:', _error);
      return false;
    }
  }

  function pushContextToChildren(patch) {
    for (const entry of runtimeEntries.values()) {
      entry.actor.send({ type: 'SET_CONTEXT', patch });
    }
  }

  function sendEntryEvent(entryId, event) {
    const runtime = runtimeEntries.get(entryId);
    if (!runtime) return;
    runtime.actor.send(event);
  }

  const machine = createMachine({
    id: 'basketDayStandalone',
    initial: 'active',
    context: {
      dayIndex,
      itemOptions,
      selectedItemId,
      globalContext,
      state: buildDayState(dayIndex, runtimeEntries),
    },
    states: {
      active: {
        on: {
          SELECT_ITEM: {
            actions: assign(({ context, event }) => {
              const itemId = event.itemId;
              if (!itemId || !context.itemOptions.some((item) => item.id === itemId)) {
                return {};
              }
              return { selectedItemId: itemId };
            }),
          },
          SHIP_SELECTED_ITEM: {
            actions: assign(({ context }) => {
              const created = addEntryByItemId(context.selectedItemId, context.globalContext);
              if (!created) return {};
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          SHIP_ITEM: {
            actions: assign(({ context, event }) => {
              const created = addEntryByItemId(event.itemId, context.globalContext);
              if (!created) return {};
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          REMOVE_ENTRY: {
            actions: assign(({ context, event }) => {
              const targetEntry = runtimeEntries.get(event.entryId);
              if (targetEntry) {
                const groupId = targetEntry.groupId;
                if (groupId && !targetEntry.parentId) {
                  // It's a parent of a group, remove all entries in the group
                  for (const [id, entry] of runtimeEntries.entries()) {
                    if (entry.groupId === groupId) {
                      destroyRuntimeEntry(runtimeEntries, id);
                    }
                  }
                } else {
                  // Individual item or a child (can be removed individually)
                  destroyRuntimeEntry(runtimeEntries, event.entryId);
                }
              }
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          SET_ENTRY_OVERRIDE: {
            actions: assign(({ context, event }) => {
              sendEntryEvent(event.entryId, {
                type: 'SET_OVERRIDE',
                key: event.key,
                value: event.value,
              });
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          CLEAR_ENTRY_OVERRIDE: {
            actions: assign(({ context, event }) => {
              sendEntryEvent(event.entryId, {
                type: 'CLEAR_OVERRIDE',
                key: event.key,
              });
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          RESET_ENTRY_OVERRIDES: {
            actions: assign(({ context, event }) => {
              sendEntryEvent(event.entryId, { type: 'RESET_OVERRIDES' });
              return {
                state: buildDayState(context.dayIndex, runtimeEntries),
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
                state: buildDayState(context.dayIndex, runtimeEntries),
              };
            }),
          },
          CHILD_SNAPSHOT_UPDATED: {
            actions: assign(({ context }) => ({
              state: buildDayState(context.dayIndex, runtimeEntries),
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
