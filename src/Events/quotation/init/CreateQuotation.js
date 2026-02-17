import { AbstractEvent } from '../../../Core/AbstractEvent.js';
import { QuotationState } from '../../../Core/QuotationState.js';

export class CreateQuotation extends AbstractEvent {
  constructor(payload) {
    super('CreateQuotation', payload);
  }

  async preExecution(ctx) {
    const { paxGlobal, clienteId } = this.payload;
    if (!paxGlobal || paxGlobal <= 0) this.addError('paxGlobal must be positive');
    if (!clienteId) this.addError('clienteId is required');
    if (clienteId && !ctx.store.findById('CLIENTES', 'ID_Cliente', clienteId)) {
      this.addError(`Client not found: ${clienteId}`);
    }
  }

  async execute(ctx) {
    const newState = new QuotationState(this.payload);
    Object.assign(ctx.state, newState);
    this.addMessage('INFO', `Quotation ${ctx.state.cotizacion.ID_Cotizacion} created`);
  }
}
