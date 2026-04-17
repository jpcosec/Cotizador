import { loadSeedFromCsvUrl } from '../../../packages/database/src/csvSeed.browser.js';
import { createDatabase } from '../../../packages/database/src/createDatabase.js';
import { seedToResolverDb } from '../../../packages/database/src/playgroundAdapter.js';
import { LocalPersistenceAdapter } from '../../../packages/database/src/persistence/LocalPersistenceAdapter.js';
import { RemotePersistenceAdapter } from '../../../packages/database/src/persistence/RemotePersistenceAdapter.js';
import {
  basketRuntimeHtml,
  catalogRuntimeHtml,
} from '../../../packages/components/item/ui/playgroundItemSections.js';
import { createQuotationInternalRuntime } from '../state/createQuotationInternalRuntime.js';
import { createPersistedQuotationRuntime } from '../state/createPersistedQuotationRuntime.js';
import { exportQuotationToCsv } from '../services/excelService.js';
import { createSidebar } from '../../../packages/components/quotation/views/Sidebar.js';
import { sidebarRuntimeHtml } from '../../../packages/components/quotation/ui/sidebarRuntime.js';
import { createTimeline } from '../../../packages/components/quotation/views/Timeline.js';
import { timelineRuntimeHtml } from '../../../packages/components/quotation/ui/timelineRuntime.js';
import { createItemList } from '../../../packages/components/quotation/views/ItemList.js';
import { itemListRuntimeHtml } from '../../../packages/components/quotation/ui/itemListRuntime.js';
import { createModals } from '../../../packages/components/quotation/views/Modals.js';
import { modalsRuntimeHtml } from '../../../packages/components/quotation/ui/modalsRuntime.js';

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

function resolvePersistencePort(dbModels) {
  if (typeof window !== 'undefined' && isLocalDevHost(window.location.hostname) && window.location.port === '8090') {
    // Redirect to local server on port 8082 (started via serve-local.mjs)
    return new RemotePersistenceAdapter({ endpoint: 'http://localhost:8082/api/google-script-run' });
  }
  return new LocalPersistenceAdapter({ models: dbModels });
}

export async function mountQuotationPlayground(root) {
  if (!root) return;

  const [rawTemplate, printStyles, seed] = await Promise.all([
    fetch('/apps/quotation/playground/QuotationFlowInternal.html').then((response) => response.text()),
    fetch('/apps/quotation/components/QuotationPrintStyles.html').then((response) => response.text()),
    loadSeedFromCsvUrl(CSV_BASE_URL),
  ]);

  const template = rawTemplate
    .replace('<!-- CATALOG_RUNTIME -->', () => catalogRuntimeHtml)
    .replace('<!-- SIDEBAR_RUNTIME -->', () => sidebarRuntimeHtml)
    .replace('<!-- TIMELINE_RUNTIME -->', () => timelineRuntimeHtml)
    .replace('<!-- ITEM_LIST_RUNTIME -->', () => itemListRuntimeHtml)
    .replace('<!-- MODALS_RUNTIME -->', () => modalsRuntimeHtml)
    .replace('<!-- BASKET_RUNTIME -->', () => basketRuntimeHtml)
    .replace('<!-- PRINT_STYLES -->', () => printStyles);

  const db = seedToResolverDb(seed);
  const clients = extractClients(seed);
  const persistenceDb = createDatabase({ seed });
  const persistencePort = resolvePersistencePort(persistenceDb.models);
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
      databaseEditorUrl: resolveDatabaseEditorUrl(),
      sidebar: createSidebar(runtime),
      timeline: createTimeline(),
      itemList: createItemList(runtime),
      modals: createModals(runtime),
      init() {
        const sync = (snapshot) => {
          this.sidebar.onActorUpdate(snapshot);
          this.timeline.onActorUpdate(snapshot);
          this.itemList.onActorUpdate(snapshot);
          this.modals.onActorUpdate(snapshot);
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
        window.print();
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

      selectDay(dayIndex) {
        runtime.selectDay(Number(dayIndex));
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
