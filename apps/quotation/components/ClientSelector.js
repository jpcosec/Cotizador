/**
 * ClientSelector Controller
 * 
 * Manages client search, filtering, selection, and keyboard navigation
 * for the client selection modal.
 */

export function createClientSelectorController(clients = []) {
  let searchTerm = '';
  let focusedIndex = 0;
  const listeners = new Map();

  // Normalize clients to a consistent shape
  const normalizedClients = clients.map(c => ({
    id: c.id || c.ID_Cliente,
    nombre: c.nombre || c.Nombre_Empresa,
    rut: c.rut || c.RUT,
    email: c.email || c.Email,
    telefono: c.telefono || c.Telefono,
    contacto: c.contacto || null,
    ...c
  }));

  function getSearchTerm() {
    return searchTerm;
  }

  function search(term) {
    searchTerm = term.toLowerCase().trim();
    focusedIndex = 0; // Reset focus when search changes
  }

  function getFilteredClients() {
    if (!searchTerm) {
      return normalizedClients;
    }

    return normalizedClients.filter(client => {
      const nombre = (client.nombre || '').toLowerCase();
      const rut = (client.rut || '').toLowerCase();
      const email = (client.email || '').toLowerCase();

      return (
        nombre.includes(searchTerm) ||
        rut.includes(searchTerm) ||
        email.includes(searchTerm)
      );
    });
  }

  function selectClient(clientId) {
    const client = normalizedClients.find(c => c.id === clientId);
    if (client) {
      emit('CLIENT_SELECTED', client);
    }
  }

  function getFocusedClientIndex() {
    return focusedIndex;
  }

  function getFocusedClient() {
    const filtered = getFilteredClients();
    if (focusedIndex >= 0 && focusedIndex < filtered.length) {
      return filtered[focusedIndex];
    }
    return null;
  }

  function keyboardNavigate(direction) {
    const filtered = getFilteredClients();
    if (filtered.length === 0) return;

    if (direction === 'DOWN') {
      if (focusedIndex < filtered.length - 1) {
        focusedIndex++;
      }
    } else if (direction === 'UP') {
      if (focusedIndex > 0) {
        focusedIndex--;
      }
    }
  }

  function cancel() {
    emit('CANCEL');
  }

  function on(eventName, callback) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, []);
    }
    listeners.get(eventName).push(callback);
  }

  function emit(eventName, data) {
    if (listeners.has(eventName)) {
      listeners.get(eventName).forEach(callback => {
        callback(data);
      });
    }
  }

  function getAllClients() {
    return normalizedClients;
  }

  return {
    getSearchTerm,
    search,
    getFilteredClients,
    selectClient,
    getFocusedClientIndex,
    getFocusedClient,
    keyboardNavigate,
    cancel,
    on,
    getAllClients
  };
}
