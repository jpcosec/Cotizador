import { ModalControllerBase } from '../../common/base/ui/ModalControllerBase.js';

export class AppState extends ModalControllerBase {
  constructor() {
    super();
    this._value = 'BROWSE';
    this._openModal = null;
    this._selectedClient = null;
    this._quotationContext = null;
    this._basketItems = [];
    this._dbCached = false;
    this._errors = [];
    this._quotationId = null;
  }

  send(eventType, payload = {}) {
    if (this._value === 'BROWSE') {
      this._handleBrowse(eventType);
      return this;
    }

    if (this._value === 'CLIENT_SELECTOR') {
      this._handleClientSelector(eventType, payload);
      return this;
    }

    if (this._value === 'INITIALIZE') {
      this._handleInitialize(eventType, payload);
      return this;
    }

    if (this._value === 'QUOTATION') {
      this._handleQuotation(eventType);
      return this;
    }

    if (this._value === 'VALIDATION') {
      this._handleValidation(eventType);
      return this;
    }

    if (this._value === 'COMPLETED') {
      this._handleCompleted(eventType);
      return this;
    }

    return this;
  }

  getState() {
    return {
      value: this._value,
      context: {
        selectedClient: this._selectedClient,
        quotation: this._quotationContext,
        basketItems: [...this._basketItems],
        dbCached: this._dbCached,
        errors: [...this._errors],
        quotationId: this._quotationId,
        openModal: this._openModal
      }
    };
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
    this._value = 'BROWSE';
    this._openModal = null;
    this._selectedClient = null;
    this._quotationContext = null;
    this._basketItems = [];
    this._dbCached = false;
    this._errors = [];
    this._quotationId = null;
    return this;
  }

  validate() {
    return [];
  }

  toDisplayObject() {
    return {
      value: this._value,
      openModal: this._openModal,
      selectedClient: this._selectedClient,
      quotationContext: this._quotationContext,
      basketItems: [...this._basketItems],
      dbCached: this._dbCached,
      errors: [...this._errors],
      quotationId: this._quotationId
    };
  }

  _handleBrowse(eventType) {
    if (eventType === 'OPEN_CLIENT_MODAL') {
      this._value = 'CLIENT_SELECTOR';
      this.openModal('CLIENT_SELECTOR');
    }
  }

  _handleClientSelector(eventType, payload) {
    if (eventType === 'CLIENT_SELECTED') {
      const normalized = normalizeSelectedClient(payload);
      this._value = 'INITIALIZE';
      this.setSelectedClient(normalized);
      this._openModal = null;
      return;
    }

    if (eventType === 'RESET_TO_HOME') {
      this.resetFlow();
    }
  }

  _handleInitialize(eventType, payload) {
    if (eventType === 'INIT_FORM_SUBMITTED') {
      this._value = 'QUOTATION';
      this.setQuotationContext({
        pax: payload.pax,
        fecha: payload.fecha,
        duracion: payload.duracion
      });
      this._openModal = null;
      return;
    }

    if (eventType === 'RESET_TO_HOME') {
      this.resetFlow();
    }
  }

  _handleQuotation(eventType) {
    if (eventType === 'OPEN_GLOBAL_VARIABLES_FORM') {
      this.openModal('GLOBAL_VARIABLES_FORM');
      return;
    }

    if (eventType === 'SAVE_QUOTATION') {
      this._value = 'VALIDATION';
      this._openModal = null;
      return;
    }

    if (eventType === 'RESET_TO_HOME') {
      this.resetFlow();
    }
  }

  _handleValidation(eventType) {
    if (eventType === 'CONFIRM_SAVE') {
      this._value = 'COMPLETED';
      this._openModal = null;
      this._quotationId = buildQuotationId();
      return;
    }

    if (eventType === 'RESET_TO_HOME') {
      this.resetFlow();
    }
  }

  _handleCompleted(eventType) {
    if (eventType === 'RESET_TO_HOME') {
      this.resetFlow();
    }
  }
}

export function createAppState() {
  return new AppState();
}

function normalizeSelectedClient(payload = {}) {
  return {
    clientId: payload.clientId ?? payload.id ?? null,
    clientName: payload.clientName ?? payload.nombre ?? null
  };
}

function buildQuotationId() {
  return `Q-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
