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
});
