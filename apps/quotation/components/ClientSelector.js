import { createClientSelector } from '../../../packages/components/quotation/modals/ClientSelector.js';

/**
 * Legacy compatibility wrapper.
 * Preserves the old app-level API while delegating core logic
 * to the package implementation in `packages/components/quotation`.
 */
export function createClientSelectorController(clients = []) {
  const normalizedClients = clients.map((client) => ({
    id: client.id || client.ID_Cliente,
    nombre: client.nombre || client.Nombre_Empresa,
    rut: client.rut || client.RUT,
    email: client.email || client.Email,
    telefono: client.telefono || client.Telefono,
    contacto: client.contacto || null,
    ...client
  }));

  const selector = createClientSelector(normalizedClients);

  return {
    getSearchTerm() {
      return selector.getSearchTerm();
    },

    search(term) {
      selector.search(term);
    },

    getFilteredClients() {
      return selector.getFilteredClients();
    },

    selectClient(clientId) {
      selector.selectClient(clientId);
    },

    getFocusedClientIndex() {
      return selector.getFocusedClientIndex();
    },

    getFocusedClient() {
      const filtered = selector.getFilteredClients();
      return filtered[selector.getFocusedClientIndex()] ?? null;
    },

    keyboardNavigate(direction) {
      selector.keyboardNavigate(direction);
    },

    cancel() {
      selector.cancel();
    },

    on(eventName, callback) {
      selector.on(eventName, callback);
    },

    off(eventName, callback) {
      selector.off(eventName, callback);
    },

    getAllClients() {
      return [...normalizedClients];
    }
  };
}
