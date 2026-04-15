import { assign, createActor, createMachine } from 'xstate';
import { serializeQuotation } from '../../../packages/database/src/persistence/serializeQuotation.js';

const EMPTY_PERSISTENCE = {
  isSaving: false,
  isLoading: false,
  error: null,
  quotationId: null,
  lastLoadedId: null,
};

const MANAGED_STAGES = ['browse', 'client', 'basket', 'validation'];

function toMessage(errorLike, fallback = 'Persistence operation failed') {
  if (!errorLike) return fallback;
  if (typeof errorLike === 'string') return errorLike;
  if (typeof errorLike.message === 'string' && errorLike.message) return errorLike.message;
  if (typeof errorLike.error === 'string' && errorLike.error) return errorLike.error;
  if (errorLike.error && typeof errorLike.error.message === 'string') return errorLike.error.message;
  return fallback;
}

function toId(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLineas(lineas = []) {
  return [...(lineas || [])].sort((left, right) => {
    const leftDay = toPositiveInteger(left?.Dia_Numero, 1);
    const rightDay = toPositiveInteger(right?.Dia_Numero, 1);
    if (leftDay !== rightDay) return leftDay - rightDay;
    return String(left?.ID_Linea || '').localeCompare(String(right?.ID_Linea || ''));
  });
}

function settingsFromPayload(cotizacion, lineas, fallbackSettings = {}) {
  const sortedLineas = normalizeLineas(lineas);
  const maxDayFromLines = sortedLineas.reduce(
    (maxDay, linea) => Math.max(maxDay, toPositiveInteger(linea?.Dia_Numero, 1)),
    1
  );

  const durationFromHeader = toPositiveInteger(cotizacion?.Duracion_Dias, 1);
  const duration = Math.max(durationFromHeader, maxDayFromLines);
  const firstHour = sortedLineas.find((linea) => toId(linea?.Hora_Inicio))?.Hora_Inicio;

  return {
    fechaInicio: String(
      cotizacion?.Fecha_Evento || fallbackSettings.fechaInicio || new Date().toISOString().slice(0, 10)
    ),
    duracionDias: duration,
    paxGlobal: toPositiveInteger(cotizacion?.Pax_Global, toPositiveInteger(fallbackSettings.paxGlobal, 1)),
    dia: 1,
    horaInicio: String(firstHour || fallbackSettings.horaInicio || '09:00'),
    duracionMin: Number.isFinite(Number(fallbackSettings.duracionMin))
      ? Math.max(0, Math.floor(Number(fallbackSettings.duracionMin)))
      : 120,
  };
}

function overridePatchFromLinea(linea) {
  const patch = {};
  const pax = toNullableNumber(linea?.Override_Pax);
  const cantidad = toNullableNumber(linea?.Override_Cantidad);
  const duracionMin = toNullableNumber(linea?.Override_Duracion_Min);
  const hora = toId(linea?.Hora_Inicio);

  if (pax !== null) patch.pax = pax;
  if (cantidad !== null) patch.cantidad = cantidad;
  if (duracionMin !== null) patch.duracionMin = duracionMin;
  if (hora) patch.hora = hora;

  if (linea?.Comentarios !== undefined && linea?.Comentarios !== null && linea?.Comentarios !== '') {
    patch.comentarios = String(linea.Comentarios);
  }

  return patch;
}

function findDayEntries(snapshot, dayIndex) {
  const days = snapshot?.basket?.days || [];
  return days.find((day) => Number(day.dayIndex) === Number(dayIndex))?.entries || [];
}

function cleanupSubscription(subscription) {
  if (!subscription) return;
  if (typeof subscription === 'function') {
    subscription();
    return;
  }
  subscription.unsubscribe?.();
}

function normalizeStage(stage) {
  return MANAGED_STAGES.includes(stage) ? stage : 'browse';
}

function isManagedStage(stage) {
  return MANAGED_STAGES.includes(stage);
}

function createStageTransitions() {
  return [
    { guard: ({ event }) => event.stage === 'browse', target: '.browse' },
    { guard: ({ event }) => event.stage === 'client', target: '.client' },
    { guard: ({ event }) => event.stage === 'basket', target: '.basket' },
    { guard: ({ event }) => event.stage === 'validation', target: '.validation' },
  ];
}

function assignPersistence(mutator) {
  return assign(({ context, event }) => ({
    persistence: mutator(context.persistence, event),
  }));
}

function createFlowMachine({ initialStage = 'browse', persistence = EMPTY_PERSISTENCE } = {}) {
  return createMachine({
    id: 'quotationFlow',
    initial: normalizeStage(initialStage),
    context: {
      persistence: { ...EMPTY_PERSISTENCE, ...(persistence || {}) },
      loadReturnStage: normalizeStage(initialStage),
    },
    on: {
      CLEAR_PERSISTENCE_ERROR: {
        actions: assignPersistence((current) => ({ ...current, error: null })),
      },
      SET_PERSISTENCE_ERROR: {
        actions: assignPersistence((current, event) => ({
          ...current,
          isSaving: false,
          isLoading: false,
          error: event.message || 'Persistence operation failed',
        })),
      },
      RUNTIME_SET_STAGE: createStageTransitions(),
      FORCE_STAGE: createStageTransitions(),
    },
    states: {
      browse: {
        on: {
          LOAD_QUOTATION_REQUEST: {
            target: 'loadingQuotation',
            actions: [
              assign({ loadReturnStage: 'browse' }),
              assignPersistence((current) => ({
                ...current,
                isLoading: true,
                error: null,
              })),
            ],
          },
        },
      },
      client: {
        on: {
          LOAD_QUOTATION_REQUEST: {
            target: 'loadingQuotation',
            actions: [
              assign({ loadReturnStage: 'client' }),
              assignPersistence((current) => ({
                ...current,
                isLoading: true,
                error: null,
              })),
            ],
          },
        },
      },
      basket: {
        on: {
          LOAD_QUOTATION_REQUEST: {
            target: 'loadingQuotation',
            actions: [
              assign({ loadReturnStage: 'basket' }),
              assignPersistence((current) => ({
                ...current,
                isLoading: true,
                error: null,
              })),
            ],
          },
        },
      },
      validation: {
        on: {
          CONFIRM_SAVE: {
            target: 'saving',
            actions: assignPersistence((current) => ({
              ...current,
              isSaving: true,
              error: null,
            })),
          },
          LOAD_QUOTATION_REQUEST: {
            target: 'loadingQuotation',
            actions: [
              assign({ loadReturnStage: 'validation' }),
              assignPersistence((current) => ({
                ...current,
                isLoading: true,
                error: null,
              })),
            ],
          },
        },
      },
      saving: {
        on: {
          SAVE_DONE: {
            target: 'completed',
            actions: assignPersistence((current, event) => ({
              ...current,
              isSaving: false,
              error: null,
              quotationId: event.quotationId || current.quotationId,
            })),
          },
          SAVE_ERROR: {
            target: 'validation',
            actions: assignPersistence((current, event) => ({
              ...current,
              isSaving: false,
              error: event.message || 'Unable to save quotation',
            })),
          },
        },
      },
      loadingQuotation: {
        on: {
          LOAD_DONE: {
            target: 'basket',
            actions: assign(({ context, event }) => ({
              loadReturnStage: 'basket',
              persistence: {
                ...context.persistence,
                isLoading: false,
                error: null,
                quotationId: event.quotationId || context.persistence.quotationId,
                lastLoadedId: event.requestedId || context.persistence.lastLoadedId,
              },
            })),
          },
          LOAD_ERROR: [
            {
              guard: ({ context }) => context.loadReturnStage === 'client',
              target: 'client',
              actions: assignPersistence((current, event) => ({
                ...current,
                isLoading: false,
                error: event.message || 'Unable to load quotation',
              })),
            },
            {
              guard: ({ context }) => context.loadReturnStage === 'basket',
              target: 'basket',
              actions: assignPersistence((current, event) => ({
                ...current,
                isLoading: false,
                error: event.message || 'Unable to load quotation',
              })),
            },
            {
              guard: ({ context }) => context.loadReturnStage === 'validation',
              target: 'validation',
              actions: assignPersistence((current, event) => ({
                ...current,
                isLoading: false,
                error: event.message || 'Unable to load quotation',
              })),
            },
            {
              guard: ({ context }) => context.loadReturnStage === 'completed',
              target: 'completed',
              actions: assignPersistence((current, event) => ({
                ...current,
                isLoading: false,
                error: event.message || 'Unable to load quotation',
              })),
            },
            {
              target: 'browse',
              actions: assignPersistence((current, event) => ({
                ...current,
                isLoading: false,
                error: event.message || 'Unable to load quotation',
              })),
            },
          ],
        },
      },
      completed: {
        on: {
          LOAD_QUOTATION_REQUEST: {
            target: 'loadingQuotation',
            actions: [
              assign({ loadReturnStage: 'completed' }),
              assignPersistence((current) => ({
                ...current,
                isLoading: true,
                error: null,
              })),
            ],
          },
        },
      },
    },
  });
}

export function createPersistedQuotationRuntime({
  createRuntime,
  persistencePort,
  idPolicy = null,
} = {}) {
  if (typeof createRuntime !== 'function') {
    throw new Error('createPersistedQuotationRuntime: createRuntime is required');
  }

  let runtime = createRuntime();
  let runtimeSubscription = null;
  let flowActor = null;
  let flowSubscription = null;
  const listeners = new Set();

  function currentFlowStage() {
    return String(flowActor?.getSnapshot()?.value || 'browse');
  }

  function flowContext() {
    return flowActor?.getSnapshot()?.context || {
      persistence: { ...EMPTY_PERSISTENCE },
      loadReturnStage: 'browse',
    };
  }

  function getSnapshot() {
    const base = runtime.getSnapshot();
    return {
      ...base,
      stage: currentFlowStage(),
      persistence: { ...flowContext().persistence },
    };
  }

  function notify() {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function attachFlowActor(initialStage, persistence = EMPTY_PERSISTENCE) {
    flowActor = createActor(
      createFlowMachine({
        initialStage,
        persistence,
      })
    );
    flowSubscription = flowActor.subscribe(() => notify());
    flowActor.start();
  }

  function detachFlowActor() {
    cleanupSubscription(flowSubscription);
    flowSubscription = null;
    flowActor?.stop?.();
    flowActor = null;
  }

  function replaceFlowActor(initialStage, persistence = EMPTY_PERSISTENCE) {
    detachFlowActor();
    attachFlowActor(initialStage, persistence);
  }

  function syncStageFromRuntime(force = false) {
    const stage = runtime.getSnapshot()?.stage;
    if (!isManagedStage(stage)) return;
    flowActor.send({ type: force ? 'FORCE_STAGE' : 'RUNTIME_SET_STAGE', stage });
  }

  function attachRuntime(nextRuntime) {
    runtime = nextRuntime;
    runtimeSubscription = runtime.subscribe((snapshot) => {
      if (isManagedStage(currentFlowStage()) && isManagedStage(snapshot.stage)) {
        flowActor.send({ type: 'RUNTIME_SET_STAGE', stage: snapshot.stage });
      }
      notify();
    });
  }

  function detachRuntime() {
    cleanupSubscription(runtimeSubscription);
    runtimeSubscription = null;
    runtime.stop?.();
  }

  function replaceRuntime(nextRuntime) {
    detachRuntime();
    attachRuntime(nextRuntime);
  }

  function applyLoadedLine(runtimeInstance, linea, duration) {
    const itemId = toId(linea?.ID_Item);
    if (!itemId) {
      throw new Error(`Invalid loaded line item id: ${linea?.ID_Linea || 'unknown-line'}`);
    }

    const dayIndex = Math.min(duration, toPositiveInteger(linea?.Dia_Numero, 1));
    runtimeInstance.selectDay(dayIndex);

    const beforeEntries = findDayEntries(runtimeInstance.getSnapshot(), dayIndex);
    const beforeIds = new Set(beforeEntries.map((entry) => entry.entryId));

    runtimeInstance.shipItemToSelectedDay(itemId);

    const afterEntries = findDayEntries(runtimeInstance.getSnapshot(), dayIndex);
    const createdEntry = afterEntries.find((entry) => !beforeIds.has(entry.entryId));
    if (!createdEntry) {
      throw new Error(`Unable to hydrate loaded line: ${linea?.ID_Linea || itemId}`);
    }

    const overridePatch = overridePatchFromLinea(linea);
    for (const [key, value] of Object.entries(overridePatch)) {
      runtimeInstance.setEntryOverride(createdEntry.entryId, key, value);
    }
  }

  function hydrateFromLoadData(data) {
    const cotizacion = data?.cotizacion || null;
    const lineas = normalizeLineas(data?.lineas || []);
    if (!cotizacion) {
      throw new Error('Invalid load payload: missing cotizacion');
    }

    const fallbackSettings = runtime.getSnapshot().settings || {};
    const loadedSettings = settingsFromPayload(cotizacion, lineas, fallbackSettings);
    const nextRuntime = createRuntime(loadedSettings);
    const nextSnapshot = nextRuntime.getSnapshot();
    const targetClientId = toId(cotizacion.ID_Cliente);
    const selected = (nextSnapshot.clients || []).find((client) => toId(client.id) === targetClientId);

    if (!selected) {
      nextRuntime.stop?.();
      throw new Error(`Loaded client not available in runtime: ${targetClientId || 'unknown'}`);
    }

    nextRuntime.selectClient(selected.id);
    nextRuntime.startQuotation();

    for (const linea of lineas) {
      applyLoadedLine(nextRuntime, linea, loadedSettings.duracionDias);
    }

    nextRuntime.selectDay(1);
    nextRuntime.backToBasket();
    replaceRuntime(nextRuntime);
  }

  attachRuntime(runtime);
  attachFlowActor(runtime.getSnapshot()?.stage || 'browse');

  const passthrough = [
    'openClientModal',
    'closeClientModal',
    'selectClient',
    'startQuotation',
    'resetToBrowse',
    'advanceToValidation',
    'backToBasket',
    'setCatalogSearch',
    'toggleCategory',
    'selectDay',
    'setQuotationSettings',
    'shipItemToSelectedDay',
    'setEntryOverride',
    'clearEntryOverride',
    'resetEntryOverrides',
    'removeEntry',
    'duplicateEntryInDay',
    'copyEntryToDay',
    'moveEntryToDay',
    'copySelectedDayToNextDay',
  ];

  const api = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot,

    clearPersistenceError() {
      flowActor.send({ type: 'CLEAR_PERSISTENCE_ERROR' });
    },

    reinitialize(initialSettings = null) {
      const fallbackSettings = runtime.getSnapshot().settings || {};
      const nextRuntime = createRuntime(initialSettings || fallbackSettings);
      replaceRuntime(nextRuntime);
      replaceFlowActor(nextRuntime.getSnapshot()?.stage || 'browse', EMPTY_PERSISTENCE);
      notify();
      return { ok: true };
    },

    async confirmSave() {
      if (!persistencePort || typeof persistencePort.save !== 'function') {
        flowActor.send({
          type: 'SET_PERSISTENCE_ERROR',
          message: 'Persistence adapter is not configured',
        });
        return { ok: false };
      }

      const snapshot = getSnapshot();
      if (snapshot.stage !== 'validation') {
        return { ok: false };
      }

      flowActor.send({ type: 'CONFIRM_SAVE' });

      try {
        const payload = serializeQuotation({
          selectedClient: snapshot.selectedClient,
          settings: snapshot.settings,
          basketState: snapshot.basket,
          quotationId: flowContext().persistence.quotationId,
          idPolicy,
        });

        const result = await persistencePort.save(payload);
        if (!result?.ok) {
          const message = toMessage(result?.error, 'Unable to save quotation');
          flowActor.send({ type: 'SAVE_ERROR', message });
          return result || { ok: false };
        }

        const quotationId =
          toId(result.data?.quotationId) ||
          toId(result.data?.id) ||
          toId(payload.cotizacion.ID_Cotizacion);

        flowActor.send({ type: 'SAVE_DONE', quotationId });
        return { ok: true, data: result.data, id: quotationId };
      } catch (error) {
        const message = toMessage(error, 'Unable to save quotation');
        flowActor.send({ type: 'SAVE_ERROR', message });
        return { ok: false, error: message };
      }
    },

    async loadQuotation(id) {
      if (!persistencePort || typeof persistencePort.load !== 'function') {
        flowActor.send({
          type: 'SET_PERSISTENCE_ERROR',
          message: 'Persistence adapter is not configured',
        });
        return { ok: false };
      }

      const quotationId = toId(id);
      if (!quotationId) {
        flowActor.send({
          type: 'SET_PERSISTENCE_ERROR',
          message: 'Quotation ID is required',
        });
        return { ok: false };
      }

      const stage = currentFlowStage();
      if (stage === 'saving' || stage === 'loadingQuotation') {
        return { ok: false };
      }

      flowActor.send({ type: 'LOAD_QUOTATION_REQUEST' });

      try {
        const result = await persistencePort.load(quotationId);
        if (!result?.ok) {
          const message = toMessage(result?.error, 'Unable to load quotation');
          flowActor.send({ type: 'LOAD_ERROR', message });
          return result || { ok: false };
        }

        hydrateFromLoadData(result.data);
        flowActor.send({
          type: 'LOAD_DONE',
          quotationId: toId(result.data?.quotationId) || quotationId,
          requestedId: quotationId,
        });
        syncStageFromRuntime(true);
        return { ok: true, data: result.data };
      } catch (error) {
        const message = toMessage(error, 'Unable to load quotation');
        flowActor.send({ type: 'LOAD_ERROR', message });
        return { ok: false, error: message };
      }
    },

    async listQuotations(query = {}) {
      if (!persistencePort || typeof persistencePort.listQuotations !== 'function') {
        return { ok: false, error: 'Persistence adapter does not support quotation search' };
      }

      try {
        const result = await persistencePort.listQuotations(query);
        if (!result?.ok) {
          return result || { ok: false };
        }
        return result;
      } catch (error) {
        return { ok: false, error: toMessage(error, 'Unable to list quotations') };
      }
    },

    stop() {
      detachRuntime();
      detachFlowActor();
      listeners.clear();
    },
  };

  for (const methodName of passthrough) {
    api[methodName] = (...args) => {
      const stage = currentFlowStage();
      if (stage === 'saving' || stage === 'loadingQuotation') {
        return undefined;
      }

      const result = runtime[methodName](...args);
      syncStageFromRuntime(stage === 'completed');
      return result;
    };
  }

  return api;
}
