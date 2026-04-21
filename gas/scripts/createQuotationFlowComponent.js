/* eslint-disable complexity, jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { createQuotationRuntime } from './createQuotationRuntime.js';
import { exportQuotationToCsv } from '../../src/services/excelService.js';
import { createSidebar } from '../../src/components/quotation/views/sidebar/Sidebar.js';
import { createTimeline } from '../../src/components/quotation/views/timeline/Timeline.js';
import { createItemList } from '../../src/components/quotation/views/ItemList.js';
import { createModals } from '../../src/components/quotation/views/Modals.js';
import { createQuotationFlowRuntimeView } from './QuotationFlowRuntimeView.js';

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

function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function dedupeByKey(items = [], keySelector) {
  const seen = new Set();

  return (items || []).filter((item) => {
    const key = String(keySelector(item) || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeClients(clients = []) {
  return dedupeByKey(clients, (client) => client?.id);
}

function normalizeQuotationResults(items = []) {
  return dedupeByKey(items, (item) => item?.quotationId);
}

function resolveRuntimeMode(options = {}) {
  const explicit = String(options.runtimeMode || '').trim().toLowerCase();
  if (explicit === 'sandbox' || explicit === 'gas') return explicit;

  if (typeof window !== 'undefined') {
    if (isLocalDevHost(window.location.hostname) && window.location.port === '8090') {
      return 'sandbox';
    }
  }

  return 'gas';
}

function resolveCapabilities(options = {}) {
  const runtimeMode = resolveRuntimeMode(options);
  const defaults = {
    sandbox: {
      databaseEditor: true,
      quotationSearch: true,
      manualLoadById: true,
    },
    gas: {
      databaseEditor: false,
      quotationSearch: true,
      manualLoadById: true,
    },
  };

  return {
    runtimeMode,
    ...defaults[runtimeMode],
    ...(options.capabilities || {}),
  };
}

export function createQuotationFlowComponent(options = {}) {
  const runtime = options.runtime || createQuotationRuntime(options);
  const capabilities = resolveCapabilities(options);
  const runtimeView = createQuotationFlowRuntimeView(runtime);

  function resolveDatabaseEditorUrl() {
    if (typeof options.databaseEditorUrl === 'string' && options.databaseEditorUrl.trim()) {
      return options.databaseEditorUrl.trim();
    }
    if (!capabilities.databaseEditor) {
      return null;
    }
    if (typeof window !== 'undefined' && isLocalDevHost(window.location.hostname) && window.location.port === '8090') {
      return '/step-I1-database';
    }
    return null;
  }

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
    quotationSearchModalOpen: false,
    quotationSearchTerm: '',
    quotationSearchResults: [],
    quotationSearchLoading: false,
    quotationSearchError: null,
    runtimeMode: capabilities.runtimeMode,
    capabilities,
    databaseEditorEnabled: !!resolveDatabaseEditorUrl(),
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
    databaseEditorUrl: resolveDatabaseEditorUrl(),
    mainTab: 'timeline',
    runtimeProjection: runtimeView.getProjection(),
    sidebar: createSidebar(runtime),
    timeline: createTimeline(runtime),
    itemList: createItemList(runtime),
    modals: createModals(runtime),

    async init() {
      const sync = (snapshot) => {
        runtimeView.receiveRuntimeSnapshot(snapshot);
        const runtimeProjection = runtimeView.getProjection();
        this.runtimeProjection = {
          ...runtimeProjection,
          stage: snapshot.stage ?? runtimeProjection.stage,
          shell: {
            ...(runtimeProjection.shell || {}),
            persistence: snapshot.persistence || runtimeProjection.shell?.persistence || null,
          },
        };
        const shell = this.runtimeProjection.shell || {};
        this.sidebar.onActorUpdate(snapshot);
        this.timeline.onActorUpdate(snapshot);
        this.itemList.onActorUpdate(snapshot);
        this.modals.onActorUpdate(snapshot);
        this.stage = snapshot.stage ?? this.runtimeProjection.stage;
        this.clientModalOpen = shell.clientModalOpen ?? snapshot.clientModalOpen;
        this.selectedClient = shell.selectedClient ?? snapshot.selectedClient;
        this.settings = { ...(shell.settings || snapshot.settings) };
        this.globalContext = {
          hora: this.settings.horaInicio,
        };
        this.clients = normalizeClients(shell.clients || snapshot.clients || []);
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
        this.persistence = shell.persistence || snapshot.persistence || {
          isSaving: false,
          isLoading: false,
          error: null,
          quotationId: null,
          lastLoadedId: null,
        };
      };

      sync(runtime.getSnapshot());
      runtimeView.attachRuntime(runtime);
      runtime.subscribe(sync);

      this.timeline.on('ITEM_DROPPED', ({ itemId, hora }) => {
        runtime.shipItemToSelectedDay(itemId, { hora });
      });
      this.timeline.on('BASKET_ENTRY_UPDATED', ({ entryId, key, value }) => {
        runtime.setEntryOverride(entryId, key, value);
      });
      this.timeline.on('MOVE_STARTED', ({ entry, event }) => {
        this.sidebar.startCatalogDrag(entry.itemId, event);
      });
      this.timeline.on('DRAG_ENDED', () => {
        this.sidebar.endCatalogDrag();
      });

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

    exportToPdf() {
      if (typeof window !== 'undefined') {
        window.print();
      }
    },

    exportToExcel() {
      exportQuotationToCsv(this.validation.rows, this.validation.totals);
    },

    openDatabaseEditor() {
      if (typeof window === 'undefined') return;
      const targetUrl = this.databaseEditorUrl || resolveDatabaseEditorUrl();
      if (!targetUrl) {
        this.persistence = {
          ...(this.persistence || {}),
          error: 'Database editor route is not configured for this environment',
        };
        return;
      }
      const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!popup) {
        window.location.assign(targetUrl);
      }
    },

    async confirmAndSave() {
      if (this.persistence?.isSaving) return;
      await runtime.confirmSave();
    },

    async saveQuotation() {
      if (this.persistence?.isSaving) return;
      runtime.advanceToValidation();
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (runtime.getSnapshot().stage === 'validation') break;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (runtime.getSnapshot().stage !== 'validation') {
        return;
      }
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

    async openQuotationSearchModal() {
      this.quotationSearchModalOpen = true;
      this.quotationSearchError = null;
      this.quotationSearchLoading = true;
      try {
        const result = await runtime.listQuotations({ limit: 50 });
        if (!result?.ok) {
          this.quotationSearchResults = [];
          this.quotationSearchError = result?.error?.message || result?.error || 'Unable to load quotations';
          return;
        }
         this.quotationSearchResults = normalizeQuotationResults(result.data?.items || []);
      } finally {
        this.quotationSearchLoading = false;
      }
    },

    closeQuotationSearchModal() {
      this.quotationSearchModalOpen = false;
      this.quotationSearchError = null;
    },

    setQuotationSearch(term) {
      this.quotationSearchTerm = String(term || '');
    },

    filteredQuotations() {
      const term = this.quotationSearchTerm.trim().toLowerCase();
      if (!term) return this.quotationSearchResults;
      return this.quotationSearchResults.filter((quotation) => {
        return [quotation.clientName, quotation.quotationId, quotation.quotationDate, quotation.pax].some((field) =>
          String(field || '').toLowerCase().includes(term)
        );
      });
    },

    async selectQuotationResult(quotationId) {
      this.closeQuotationSearchModal();
      this.loadQuotationId = String(quotationId || '');
      await runtime.loadQuotation(quotationId);
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

    shipCatalogEntry(itemId, overrides = {}) {
      runtime.shipItemToSelectedDay(itemId, overrides);
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
      runtime.shipItemToSelectedDay(itemId, {});
    },

    dropOnDay(dayIndex, event) {
      const itemId = this.draggedItemId(event);
      this.endCatalogDrag();
      if (!itemId) return;
      runtime.selectDay(Number(dayIndex));
      runtime.shipItemToSelectedDay(itemId, {});
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

    setItemComment(entryId, text) {
      runtime.setItemComment(entryId, text);
    },

    setItemTime(entryId, startTime) {
      runtime.setItemTime(entryId, startTime);
    },

    setItemDuration(entryId, minutes) {
      runtime.setItemDuration(entryId, minutes);
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
