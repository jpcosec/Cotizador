import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class Validate extends AbstractEvent {
  constructor() {
    super('Validate');
  }

  async execute(ctx) {
    const { state } = ctx;

    if (!state.lineas.length) {
      this.addError('Quotation has no lines');
    }

    if (!state.cotizacion.ID_Cliente) {
      this.addError('Missing client');
    }

    if (state.totals.total <= 0) {
      this.addError('Total must be positive');
    }

    if (!this.errors.length) {
      this.addMessage('INFO', 'Validation passed');
    }
  }
}
