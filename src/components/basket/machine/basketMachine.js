import { assign, createActor, createMachine } from 'xstate';
import { createBasketDayActor } from '../../basket-day/machine/basketDayMachine.js';

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

function createDayOptions(dayCount) {
  const count = Number(dayCount);
  const total = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  return Array.from({ length: total }, (_, idx) => ({
    dayIndex: idx + 1,
    label: `Dia ${idx + 1}`,
  }));
}

function normalizeDayIndex(dayOptions, value, fallback = null) {
  const target = Number(value);
  if (!Number.isFinite(target)) return fallback;
  return dayOptions.some((day) => day.dayIndex === target) ? target : fallback;
}

function toDayProjection(dayOption, runtime, selectedDayIndex) {
  const state = runtime?.snapshot?.context?.state || {};
  return {
    dayIndex: dayOption.dayIndex,
    label: dayOption.label,
    isSelected: dayOption.dayIndex === selectedDayIndex,
    entryCount: Number(state.entryCount || 0),
    hasWarnings: !!state.hasWarnings,
    hasErrors: !!state.hasErrors,
    entries: state.entries || [],
    ruleWarnings: state.ruleWarnings || [],
    ruleErrors: state.ruleErrors || [],
  };
}

function buildBasketState(dayOptions, selectedDayIndex, runtimeByDayIndex) {
  const days = dayOptions.map((dayOption) => {
    const runtime = runtimeByDayIndex.get(dayOption.dayIndex);
    return toDayProjection(dayOption, runtime, selectedDayIndex);
  });

  const summary = days.reduce(
    (acc, day) => ({
      dayCount: acc.dayCount + 1,
      totalEntries: acc.totalEntries + day.entryCount,
      daysWithWarnings: acc.daysWithWarnings + (day.hasWarnings ? 1 : 0),
      daysWithErrors: acc.daysWithErrors + (day.hasErrors ? 1 : 0),
    }),
    {
      dayCount: 0,
      totalEntries: 0,
      daysWithWarnings: 0,
      daysWithErrors: 0,
    }
  );

  const selectedDayState = days.find((day) => day.dayIndex === selectedDayIndex) || null;
  return { days, summary, selectedDayState };
}

function findEntryLocation(runtimeByDayIndex, entryId) {
  for (const [dayIndex, runtime] of runtimeByDayIndex.entries()) {
    const entries = runtime?.snapshot?.context?.state?.entries || [];
    const match = entries.find((entry) => entry.entryId === entryId);
    if (match) return { dayIndex, entry: match };
  }
  return null;
}

