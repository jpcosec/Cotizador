/* eslint-disable jsdoc/require-jsdoc, max-lines, max-lines-per-function */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuotationFlowComponent } from './createQuotationFlowComponent.js';

function createRuntimeStub() {
  return {
    getSnapshot() {
      return {
        stage: 'browse',
        clientModalOpen: false,
        selectedClient: null,
        settings: {
          fechaInicio: '2026-01-01',
          duracionDias: 1,
          paxGlobal: 1,
          dia: 1,
          horaInicio: '09:00',
          duracionMin: 60,
        },
        clients: [],
        catalog: { searchTerm: '', categories: [], summary: {} },
        basket: {
          dayOptions: [],
          selectedDayIndex: 1,
          selectedDayState: null,
          basketEntries: [],
          summary: {},
        },
        validation: { rows: [], totals: { subtotal: 0, iva: 0, total: 0 } },
        persistence: {
          isSaving: false,
          isLoading: false,
          error: null,
          quotationId: null,
          lastLoadedId: null,
        },
      };
    },
    subscribe() {},
    advanceToValidation() {},
    confirmSave: vi.fn(async () => ({ ok: true })),
    listQuotations: vi.fn(async () => ({ ok: true, data: { items: [] } })),
    loadQuotation: vi.fn(async () => ({ ok: true })),
  };
}

describe('createQuotationFlowComponent database editor behavior', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('sets databaseEditorUrl to null on unsupported runtime host', () => {
    globalThis.window = {
      location: { hostname: 'example.com', port: '443' },
      open: vi.fn(),
    };

    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });

    expect(component.databaseEditorUrl).toBeNull();
    expect(component.databaseEditorEnabled).toBe(false);
    expect(component.runtimeMode).toBe('gas');
  });

  it('sets persistence error when opening database editor is unavailable', () => {
    globalThis.window = {
      location: { hostname: 'example.com', port: '443' },
      open: vi.fn(),
    };

    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });
    component.openDatabaseEditor();

    expect(component.persistence.error).toBe(
      'Database editor route is not configured for this environment'
    );
    expect(globalThis.window.open).not.toHaveBeenCalled();
  });

  it('keeps database editor unavailable in gas preview runtime', () => {
    globalThis.window = {
      location: { hostname: 'localhost', port: '8082' },
      open: vi.fn(() => ({ closed: false })),
    };

    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });

    expect(component.databaseEditorUrl).toBeNull();
    component.openDatabaseEditor();
    expect(component.persistence.error).toBe(
      'Database editor route is not configured for this environment'
    );
    expect(globalThis.window.open).not.toHaveBeenCalled();
  });

  it('keeps database editor unavailable in gas preview runtime on 127.0.0.1', () => {
    globalThis.window = {
      location: { hostname: '127.0.0.1', port: '8082' },
      open: vi.fn(() => ({ closed: false })),
    };

    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });

    expect(component.databaseEditorUrl).toBeNull();
  });

  it('resolves database editor route for local sandbox runtime on 8090', () => {
    globalThis.window = {
      location: { hostname: '127.0.0.1', port: '8090' },
      open: vi.fn(() => ({ closed: false })),
    };

    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });

    expect(component.databaseEditorUrl).toBe('/step-I1-database');
    expect(component.databaseEditorEnabled).toBe(true);
    expect(component.runtimeMode).toBe('sandbox');
  });

  it('honors explicit gas runtime capabilities', () => {
    const component = createQuotationFlowComponent({
      runtime: createRuntimeStub(),
      runtimeMode: 'gas',
      capabilities: { databaseEditor: false },
    });

    expect(component.runtimeMode).toBe('gas');
    expect(component.databaseEditorEnabled).toBe(false);
    expect(component.capabilities.databaseEditor).toBe(false);
  });

  it('prefers explicit databaseEditorUrl option', () => {
    globalThis.window = {
      location: { hostname: 'example.com', port: '443' },
      open: vi.fn(() => ({ closed: false })),
    };

    const component = createQuotationFlowComponent({
      runtime: createRuntimeStub(),
      databaseEditorUrl: 'https://internal.test/editor',
    });

    component.openDatabaseEditor();

    expect(component.databaseEditorUrl).toBe('https://internal.test/editor');
    expect(globalThis.window.open).toHaveBeenCalledWith(
      'https://internal.test/editor',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens quotation search modal and loads quotation list', async () => {
    const runtime = createRuntimeStub();
    runtime.listQuotations.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            quotationId: 'COT-1',
            clientName: 'Empresa Uno',
            pax: 40,
            quotationDate: '2026-04-10',
          },
        ],
      },
    });

    const component = createQuotationFlowComponent({ runtime });
    await component.openQuotationSearchModal();

    expect(component.quotationSearchModalOpen).toBe(true);
    expect(component.quotationSearchResults).toHaveLength(1);
    expect(runtime.listQuotations).toHaveBeenCalledWith({ limit: 50 });
  });

  it('filters quotation search results by client name and id', () => {
    const component = createQuotationFlowComponent({ runtime: createRuntimeStub() });
    component.quotationSearchResults = [
      { quotationId: 'COT-1', clientName: 'Empresa Uno', pax: 40, quotationDate: '2026-04-10' },
      { quotationId: 'COT-2', clientName: 'Empresa Dos', pax: 25, quotationDate: '2026-05-12' },
    ];

    component.setQuotationSearch('dos');
    expect(component.filteredQuotations()).toEqual([component.quotationSearchResults[1]]);

    component.setQuotationSearch('cot-1');
    expect(component.filteredQuotations()).toEqual([component.quotationSearchResults[0]]);
  });

  it('loads selected quotation from search modal', async () => {
    const runtime = createRuntimeStub();
    const component = createQuotationFlowComponent({ runtime });
    component.quotationSearchModalOpen = true;

    await component.selectQuotationResult('COT-55');

    expect(component.quotationSearchModalOpen).toBe(false);
    expect(component.loadQuotationId).toBe('COT-55');
    expect(runtime.loadQuotation).toHaveBeenCalledWith('COT-55');
  });

  it('dedupes clients from runtime snapshots by id', async () => {
    let subscriber = null;
    const runtime = {
      ...createRuntimeStub(),
      getSnapshot() {
        return {
          ...createRuntimeStub().getSnapshot(),
          clients: [
            { id: 'CLI-1', nombre: 'Empresa Uno' },
            { id: 'CLI-1', nombre: 'Empresa Uno Duplicada' },
          ],
        };
      },
      subscribe(fn) {
        subscriber = fn;
      },
      bootstrapReferenceData: vi.fn(async () => ({ ok: true })),
    };

    const component = createQuotationFlowComponent({ runtime });
    await component.init();

    expect(component.clients).toEqual([{ id: 'CLI-1', nombre: 'Empresa Uno' }]);
    expect(typeof subscriber).toBe('function');
  });

  it('exposes runtimeProjection through GenericView-based shell adapter', async () => {
    const runtime = createRuntimeStub();
    const component = createQuotationFlowComponent({ runtime });

    await component.init();

    expect(component.runtimeProjection).toMatchObject({
      id: 'quotation-flow-view',
      type: 'view',
      stage: 'browse',
      shell: {
        settings: {
          fechaInicio: '2026-01-01',
        },
      },
    });
  });
});
