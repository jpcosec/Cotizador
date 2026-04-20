import { createCatalogActor } from '../components/catalog/machine/catalogMachine.js';
import { createBasketActor } from '../components/basket/machine/basketMachine.js';

const DEFAULT_SETTINGS = {
  fechaInicio: new Date().toISOString().slice(0, 10),
  duracionDias: 3,
  paxGlobal: 20,
  dia: 1,
  horaInicio: '09:00',
  duracionMin: 120,
};

function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeSettings(raw = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  merged.duracionDias = Math.max(1, Math.floor(normalizeNumber(merged.duracionDias, 1)));
  merged.paxGlobal = Math.max(1, Math.floor(normalizeNumber(merged.paxGlobal, 1)));
  merged.dia = Math.max(1, Math.floor(normalizeNumber(merged.dia, 1)));
  merged.duracionMin = Math.max(0, Math.floor(normalizeNumber(merged.duracionMin, 0)));
  merged.horaInicio = String(merged.horaInicio || '09:00');
  merged.fechaInicio = String(merged.fechaInicio || DEFAULT_SETTINGS.fechaInicio);
  return merged;
}

function toActorContext(settings) {
  return {
    paxGlobal: settings.paxGlobal,
    dia: settings.dia,
    hora: settings.horaInicio,
    duracionMin: settings.duracionMin,
  };
}

function filterCatalogCategories(categories = [], term = '') {
  const needle = String(term || '').trim().toLowerCase();
  const mapped = categories.map((category) => ({
    ...category,
    catalogEntries: (category.state?.items || []).map(normalizeCatalogEntry),
  }));

  if (!needle) return mapped;

  return mapped
    .map((category) => {
      const inCategory = String(category.nombre || '').toLowerCase().includes(needle);
      if (inCategory) return category;
      const entries = category.catalogEntries.filter((entry) =>
        [
          entry?.name,
          entry?.nombre,
          entry?.itemId,
          entry?.categoria,
          entry?.state?.definition?.name,
        ]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(needle))
      );
      return { ...category, catalogEntries: entries };
    })
    .filter((category) => category.catalogEntries.length > 0);
}

function normalizeCatalogEntry(entry = {}) {
  const rawCategory = entry?.categoria || entry?.state?.categoria || entry?.state?.definition?.categoria;
  const categoriaId =
    entry?.categoriaId ||
    rawCategory?.ID_Categoria ||
    rawCategory?.id ||
    null;
  const categoria =
    entry?.categoria ||
    entry?.state?.definition?.category ||
    rawCategory?.Nombre ||
    rawCategory?.nombre ||
    null;

  return {
    ...entry,
    id: entry.entryId,
    item: entry.item || entry.itemId,
    nombre: entry.nombre || entry.name,
    categoriaId,
    categoria,
  };
}

function buildValidationProjection(client, settings, basketState) {
  const rows = (basketState?.days || []).flatMap((day) =>
    (day.entries || []).map((entry) => ({
      dayIndex: day.dayIndex,
      entryId: entry.entryId,
      itemId: entry.itemId,
      name: entry.state?.definition?.name || entry.name || entry.itemId,
      pax: Number(entry.state?.quantities?.pax || 0),
      unidades: Number(entry.state?.quantities?.cantidad || 0),
      total: Number(entry.total || 0),
      hora: entry.state?.schedule?.hora || settings.horaInicio,
    }))
  );

  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return {
    client,
    settings,
    rows,
    totals: { subtotal, iva, total },
  };
}

function toClientRecord(client) {
  return {
    id: client.ID_Cliente || client.id || null,
    nombre: client.Nombre_Empresa || client.nombre || 'Cliente',
    rut: client.RUT || client.rut || '',
    email: client.Email || client.email || '',
    telefono: client.Telefono || client.telefono || '',
  };
}

