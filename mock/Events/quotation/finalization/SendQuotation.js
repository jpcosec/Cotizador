import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class SendQuotation extends AbstractEvent {
  constructor() {
    super('SendQuotation');
  }

  async preExecution(ctx) {
    if (ctx.state.cotizacion.Estado === 'Borrador') {
      this.addError('Quotation must be saved before sending');
    }
  }

  async execute(ctx) {
    ctx.state.cotizacion.Estado = 'Enviada';
    this.addMessage('INFO', `Quotation ${ctx.state.cotizacion.ID_Cotizacion} sent`);
  }
}
