/* eslint-disable jsdoc/require-jsdoc, max-lines-per-function */
import { describe, expect, it, vi } from 'vitest';
import { createQuotationFlowRuntimeView } from './QuotationFlowRuntimeView.js';

function createRuntimeStub(snapshotOverrides = {}) {
  const snapshot = {
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
    catalog: { searchTerm: '', categories: [], summary: { totalCategories: 0 } },
    basket: { summary: { totalEntries: 0 } },
    validation: { totals: { subtotal: 0, iva: 0, total: 0 } },
    persistence: { error: null, isSaving: false },
    ...snapshotOverrides,
  };

  return {
    getSnapshot: vi.fn(() => snapshot),
    subscribe: vi.fn(() => () => {}),
  };
}

describe('QuotationFlowRuntimeView', () => {
  it('maps runtime snapshot into a generic view projection', () => {
    const runtime = createRuntimeStub({
      stage: 'basket',
      selectedClient: { id: 'CLI-1', nombre: 'Empresa Uno' },
      catalog: { summary: { totalCategories: 4 } },
      basket: { summary: { totalEntries: 3 } },
    });

    const view = createQuotationFlowRuntimeView(runtime);
    const projection = view.getProjection();

    expect(projection.stage).toBe('basket');
    expect(projection.ui.title).toBe('Empresa Uno');
    expect(projection.shell).toMatchObject({
      selectedClient: { id: 'CLI-1', nombre: 'Empresa Uno' },
      catalogSummary: { totalCategories: 4 },
      basketSummary: { totalEntries: 3 },
    });
  });

  it('tracks persistence errors as runtime view status', () => {
    const runtime = createRuntimeStub({
      persistence: { error: 'Save failed', isSaving: false },
    });

    const view = createQuotationFlowRuntimeView(runtime);
    expect(view.status).toBe('error');
  });

  it('preserves shell projection after later stage transitions', () => {
    const runtime = createRuntimeStub({
      stage: 'basket',
      selectedClient: { id: 'CLI-1', nombre: 'Empresa Uno' },
    });

    const view = createQuotationFlowRuntimeView(runtime);
    view.transition({ type: 'NEXT_STAGE' });

    expect(view.getProjection()).toMatchObject({
      stage: 'validation',
      shell: {
        selectedClient: { id: 'CLI-1', nombre: 'Empresa Uno' },
      },
      ui: {
        title: 'Empresa Uno',
      },
    });
  });
});