export function createQuotationInternalRuntime({
  db,
  clients = [],
  initialSettings = {},
} = {}) {
  if (!db) {
    throw new Error('createQuotationInternalRuntime: db is required');
  }

  let stage = 'browse';
  let clientModalOpen = false;
  let selectedClient = null;
  let settings = sanitizeSettings(initialSettings);
  let catalogSearchTerm = '';

  const listeners = new Set();
  const clientList = (clients || []).map(toClientRecord);

  let catalogActor = createCatalogActor({
    db,
    initialContext: toActorContext(settings),
  });

  let basketActor = createBasketActor({
    db,
    dayCount: settings.duracionDias,
    initialSelectedDayIndex: settings.dia,
    initialContext: toActorContext(settings),
  });

  let catalogUnsub = catalogActor.subscribe(() => notify());
  let basketUnsub = basketActor.subscribe(() => {
    const selectedDay = basketActor.getSnapshot().context.selectedDayIndex;
    settings = sanitizeSettings({ ...settings, dia: selectedDay });
    notify();
  });

  function notify() {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function selectedDayIndex() {
    return basketActor.getSnapshot().context.selectedDayIndex;
  }

  function selectDay(dayIndex) {
    basketActor.send({ type: 'SELECT_DAY', dayIndex });
    const selected = selectedDayIndex();
    settings = sanitizeSettings({ ...settings, dia: selected });
    catalogActor.send({ type: 'SET_CONTEXT', patch: { dia: selected } });
    notify();
  }

  function pushSharedContext(patch = {}) {
    if (!Object.keys(patch).length) return;
    catalogActor.send({ type: 'SET_CONTEXT', patch });
    basketActor.send({ type: 'SET_CONTEXT', patch });
  }

  function getDayEntries(dayIndex) {
    const days = basketActor.getSnapshot().context.state?.days || [];
    return days.find((day) => Number(day.dayIndex) === Number(dayIndex))?.entries || [];
  }

  function setEntryOverride(dayIndex, entryId, key, value) {
    const located = resolveEntry(entryId, dayIndex);
    if (!located) return;

    const { entry } = located;
    const groupId = entry.groupId;
    const isParent = groupId && !entry.parentId;

    if (isParent && ['hora', 'dia'].includes(key)) {
      // Propagate time/day to all children in group
      const entries = getDayEntries(dayIndex);
      for (const groupEntry of entries) {
        if (groupEntry.groupId === groupId) {
          basketActor.send({
            type: 'SET_ENTRY_OVERRIDE',
            dayIndex,
            entryId: groupEntry.entryId,
            key,
            value,
          });
        }
      }
    } else {
      basketActor.send({
        type: 'SET_ENTRY_OVERRIDE',
        dayIndex,
        entryId,
        key,
        value,
      });
    }
  }

  function cloneEntryToDay(sourceEntry, targetDayIndex) {
    if (!sourceEntry?.itemId) return;

    const beforeIds = new Set(getDayEntries(targetDayIndex).map((entry) => entry.entryId));
    const isGroupParent = sourceEntry.groupId && !sourceEntry.parentId;

    basketActor.send({
      type: 'SHIP_ITEM_TO_DAY',
      dayIndex: targetDayIndex,
      itemId: sourceEntry.itemId,
    });

    const targetEntries = getDayEntries(targetDayIndex);
    const newEntries = targetEntries.filter((entry) => !beforeIds.has(entry.entryId));
    if (newEntries.length === 0) return;

    if (isGroupParent) {
      // Find all source entries in this group
      const sourceDayEntries = getDayEntries(sourceEntry.dia || settings.dia);
      const sourceGroupEntries = sourceDayEntries.filter((e) => e.groupId === sourceEntry.groupId);

      // Map by itemId (assuming one entry per item in kit for now)
      for (const sourceItem of sourceGroupEntries) {
        const targetItem = newEntries.find((e) => e.itemId === sourceItem.itemId);
        if (targetItem) {
          const overrides = sourceItem.state?.overrides || {};
          for (const [key, value] of Object.entries(overrides)) {
            if (value === undefined || value === null || value === '') continue;
            setEntryOverride(targetDayIndex, targetItem.entryId, key, value);
          }
        }
      }
    } else {
      // Individual item clone
      const newEntry = newEntries[0];
      const overrides = sourceEntry.state?.overrides || {};
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined || value === null || value === '') continue;
        setEntryOverride(targetDayIndex, newEntry.entryId, key, value);
      }
    }
  }

  function rebuildBasketForDuration(nextDuration) {
    const previousSnapshot = basketActor.getSnapshot().context;
    const days = previousSnapshot.state?.days || [];

    basketUnsub?.unsubscribe?.();
    basketActor.stop();

    basketActor = createBasketActor({
      db,
      dayCount: nextDuration,
      initialSelectedDayIndex: Math.min(previousSnapshot.selectedDayIndex || 1, nextDuration),
      initialContext: toActorContext(settings),
    });

    basketUnsub = basketActor.subscribe(() => {
      const selectedDay = basketActor.getSnapshot().context.selectedDayIndex;
      settings = sanitizeSettings({ ...settings, dia: selectedDay });
      notify();
    });

    for (const day of days) {
      if (day.dayIndex > nextDuration) continue;
      for (const entry of day.entries || []) {
        cloneEntryToDay(entry, day.dayIndex);
      }
    }
  }

  function getSnapshot() {
    const catalogContext = catalogActor.getSnapshot().context;
    const basketContext = basketActor.getSnapshot().context;
    const basketState = basketContext.state || { days: [], summary: {}, selectedDayState: null };

    const categories = filterCatalogCategories(catalogStateToUI(catalogContext), catalogSearchTerm);
    const selectedDayState = basketState.selectedDayState || null;
    const basketEntries = (selectedDayState?.entries || []).map((entry) => ({
      ...entry,
      hora: entry.hora || entry.state?.overrides?.hora || entry.state?.schedule?.hora || '09:00',
      duracionMin: entry.duracionMin || entry.state?.overrides?.duracionMin || entry.state?.quantities?.duracionMin || 60,
    }));

    return {
      stage,
      clientModalOpen,
      selectedClient,
      clients: clientList,
      settings,
      catalog: {
        searchTerm: catalogSearchTerm,
        summary: catalogContext.state?.summary || {},
        categories,
      },
      basket: {
        dayOptions: basketContext.dayOptions || [],
        selectedDayIndex: basketContext.selectedDayIndex,
        selectedDayState,
        basketEntries,
        summary: basketState.summary || {},
        days: basketState.days || [],
      },
      validation: buildValidationProjection(selectedClient, settings, basketState),
    };
  }

  function catalogStateToUI(catalogContext) {
    const categories = catalogContext.state?.categories || [];
    return categories.map((category) => ({
      ...category,
      state: category.state || {
        items: [],
      },
    }));
  }

  function resolveEntry(entryId, preferredDayIndex = null) {
    const days = basketActor.getSnapshot().context.state?.days || [];
    if (preferredDayIndex) {
      const preferred = days.find((day) => Number(day.dayIndex) === Number(preferredDayIndex));
      const match = preferred?.entries?.find((entry) => entry.entryId === entryId);
      if (match) return { dayIndex: preferred.dayIndex, entry: match };
    }
    for (const day of days) {
      const match = (day.entries || []).find((entry) => entry.entryId === entryId);
      if (match) return { dayIndex: day.dayIndex, entry: match };
    }
    return null;
  }

  function requireClient() {
    if (selectedClient) return true;
    clientModalOpen = true;
    return false;
  }

  const api = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot,

    openClientModal() {
      clientModalOpen = true;
      if (stage === 'browse') stage = 'client';
      notify();
    },

    closeClientModal() {
      clientModalOpen = false;
      if (stage === 'client') {
        stage = selectedClient ? 'basket' : 'browse';
      }
      notify();
    },

    selectClient(clientId) {
      const nextClient = clientList.find((client) => String(client.id) === String(clientId));
      if (!nextClient) return;
      selectedClient = nextClient;
      clientModalOpen = false;
      if (stage === 'browse' || stage === 'client') {
        stage = 'basket';
      }
      notify();
    },

    startQuotation() {
      if (!requireClient()) {
        stage = 'client';
        notify();
        return;
      }
      stage = 'basket';
      notify();
    },

    resetToBrowse() {
      stage = 'browse';
      clientModalOpen = false;
      notify();
    },

    advanceToValidation() {
      if (stage !== 'basket') return;
      stage = 'validation';
      notify();
    },

    backToBasket() {
      stage = 'basket';
      notify();
    },

    setCatalogSearch(term = '') {
      catalogSearchTerm = String(term || '');
      notify();
    },

    toggleCategory(categoryId) {
      catalogActor.send({ type: 'TOGGLE_CATEGORY', categoryId });
      notify();
    },

    selectDay(dayIndex) {
      selectDay(dayIndex);
    },

    setQuotationSettings(patch = {}) {
      const next = sanitizeSettings({ ...settings, ...(patch || {}) });
      const prevDuration = settings.duracionDias;
      settings = next;

      if (next.duracionDias !== prevDuration) {
        rebuildBasketForDuration(next.duracionDias);
      }

      pushSharedContext({
        paxGlobal: next.paxGlobal,
        hora: next.horaInicio,
        duracionMin: next.duracionMin,
      });

      selectDay(next.dia);
      notify();
    },

    shipItemToSelectedDay(itemId, overrides = {}) {
      if (!requireClient()) {
        stage = 'client';
        notify();
        return;
      }
      const dayIndex = selectedDayIndex();
      console.log(`[RUNTIME] shipItemToSelectedDay: itemId=${itemId}, day=${dayIndex}, overrides=`, overrides);
      
      basketActor.send({
        type: 'SHIP_ITEM_TO_DAY',
        dayIndex,
        itemId,
      });

      // If overrides (like hora) are provided, apply them immediately
      if (Object.keys(overrides).length > 0) {
        setTimeout(() => {
          const snapshot = basketActor.getSnapshot().context;
          const day = (snapshot.state?.days || []).find(d => d.dayIndex === dayIndex);
          const newEntry = day?.entries[day.entries.length - 1];
          if (newEntry && String(newEntry.itemId) === String(itemId)) {
            console.log(`[RUNTIME] applying overrides to new entry:`, newEntry.entryId, overrides);
            for (const [key, value] of Object.entries(overrides)) {
              this.setEntryOverride(newEntry.entryId, key, value);
            }
          } else {
            console.warn(`[RUNTIME] could not find new entry to apply overrides.`, { dayIndex, itemId });
          }
        }, 100); // Increased timeout slightly
      }

      stage = 'basket';
      notify();
    },

    setEntryOverride(entryId, key, value) {
      basketActor.send({
        type: 'SET_ENTRY_OVERRIDE',
        dayIndex: selectedDayIndex(),
        entryId,
        key,
        value,
      });
      notify();
    },

    setItemComment(entryId, text) {
      this.setEntryOverride(entryId, 'comentarios', text);
    },

    setItemTime(entryId, startTime) {
      this.setEntryOverride(entryId, 'hora', startTime);
    },

    setItemDuration(entryId, minutes) {
      this.setEntryOverride(entryId, 'duracionMin', minutes);
    },

    clearEntryOverride(entryId, key) {
      basketActor.send({
        type: 'CLEAR_ENTRY_OVERRIDE',
        dayIndex: selectedDayIndex(),
        entryId,
        key,
      });
      notify();
    },

    resetEntryOverrides(entryId) {
      basketActor.send({
        type: 'RESET_ENTRY_OVERRIDES',
        dayIndex: selectedDayIndex(),
        entryId,
      });
      notify();
    },

    removeEntry(entryId) {
      basketActor.send({
        type: 'REMOVE_ENTRY',
        dayIndex: selectedDayIndex(),
        entryId,
      });
      notify();
    },

    duplicateEntryInDay(entryId) {
      const located = resolveEntry(entryId, selectedDayIndex());
      if (!located) return;
      cloneEntryToDay(located.entry, located.dayIndex);
      notify();
    },

    copyEntryToDay(entryId, targetDayIndex) {
      const located = resolveEntry(entryId, selectedDayIndex());
      if (!located) return;
      const target = Math.max(1, Number(targetDayIndex) || 1);
      if (target > settings.duracionDias) {
        api.setQuotationSettings({ duracionDias: target, dia: selectedDayIndex() });
      }
      cloneEntryToDay(located.entry, target);
      notify();
    },

    moveEntryToDay(entryId, targetDayIndex) {
      const target = Math.max(1, Number(targetDayIndex) || 1);
      if (target > settings.duracionDias) {
        api.setQuotationSettings({ duracionDias: target, dia: selectedDayIndex() });
      }
      basketActor.send({
        type: 'MOVE_ENTRY_TO_DAY',
        fromDayIndex: selectedDayIndex(),
        targetDayIndex: target,
        entryId,
      });
      notify();
    },

    copySelectedDayToNextDay() {
      const fromDay = selectedDayIndex();
      const toDay = fromDay + 1;
      if (toDay > settings.duracionDias) {
        api.setQuotationSettings({ duracionDias: toDay, dia: fromDay });
      }

      const entries = getDayEntries(fromDay);
      for (const entry of entries) {
        cloneEntryToDay(entry, toDay);
      }
      notify();
    },

    stop() {
      catalogUnsub?.unsubscribe?.();
      basketUnsub?.unsubscribe?.();
      catalogActor.stop();
      basketActor.stop();
      listeners.clear();
    },
  };

  return api;
}
