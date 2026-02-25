import { describe, it, expect } from 'vitest';
import { createClientSelectorController } from './ClientSelector.js';

describe('ClientSelector', () => {
  it('should initialize with empty search', () => {
    const controller = createClientSelectorController([]);
    expect(controller.getSearchTerm()).toBe('');
  });

  it('should filter clients by search term', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9' },
      { id: 'c2', nombre: 'Empresa B', rut: '98.765.432-1' }
    ];
    const controller = createClientSelectorController(clients);
    controller.search('Empresa A');
    const filtered = controller.getFilteredClients();
    expect(filtered.length).toBe(1);
    expect(filtered[0].nombre).toBe('Empresa A');
  });

  it('should emit CLIENT_SELECTED when client is clicked', () => {
    const clients = [{ id: 'c1', nombre: 'Empresa A' }];
    const controller = createClientSelectorController(clients);
    let selectedClient = null;
    controller.on('CLIENT_SELECTED', (client) => {
      selectedClient = client;
    });
    controller.selectClient('c1');
    expect(selectedClient.id).toBe('c1');
  });

  it('should allow keyboard navigation (arrow keys)', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A' },
      { id: 'c2', nombre: 'Empresa B' }
    ];
    const controller = createClientSelectorController(clients);
    controller.keyboardNavigate('DOWN');
    expect(controller.getFocusedClientIndex()).toBe(1);
    controller.keyboardNavigate('UP');
    expect(controller.getFocusedClientIndex()).toBe(0);
  });

  it('should emit CANCEL when cancel is clicked', () => {
    const controller = createClientSelectorController([]);
    let cancelled = false;
    controller.on('CANCEL', () => {
      cancelled = true;
    });
    controller.cancel();
    expect(cancelled).toBe(true);
  });

  it('should filter by name, RUT, and email', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9', email: 'a@test.com' },
      { id: 'c2', nombre: 'Empresa B', rut: '98.765.432-1', email: 'b@test.com' }
    ];
    const controller = createClientSelectorController(clients);
    
    controller.search('12.345.678');
    expect(controller.getFilteredClients().length).toBe(1);
    expect(controller.getFilteredClients()[0].id).toBe('c1');
    
    controller.search('b@test');
    expect(controller.getFilteredClients().length).toBe(1);
    expect(controller.getFilteredClients()[0].id).toBe('c2');
  });

  it('should return empty results when search has no matches', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9' }
    ];
    const controller = createClientSelectorController(clients);
    controller.search('Empresa Z');
    expect(controller.getFilteredClients().length).toBe(0);
  });

  it('should reset focus when search changes', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A' },
      { id: 'c2', nombre: 'Empresa B' }
    ];
    const controller = createClientSelectorController(clients);
    controller.keyboardNavigate('DOWN');
    expect(controller.getFocusedClientIndex()).toBe(1);
    controller.search('Empresa');
    expect(controller.getFocusedClientIndex()).toBe(0);
  });

  it('should get focused client', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A' },
      { id: 'c2', nombre: 'Empresa B' }
    ];
    const controller = createClientSelectorController(clients);
    controller.keyboardNavigate('DOWN');
    const focused = controller.getFocusedClient();
    expect(focused.id).toBe('c2');
  });

  it('should handle keyboard navigation at boundaries', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A' },
      { id: 'c2', nombre: 'Empresa B' }
    ];
    const controller = createClientSelectorController(clients);
    controller.keyboardNavigate('UP'); // At top
    expect(controller.getFocusedClientIndex()).toBe(0); // Should stay at 0
    
    controller.keyboardNavigate('DOWN');
    controller.keyboardNavigate('DOWN');
    expect(controller.getFocusedClientIndex()).toBe(1); // Should stay at last
  });

  it('should support multiple event listeners', () => {
    const clients = [{ id: 'c1', nombre: 'Empresa A' }];
    const controller = createClientSelectorController(clients);
    let count = 0;
    controller.on('CANCEL', () => count++);
    controller.on('CANCEL', () => count++);
    controller.cancel();
    expect(count).toBe(2);
  });

  it('should get all original clients', () => {
    const clients = [
      { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9' },
      { id: 'c2', nombre: 'Empresa B', rut: '98.765.432-1' }
    ];
    const controller = createClientSelectorController(clients);
    const allClients = controller.getAllClients();
    expect(allClients.length).toBe(2);
    expect(allClients[0].id).toBe('c1');
    expect(allClients[1].id).toBe('c2');
  });
});
