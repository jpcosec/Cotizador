import { describe, expect, it, vi } from 'vitest';
import { createSidebar } from './Sidebar.js';

describe('SidebarController', () => {
  const createMockRuntime = () => ({
    getSnapshot: vi.fn(() => ({
      selectedClient: { name: 'Test Client' },
      settings: { pax: 10 },
      catalog: { items: [], search: '', categories: [] }
    })),
    openClientModal: vi.fn(),
    setQuotationSettings: vi.fn(),
    setCatalogSearch: vi.fn(),
    toggleCategory: vi.fn(),
    shipItemToSelectedDay: vi.fn(),
  });

  it('toDisplayObject returns snapshot data and methods', () => {
    const runtime = createMockRuntime();
    const sidebar = createSidebar(runtime);
    const display = sidebar.toDisplayObject();

    expect(display.selectedClient.name).toBe('Test Client');
    expect(display.settings.pax).toBe(10);
    expect(typeof display.openClientModal).toBe('function');
  });

  it('proxies methods to runtime', () => {
    const runtime = createMockRuntime();
    const sidebar = createSidebar(runtime);
    const display = sidebar.toDisplayObject();

    display.openClientModal();
    expect(runtime.openClientModal).toHaveBeenCalled();

    display.setSetting('pax', 20);
    expect(runtime.setQuotationSettings).toHaveBeenCalledWith({ pax: 20 });

    display.setCatalogSearch('coffee');
    expect(runtime.setCatalogSearch).toHaveBeenCalledWith('coffee');

    display.toggleCategory('cat1');
    expect(runtime.toggleCategory).toHaveBeenCalledWith('cat1');

    display.shipCatalogEntry('item1', { qty: 2 });
    expect(runtime.shipItemToSelectedDay).toHaveBeenCalledWith('item1', { qty: 2 });
  });

  it('handles dragging state locally', () => {
    const runtime = createMockRuntime();
    const sidebar = createSidebar(runtime);
    
    sidebar.startCatalogDrag('item1');
    expect(sidebar.toDisplayObject().draggingCatalogItemId).toBe('item1');

    sidebar.endCatalogDrag();
    expect(sidebar.toDisplayObject().draggingCatalogItemId).toBe(null);
  });
});
