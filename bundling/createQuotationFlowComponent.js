import { createQuotationRuntime } from './createQuotationRuntime.js';

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSettingValue(key, value, fallbackSettings) {
  if (key === 'fechaInicio') return String(value || fallbackSettings.fechaInicio);
  if (key === 'duracionDias') return Math.max(1, Math.floor(toNumberValue(value, fallbackSettings.duracionDias)));
  if (key === 'dia') return Math.max(1, Math.floor(toNumberValue(value, fallbackSettings.dia)));
  if (key === 'paxGlobal') return Math.max(1, Math.floor(toNumberValue(value, fallbackSettings.paxGlobal)));
  if (key === 'duracionMin') return Math.max(0, Math.floor(toNumberValue(value, fallbackSettings.duracionMin)));
  return value;
}

function parseOverrideValue(value) {
  if (value === '') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export function createQuotationFlowComponent(options = {}) {
  const runtime = options.runtime || createQuotationRuntime(options);

  return {
    stage: 'browse',
    clientModalOpen: false,
    selectedClient: null,
    globalContext: {
      hora: '09:00',
    },
    settings: {
      fechaInicio: new Date().toISOString().slice(0, 10),
      duracionDias: 3,
      paxGlobal: 20,
      dia: 1,
      horaInicio: '09:00',
      duracionMin: 120,
    },
    clients: [],
    clientSearchTerm: '',
    catalog: { searchTerm: '', categories: [], summary: {} },
    basket: {
      dayOptions: [],
      selectedDayIndex: 1,
      selectedDayState: null,
      basketEntries: [],
      summary: {},
    },
    validation: {
      rows: [],
      totals: { subtotal: 0, iva: 0, total: 0 },
    },
    persistence: {
      isSaving: false,
      isLoading: false,
      error: null,
      quotationId: null,
      lastLoadedId: null,
    },
    loadQuotationId: '',
    draggingCatalogItemId: null,

    async init() {
      const sync = (snapshot) => {
        this.stage = snapshot.stage;
        this.clientModalOpen = snapshot.clientModalOpen;
        this.selectedClient = snapshot.selectedClient;
        this.settings = { ...snapshot.settings };
        this.globalContext = {
          hora: this.settings.horaInicio,
        };
        this.clients = snapshot.clients || [];
        this.catalog = snapshot.catalog || { searchTerm: '', categories: [], summary: {} };
        this.basket = snapshot.basket || {
          dayOptions: [],
          selectedDayIndex: 1,
          selectedDayState: null,
          basketEntries: [],
          summary: {},
        };
        this.validation = snapshot.validation || {
          rows: [],
          totals: { subtotal: 0, iva: 0, total: 0 },
        };
        this.persistence = snapshot.persistence || {
          isSaving: false,
          isLoading: false,
          error: null,
          quotationId: null,
          lastLoadedId: null,
        };
      };

      sync(runtime.getSnapshot());
      runtime.subscribe(sync);

      if (typeof runtime.bootstrapReferenceData === 'function') {
        try {
          await runtime.bootstrapReferenceData();
        } catch (error) {
          console.warn('bootstrapReferenceData failed, using bundled seed', error);
        }
      }
    },

    startQuotation() {
      runtime.startQuotation();
    },

    resetToBrowse() {
      runtime.resetToBrowse();
    },

    goValidation() {
      runtime.advanceToValidation();
    },

    backToBasket() {
      runtime.backToBasket();
    },

    async confirmAndSave() {
      await runtime.confirmSave();
    },

    async loadQuotationById() {
      const quotationId = String(this.loadQuotationId || '').trim();
      if (!quotationId) return;
      await runtime.loadQuotation(quotationId);
    },

    clearPersistenceError() {
      runtime.clearPersistenceError();
    },

    openClientModal() {
      runtime.openClientModal();
    },

    closeClientModal() {
      runtime.closeClientModal();
    },

    setClientSearch(term) {
      this.clientSearchTerm = String(term || '');
    },

    filteredClients() {
      const term = this.clientSearchTerm.trim().toLowerCase();
      if (!term) return this.clients;
      return this.clients.filter((client) => {
        return [client.nombre, client.rut, client.email].some((field) =>
          String(field || '').toLowerCase().includes(term)
        );
      });
    },

    selectClient(clientId) {
      runtime.selectClient(clientId);
    },

    setCatalogSearch(term) {
      runtime.setCatalogSearch(term);
    },

    toggleCategory(categoryId) {
      runtime.toggleCategory(categoryId);
    },

    shipCatalogEntry(itemId) {
      runtime.shipItemToSelectedDay(itemId);
    },

    startCatalogDrag(itemId, event) {
      if (!itemId) return;
      this.draggingCatalogItemId = itemId;
      if (event?.dataTransfer) {
        event.dataTransfer.setData('text/plain', String(itemId));
        event.dataTransfer.effectAllowed = 'copy';
      }
    },

    endCatalogDrag() {
      this.draggingCatalogItemId = null;
    },

    isDraggingCatalogItem(itemId) {
      return String(this.draggingCatalogItemId || '') === String(itemId || '');
    },

    draggedItemId(event) {
      if (this.draggingCatalogItemId) return this.draggingCatalogItemId;
      const fromDataTransfer = event?.dataTransfer?.getData('text/plain');
      if (fromDataTransfer) return fromDataTransfer;
      return null;
    },

    dropOnSelectedDay(event) {
      const itemId = this.draggedItemId(event);
      this.endCatalogDrag();
      if (!itemId) return;
      runtime.shipItemToSelectedDay(itemId);
    },

    dropOnDay(dayIndex, event) {
      const itemId = this.draggedItemId(event);
      this.endCatalogDrag();
      if (!itemId) return;
      runtime.selectDay(Number(dayIndex));
      runtime.shipItemToSelectedDay(itemId);
    },

    selectDay(dayIndex) {
      runtime.selectDay(Number(dayIndex));
    },

    setSetting(key, value) {
      runtime.setQuotationSettings({
        [key]: parseSettingValue(key, value, this.settings),
      });
    },

    setBasketOverride(entryId, key, value) {
      if (value === '') {
        runtime.clearEntryOverride(entryId, key);
        return;
      }
      runtime.setEntryOverride(entryId, key, parseOverrideValue(value));
    },

    clearBasketOverride(entryId, key) {
      runtime.clearEntryOverride(entryId, key);
    },

    resetBasketOverrides(entryId) {
      runtime.resetEntryOverrides(entryId);
    },

    destroyRuntimeEntry(column, entryId) {
      if (column !== 'basket') return;
      runtime.removeEntry(entryId);
    },

    duplicateBasketEntry(entryId) {
      runtime.duplicateEntryInDay(entryId);
    },

    copyBasketEntry(entryId) {
      const target = Number(this.basket.selectedDayIndex || 1) + 1;
      runtime.copyEntryToDay(entryId, target);
    },

    copyDayToNextDay() {
      runtime.copySelectedDayToNextDay();
    },

    ruleClass(state) {
      if ((state?.ruleErrors || []).length > 0) return 'error';
      if ((state?.ruleWarnings || []).length > 0) return 'warn';
      return 'ok';
    },

    ruleIcon(state) {
      if ((state?.ruleErrors || []).length > 0) return 'fa-xmark';
      if ((state?.ruleWarnings || []).length > 0) return 'fa-exclamation';
      return 'fa-check';
    },

    formatMoney(value) {
      return Number(value || 0).toLocaleString('es-CL');
    },
  };
}
