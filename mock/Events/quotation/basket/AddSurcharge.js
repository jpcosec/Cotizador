import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class AddSurcharge extends AbstractEvent {
  constructor(payload) {
    super('AddSurcharge', payload);
  }

  async preExecution() {
    if (this.payload.amount == null || this.payload.amount <= 0) {
      this.addError('amount must be positive');
    }
  }

  async execute(ctx) {
    const { amount, motivo } = this.payload;
    ctx.state.ajustesManuales.push({
      ID_Linea: null,
      Tipo_Ajuste: 'RECARGO',
      Valor_Nuevo: amount,
      Motivo: motivo || '',
    });
    this.addMessage('INFO', `Surcharge added: ${amount}`);
  }
}