export function createBasketActor({
  db,
  dayCount = 3,
  initialSelectedDayIndex = 1,
  initialContext = {},
  createBasketDayActorImpl = createBasketDayActor,
} = {}) {
  if (!db) {
    throw new Error('createBasketActor: db is required');
  }

  const dayOptions = createDayOptions(dayCount);
  const selectedDayIndex = normalizeDayIndex(dayOptions, initialSelectedDayIndex, dayOptions[0].dayIndex);
  const globalContext = {
    ...DEFAULT_CONTEXT,
    dia: selectedDayIndex,
    ...(initialContext || {}),
  };

  const runtimeByDayIndex = new Map();
  let ownerActor = null;

  function notifyDayUpdate(dayIndex) {
    ownerActor?.send({ type: 'DAY_SNAPSHOT_UPDATED', dayIndex });
  }

  function startDayRuntime(dayIndex) {
    const actor = createBasketDayActorImpl({
      db,
      dayIndex,
      initialContext: {
        ...globalContext,
        dia: dayIndex,
      },
    });

    const runtime = {
      actor,
      snapshot: actor.getSnapshot(),
      subscription: null,
    };

    runtime.subscription = actor.subscribe((snapshot) => {
      runtime.snapshot = snapshot;
      notifyDayUpdate(dayIndex);
    });

    runtimeByDayIndex.set(dayIndex, runtime);
  }

  function refreshRuntimeSnapshot(dayIndex) {
    const runtime = runtimeByDayIndex.get(dayIndex);
    if (!runtime) return;
    runtime.snapshot = runtime.actor.getSnapshot();
  }

  function sendToDay(dayIndex, event) {
    const runtime = runtimeByDayIndex.get(dayIndex);
    if (!runtime) return false;
    runtime.actor.send(event);
    runtime.snapshot = runtime.actor.getSnapshot();
    return true;
  }

  function broadcastContext(patch) {
    for (const runtime of runtimeByDayIndex.values()) {
      runtime.actor.send({ type: 'SET_CONTEXT', patch });
      runtime.snapshot = runtime.actor.getSnapshot();
    }
  }

  function stopAllDayRuntimes() {
    for (const runtime of runtimeByDayIndex.values()) {
      cleanupSubscription(runtime.subscription);
      runtime.actor?.stop?.();
    }
    runtimeByDayIndex.clear();
  }

  for (const dayOption of dayOptions) {
    startDayRuntime(dayOption.dayIndex);
  }

  const firstDayRuntime = runtimeByDayIndex.get(dayOptions[0].dayIndex);
  const itemOptions = firstDayRuntime?.snapshot?.context?.itemOptions || [];
  const selectedItemId = firstDayRuntime?.snapshot?.context?.selectedItemId || itemOptions[0]?.id || null;

  const machine = createMachine({
    id: 'basketStandalone',
    initial: 'active',
    context: {
      dayOptions,
      itemOptions,
      selectedDayIndex,
      selectedItemId,
      globalContext,
      state: buildBasketState(dayOptions, selectedDayIndex, runtimeByDayIndex),
    },
    states: {
      active: {
        on: {
          SELECT_DAY: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              return {
                selectedDayIndex: dayIndex,
                globalContext: {
                  ...context.globalContext,
                  dia: dayIndex,
                },
                state: buildBasketState(dayOptions, dayIndex, runtimeByDayIndex),
              };
            }),
          },
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
              if (!context.selectedItemId) return {};
              const shipped = sendToDay(context.selectedDayIndex, {
                type: 'SHIP_ITEM',
                itemId: context.selectedItemId,
              });
              if (!shipped) return {};
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          SHIP_ITEM_TO_DAY: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              if (!event.itemId) return {};
              const shipped = sendToDay(dayIndex, {
                type: 'SHIP_ITEM',
                itemId: event.itemId,
              });
              if (!shipped) return {};
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          REMOVE_ENTRY: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              if (!event.entryId) return {};
              sendToDay(dayIndex, { type: 'REMOVE_ENTRY', entryId: event.entryId });
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          SET_ENTRY_OVERRIDE: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              if (!event.entryId || !event.key) return {};
              sendToDay(dayIndex, {
                type: 'SET_ENTRY_OVERRIDE',
                entryId: event.entryId,
                key: event.key,
                value: event.value,
              });
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          CLEAR_ENTRY_OVERRIDE: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              if (!event.entryId || !event.key) return {};
              sendToDay(dayIndex, {
                type: 'CLEAR_ENTRY_OVERRIDE',
                entryId: event.entryId,
                key: event.key,
              });
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          RESET_ENTRY_OVERRIDES: {
            actions: assign(({ context, event }) => {
              const dayIndex = normalizeDayIndex(dayOptions, event.dayIndex, context.selectedDayIndex);
              if (!event.entryId) return {};
              sendToDay(dayIndex, {
                type: 'RESET_ENTRY_OVERRIDES',
                entryId: event.entryId,
              });
              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          MOVE_ENTRY_TO_DAY: {
            actions: assign(({ context, event }) => {
              const targetDayIndex = normalizeDayIndex(dayOptions, event.targetDayIndex, null);
              if (!targetDayIndex || !event.entryId) return {};

              const explicitSource = normalizeDayIndex(dayOptions, event.fromDayIndex, null);
              const location = explicitSource
                ? { dayIndex: explicitSource, entry: null }
                : findEntryLocation(runtimeByDayIndex, event.entryId);

              const sourceDayIndex = location?.dayIndex || explicitSource;
              if (!sourceDayIndex || sourceDayIndex === targetDayIndex) return {};

              if (!location?.entry) {
                const runtime = runtimeByDayIndex.get(sourceDayIndex);
                const entries = runtime?.snapshot?.context?.state?.entries || [];
                location.entry = entries.find((entry) => entry.entryId === event.entryId) || null;
              }

              if (!location.entry) return {};

              const targetRuntime = runtimeByDayIndex.get(targetDayIndex);
              const beforeIds = new Set(
                (targetRuntime?.snapshot?.context?.state?.entries || []).map((entry) => entry.entryId)
              );

              sendToDay(targetDayIndex, {
                type: 'SHIP_ITEM',
                itemId: location.entry.itemId,
              });

              refreshRuntimeSnapshot(targetDayIndex);
              const targetEntries = targetRuntime?.snapshot?.context?.state?.entries || [];
              const newEntry = targetEntries.find((entry) => !beforeIds.has(entry.entryId));

              const overrides = location.entry.state?.overrides || {};
              if (newEntry) {
                for (const [key, value] of Object.entries(overrides)) {
                  if (value === undefined || value === null || value === '') continue;
                  sendToDay(targetDayIndex, {
                    type: 'SET_ENTRY_OVERRIDE',
                    entryId: newEntry.entryId,
                    key,
                    value,
                  });
                }
              }

              sendToDay(sourceDayIndex, {
                type: 'REMOVE_ENTRY',
                entryId: event.entryId,
              });

              return {
                state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
              };
            }),
          },
          SET_CONTEXT: {
            actions: assign(({ context, event }) => {
              const rawPatch = { ...(event.patch || {}) };
              const nextSelectedDay = normalizeDayIndex(
                dayOptions,
                rawPatch.dia,
                context.selectedDayIndex
              );

              const sharedPatch = { ...rawPatch };
              delete sharedPatch.dia;

              if (Object.keys(sharedPatch).length > 0) {
                broadcastContext(sharedPatch);
              }

              return {
                selectedDayIndex: nextSelectedDay,
                globalContext: {
                  ...context.globalContext,
                  ...sharedPatch,
                  dia: nextSelectedDay,
                },
                state: buildBasketState(dayOptions, nextSelectedDay, runtimeByDayIndex),
              };
            }),
          },
          DAY_SNAPSHOT_UPDATED: {
            actions: assign(({ context }) => ({
              state: buildBasketState(dayOptions, context.selectedDayIndex, runtimeByDayIndex),
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
    stopAllDayRuntimes();
    originalStop();
  };

  actor.start();
  return actor;
}
