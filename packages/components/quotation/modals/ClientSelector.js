import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class ClientSelector extends ModalControllerBase {
  constructor(clients = []) {
    super();
    this._clients = [...clients];
    this._searchTerm = '';
    this._focusedIndex = 0;
  }

  setClients(clients = []) {
    this._clients = [...clients];
    this._focusedIndex = 0;
    return this;
  }

  getSearchTerm() {
    return this._searchTerm;
  }

  search(term = '') {
    this._searchTerm = String(term).toLowerCase().trim();
    this._focusedIndex = 0;
    return this;
  }

  getFilteredClients() {
    if (!this._searchTerm) {
      return [...this._clients];
    }

    return this._clients.filter((client) => {
      const nombre = String(client?.nombre ?? '').toLowerCase();
      const rut = String(client?.rut ?? '').toLowerCase();
      const email = String(client?.email ?? '').toLowerCase();
      return (
        nombre.includes(this._searchTerm) ||
        rut.includes(this._searchTerm) ||
        email.includes(this._searchTerm)
      );
    });
  }

  getFocusedClientIndex() {
    return this._focusedIndex;
  }

  keyboardNavigate(direction) {
    const items = this.getFilteredClients();
    if (!items.length) {
      this._focusedIndex = 0;
      return this;
    }

    if (direction === 'DOWN') {
      this._focusedIndex = Math.min(this._focusedIndex + 1, items.length - 1);
    }

    if (direction === 'UP') {
      this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
    }

    if (direction === 'ENTER') {
      const focused = items[this._focusedIndex];
      if (focused) {
        this.selectClient(focused.id);
      }
    }

    return this;
  }

  selectClient(clientId) {
    const selected = this._clients.find((client) => client.id === clientId);
    if (selected) {
      this.emit('CLIENT_SELECTED', selected);
    }
    return this;
  }

  cancel() {
    this.emit('CANCEL');
    this.close();
    return this;
  }

  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      isLoading: this.isLoading(),
      searchTerm: this.getSearchTerm(),
      filteredClients: this.getFilteredClients(),
      focusedIndex: this.getFocusedClientIndex(),
      errors: this.getErrors()
    };
  }
}

export function createClientSelector(clients = []) {
  return new ClientSelector(clients);
}
