import { describe, expect, it, vi } from 'vitest';
import { ModalsController } from './Modals.js';

describe('ModalsController', () => {
  const mockRuntime = {
    getSnapshot: vi.fn(() => ({
      clients: [
        { id: '1', nombre: 'Client A', rut: '1-1', email: 'a@test.com' },
        { id: '2', nombre: 'Client B', rut: '2-2', email: 'b@test.com' },
      ],
      clientModalOpen: false,
      quotationSearchModalOpen: false,
    })),
    listQuotations: vi.fn(),
    loadQuotation: vi.fn(),
    selectClient: vi.fn(),
  };

  it('filters clients correctly', () => {
    const controller = new ModalsController(mockRuntime);
    
    // No search term
    expect(controller.filteredClients()).toHaveLength(2);

    // Search by name
    controller.setClientSearch('Client A');
    expect(controller.filteredClients()).toHaveLength(1);
    expect(controller.filteredClients()[0].nombre).toBe('Client A');

    // Search by rut
    controller.setClientSearch('2-2');
    expect(controller.filteredClients()).toHaveLength(1);
    expect(controller.filteredClients()[0].nombre).toBe('Client B');

    // Case insensitive
    controller.setClientSearch('client a');
    expect(controller.filteredClients()).toHaveLength(1);
  });

  it('filters quotations correctly', async () => {
    const controller = new ModalsController(mockRuntime);
    
    mockRuntime.listQuotations.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { quotationId: 'Q1', clientName: 'Alice', quotationDate: '2023-01-01', pax: 10 },
          { quotationId: 'Q2', clientName: 'Bob', quotationDate: '2023-01-02', pax: 20 },
        ]
      }
    });

    await controller.openQuotationSearchModal();
    expect(controller.quotationSearchResults).toHaveLength(2);

    controller.setQuotationSearch('Alice');
    expect(controller.filteredQuotations()).toHaveLength(1);
    expect(controller.filteredQuotations()[0].clientName).toBe('Alice');

    controller.setQuotationSearch('Q2');
    expect(controller.filteredQuotations()).toHaveLength(1);
    expect(controller.filteredQuotations()[0].quotationId).toBe('Q2');
  });

  it('calls selectClient on runtime', () => {
    const controller = new ModalsController(mockRuntime);
    controller.selectClient('123');
    expect(mockRuntime.selectClient).toHaveBeenCalledWith('123');
  });

  it('calls loadQuotation on runtime when selecting result', async () => {
    const controller = new ModalsController(mockRuntime);
    await controller.selectQuotationResult('Q1');
    expect(mockRuntime.loadQuotation).toHaveBeenCalledWith('Q1');
  });

  it('toDisplayObject returns expected structure', () => {
    const controller = new ModalsController(mockRuntime);
    const display = controller.toDisplayObject();
    
    expect(display).toHaveProperty('clientSearchTerm');
    expect(display).toHaveProperty('quotationSearchTerm');
    expect(display).toHaveProperty('filteredClients');
    expect(display).toHaveProperty('filteredQuotations');
    expect(typeof display.selectClient).toBe('function');
  });
});
