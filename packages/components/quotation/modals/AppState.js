import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class AppState extends ModalControllerBase {
  constructor() {
    super();
    this._openModal = 'HOME';
    this._selectedClient = null;
    this._quotationContext = null;
  }

  openModal(name) {
    this._openModal = name;
    this.emit('MODAL_CHANGED', { modal: name });
    return this;
  }

  getOpenModal() {
    return this._openModal;
  }

  setSelectedClient(client) {
    this._selectedClient = client;
    this.emit('CLIENT_SELECTED', client);
    return this;
  }

  setQuotationContext(context) {
    this._quotationContext = context;
    this.emit('CONTEXT_UPDATED', context);
    return this;
  }

  resetFlow() {
    this._openModal = 'HOME';
    this._selectedClient = null;
    this._quotationContext = null;
    return this;
  }

  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      openModal: this._openModal,
      selectedClient: this._selectedClient,
      quotationContext: this._quotationContext
    };
  }
}

export function createAppState() {
  return new AppState();
}
