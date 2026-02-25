import { describe, expect, it } from 'vitest';
import { createAppState } from './AppState.js';

describe('AppState', () => {
  it('tracks open modal changes', () => {
    const appState = createAppState();
    appState.openModal('CLIENT_SELECTOR');

    expect(appState.getOpenModal()).toBe('CLIENT_SELECTOR');
  });

  it('stores selected client and quotation context', () => {
    const appState = createAppState();
    appState
      .setSelectedClient({ id: 'C1' })
      .setQuotationContext({ pax: 100, fecha: '2026-03-20', duracion: 2 });

    expect(appState.toDisplayObject()).toMatchObject({
      selectedClient: { id: 'C1' },
      quotationContext: { pax: 100, fecha: '2026-03-20', duracion: 2 }
    });
  });
});
