import { loadSeedFromCsvUrl } from '../../../packages/database/src/csvSeed.browser.js';
import { createDatabase } from '../../../packages/database/src/createDatabase.js';
import { seedToResolverDb } from '../../../packages/database/src/playgroundAdapter.js';
import { LocalPersistenceAdapter } from '../../../packages/database/src/persistence/LocalPersistenceAdapter.js';
import {
  basketRuntimeHtml,
  catalogRuntimeHtml,
} from '../../../packages/components/item/ui/playgroundItemSections.js';
import { createQuotationInternalRuntime } from '../state/createQuotationInternalRuntime.js';
import { createPersistedQuotationRuntime } from '../state/createPersistedQuotationRuntime.js';

const CSV_BASE_URL = '/data/init';

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

function extractClients(seed = []) {
  const clientRows = seed.find((entry) => entry.table === 'CLIENTES')?.records || [];
  const seen = new Set();

  return clientRows
    .map((row) => ({
      id: row.ID_Cliente,
      nombre: row.Nombre_Empresa,
      rut: row.RUT,
      email: row.Email,
      telefono: row.Telefono,
    }))
    .filter((client) => {
      const id = String(client.id || '').trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveDatabaseEditorUrl() {
  if (typeof window !== 'undefined' && isLocalDevHost(window.location.hostname) && window.location.port === '8090') {
    return '/step-I1-database';
  }
  return null;
}

export async function mountQuotationPlayground(root) {
  if (!root) return;

  const [rawTemplate, seed] = await Promise.all([
    fetch('/apps/quotation/playground/QuotationFlowInternal.html').then((response) => response.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const template = rawTemplate
    .replace('<!-- CATALOG_RUNTIME -->', () => catalogRuntimeHtml)
    .replace('<!-- BASKET_RUNTIME -->', () => basketRuntimeHtml);

  const db = seedToResolverDb(seed);
  const clients = extractClients(seed);
  const persistenceDb = createDatabase({ seed });
  const persistencePort = new LocalPersistenceAdapter({ models: persistenceDb.models });
  const runtime = createPersistedQuotationRuntime({
    createRuntime(initialSettings = {}) {
      return createQuotationInternalRuntime({ db, clients, initialSettings });
    },
    persistencePort,
  });

  window.quotationFlowComponent = function quotationFlowComponent() {
    return {
      stage: 'browse',
      clientModalOpen: false,
      selectedClient: null,
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
      init() {
        const sync = (snapshot) => {
          this.stage = snapshot.stage;
          this.clientModalOpen = snapshot.clientModalOpen;
          this.selectedClient = snapshot.selectedClient;
          this.settings = { ...snapshot.settings };
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
          this.quotationSearchResults = result.data?.items || [];
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
  };

  root.innerHTML = template;
  root.setAttribute('x-data', 'quotationFlowComponent()');
  root.setAttribute('x-init', 'init()');

  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
