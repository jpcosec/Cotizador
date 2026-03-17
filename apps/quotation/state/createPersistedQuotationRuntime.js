import { serializeQuotation } from '../../../packages/database/src/persistence/serializeQuotation.js';

const EMPTY_PERSISTENCE = {
  isSaving: false,
  isLoading: false,
  error: null,
  quotationId: null,
  lastLoadedId: null,
};

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
    fechaInicio: String(cotizacion?.Fecha_Evento || fallbackSettings.fechaInicio || new Date().toISOString().slice(0, 10)),
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
  let listeners = new Set();
  let stageOverride = null;
  let persistence = { ...EMPTY_PERSISTENCE };

  function setPersistence(patch = {}, shouldNotify = true) {
    persistence = { ...persistence, ...patch };
    if (shouldNotify) notify();
  }

  function clearStageOverride() {
    if (!stageOverride) return;
    stageOverride = null;
  }

  function getSnapshot() {
    const base = runtime.getSnapshot();
    return {
      ...base,
      stage: stageOverride || base.stage,
      persistence: { ...persistence },
    };
  }

  function notify() {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function attachRuntime(nextRuntime) {
    runtime = nextRuntime;
    runtimeSubscription = runtime.subscribe(() => notify());
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
    if (!itemId) return;

    const dayIndex = Math.min(duration, toPositiveInteger(linea?.Dia_Numero, 1));
    runtimeInstance.selectDay(dayIndex);

    const beforeEntries = findDayEntries(runtimeInstance.getSnapshot(), dayIndex);
    const beforeIds = new Set(beforeEntries.map((entry) => entry.entryId));

    runtimeInstance.shipItemToSelectedDay(itemId);

    const afterEntries = findDayEntries(runtimeInstance.getSnapshot(), dayIndex);
    const createdEntry = afterEntries.find((entry) => !beforeIds.has(entry.entryId));
    if (!createdEntry) return;

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
      setPersistence({ error: null });
    },

    reinitialize(initialSettings = null) {
      const fallbackSettings = getSnapshot().settings || {};
      const nextRuntime = createRuntime(initialSettings || fallbackSettings);
      clearStageOverride();
      setPersistence({ ...EMPTY_PERSISTENCE }, false);
      replaceRuntime(nextRuntime);
      notify();
      return { ok: true };
    },

    async confirmSave() {
      if (!persistencePort || typeof persistencePort.save !== 'function') {
        setPersistence({ error: 'Persistence adapter is not configured' });
        return { ok: false };
      }

      const snapshot = getSnapshot();
      if (snapshot.stage !== 'validation') {
        return { ok: false };
      }

      setPersistence({ isSaving: true, error: null });

      try {
        const payload = serializeQuotation({
          selectedClient: snapshot.selectedClient,
          settings: snapshot.settings,
          basketState: snapshot.basket,
          quotationId: persistence.quotationId,
          idPolicy,
        });

        const result = await persistencePort.save(payload);
        if (!result?.ok) {
          setPersistence({
            isSaving: false,
            error: toMessage(result?.error, 'Unable to save quotation'),
          });
          return result || { ok: false };
        }

        const quotationId =
          toId(result.data?.quotationId) ||
          toId(result.data?.id) ||
          toId(payload.cotizacion.ID_Cotizacion);

        stageOverride = 'completed';
        setPersistence({
          isSaving: false,
          error: null,
          quotationId,
        });

        return { ok: true, data: result.data, id: quotationId };
      } catch (error) {
        setPersistence({
          isSaving: false,
          error: toMessage(error, 'Unable to save quotation'),
        });
        return { ok: false, error: toMessage(error) };
      }
    },

    async loadQuotation(id) {
      if (!persistencePort || typeof persistencePort.load !== 'function') {
        setPersistence({ error: 'Persistence adapter is not configured' });
        return { ok: false };
      }

      const quotationId = toId(id);
      if (!quotationId) {
        setPersistence({ error: 'Quotation ID is required' });
        return { ok: false };
      }

      setPersistence({ isLoading: true, error: null });

      try {
        const result = await persistencePort.load(quotationId);
        if (!result?.ok) {
          setPersistence({
            isLoading: false,
            error: toMessage(result?.error, 'Unable to load quotation'),
          });
          return result || { ok: false };
        }

        hydrateFromLoadData(result.data);
        clearStageOverride();
        setPersistence({
          isLoading: false,
          error: null,
          quotationId: toId(result.data?.quotationId) || quotationId,
          lastLoadedId: quotationId,
        });

        return { ok: true, data: result.data };
      } catch (error) {
        setPersistence({
          isLoading: false,
          error: toMessage(error, 'Unable to load quotation'),
        });
        return { ok: false, error: toMessage(error) };
      }
    },

    stop() {
      detachRuntime();
      listeners.clear();
    },
  };

  for (const methodName of passthrough) {
    api[methodName] = (...args) => {
      clearStageOverride();
      const result = runtime[methodName](...args);
      return result;
    };
  }

  return api;
}
