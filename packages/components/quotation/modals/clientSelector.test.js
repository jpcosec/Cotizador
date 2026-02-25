import { describe, expect, it } from 'vitest';
import { createClientSelector } from './ClientSelector.js';

const CLIENTS = [
  { id: 'c1', nombre: 'Empresa A', rut: '12.345.678-9', email: 'a@mail.com' },
  { id: 'c2', nombre: 'Empresa B', rut: '98.765.432-1', email: 'b@mail.com' }
];

describe('ClientSelector', () => {
  it('filters clients by search term', () => {
    const selector = createClientSelector(CLIENTS);

    selector.search('empresa a');

    expect(selector.getFilteredClients()).toHaveLength(1);
    expect(selector.getFilteredClients()[0].id).toBe('c1');
  });

  it('supports keyboard navigation', () => {
    const selector = createClientSelector(CLIENTS);

    selector.keyboardNavigate('DOWN').keyboardNavigate('DOWN').keyboardNavigate('UP');

    expect(selector.getFocusedClientIndex()).toBe(0);
  });

  it('emits CLIENT_SELECTED when selecting a client', () => {
    const selector = createClientSelector(CLIENTS);
    let selected = null;
    selector.on('CLIENT_SELECTED', (client) => {
      selected = client;
    });

    selector.selectClient('c2');

    expect(selected.id).toBe('c2');
  });
});
