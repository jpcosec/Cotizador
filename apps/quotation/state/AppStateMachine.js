/**
 * AppStateMachine - Central state manager for the quotation flow.
 * Manages modal states, user context, quotation data, and transitions.
 */

class AppStateMachine {
  constructor() {
    this.state = {
      value: 'BROWSE',
      context: {
        selectedClient: null,
        quotation: null,
        basketItems: [],
        dbCached: false,
        errors: [],
        quotationId: null,
        openModal: null,
      },
    };
  }

  /**
   * Get current state (value and context).
   * @returns {Object} Current state with value and context
   */
  getState() {
    return {
      value: this.state.value,
      context: { ...this.state.context },
    };
  }

  /**
   * Send an event to the state machine.
   * @param {string} eventType - Type of event
   * @param {Object} payload - Event payload (optional)
   */
  send(eventType, payload = {}) {
    const { value, context } = this.state;

    switch (value) {
      case 'BROWSE':
        this.handleBrowseState(eventType, payload);
        break;

      case 'CLIENT_SELECTOR':
        this.handleClientSelectorState(eventType, payload);
        break;

      case 'INITIALIZE':
        this.handleInitializeState(eventType, payload);
        break;

      case 'QUOTATION':
        this.handleQuotationState(eventType, payload);
        break;

      case 'VALIDATION':
        this.handleValidationState(eventType, payload);
        break;

      case 'COMPLETED':
        this.handleCompletedState(eventType, payload);
        break;

      default:
        break;
    }
  }

  /**
   * Handle events in BROWSE state.
   */
  handleBrowseState(eventType, payload) {
    switch (eventType) {
      case 'OPEN_CLIENT_MODAL':
        this.state.value = 'CLIENT_SELECTOR';
        this.state.context.openModal = 'CLIENT_SELECTOR';
        break;
      default:
        break;
    }
  }

  /**
   * Handle events in CLIENT_SELECTOR state.
   */
  handleClientSelectorState(eventType, payload) {
    switch (eventType) {
      case 'CLIENT_SELECTED':
        this.state.value = 'INITIALIZE';
        this.state.context.selectedClient = {
          clientId: payload.clientId,
          clientName: payload.clientName,
        };
        this.state.context.openModal = null;
        break;
      default:
        break;
    }
  }

  /**
   * Handle events in INITIALIZE state.
   */
  handleInitializeState(eventType, payload) {
    switch (eventType) {
      case 'INIT_FORM_SUBMITTED':
        this.state.value = 'QUOTATION';
        this.state.context.quotation = {
          pax: payload.pax,
          fecha: payload.fecha,
          duracion: payload.duracion,
        };
        this.state.context.openModal = null;
        break;

      case 'RESET_TO_HOME':
        this.state.value = 'BROWSE';
        this.state.context.selectedClient = null;
        this.state.context.quotation = null;
        this.state.context.openModal = null;
        break;

      default:
        break;
    }
  }

  /**
   * Handle events in QUOTATION state.
   */
  handleQuotationState(eventType, payload) {
    switch (eventType) {
      case 'OPEN_GLOBAL_VARIABLES_FORM':
        this.state.context.openModal = 'GLOBAL_VARIABLES_FORM';
        // Stay in QUOTATION state
        break;

      case 'SAVE_QUOTATION':
        this.state.value = 'VALIDATION';
        this.state.context.openModal = null;
        break;

      case 'RESET_TO_HOME':
        this.state.value = 'BROWSE';
        this.state.context = {
          selectedClient: null,
          quotation: null,
          basketItems: [],
          openModal: null,
          dbCached: false,
          quotationId: null,
          errors: [],
        };
        break;

      default:
        break;
    }
  }

  /**
   * Handle events in VALIDATION state.
   */
  handleValidationState(eventType, payload) {
    switch (eventType) {
      case 'CONFIRM_SAVE':
        this.state.value = 'COMPLETED';
        this.state.context.openModal = null;
        this.state.context.quotationId = `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        break;

      case 'RESET_TO_HOME':
        this.state.value = 'BROWSE';
        this.state.context = {
          selectedClient: null,
          quotation: null,
          basketItems: [],
          openModal: null,
          dbCached: false,
          quotationId: null,
          errors: [],
        };
        break;

      default:
        break;
    }
  }

  /**
   * Handle events in COMPLETED state.
   */
  handleCompletedState(eventType, payload) {
    switch (eventType) {
      case 'RESET_TO_HOME':
        this.state.value = 'BROWSE';
        this.state.context = {
          selectedClient: null,
          quotation: null,
          basketItems: [],
          openModal: null,
          dbCached: false,
          quotationId: null,
          errors: [],
        };
        break;

      default:
        break;
    }
  }
}

/**
 * Factory function to create a new AppStateMachine instance.
 * @returns {AppStateMachine} New state machine instance
 */
export function createAppStateMachine() {
  return new AppStateMachine();
}
