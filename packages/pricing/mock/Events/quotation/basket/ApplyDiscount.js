import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class ApplyDiscount extends AbstractEvent {
  constructor(payload) {
    super('ApplyDiscount', payload);
  }

  async preExecution(ctx) {
    const { lineId, amount, tipo } = this.payload;
    const validTipos = ['DESCUENTO_LINEA', 'DESCUENTO_GLOBAL'];
    if (!validTipos.includes(tipo)) this.addError(`Invalid tipo: ${tipo}`);
    if (tipo === 'DESCUENTO_LINEA' && !lineId) this.addError('lineId required for line discount');
    if (tipo === 'DESCUENTO_LINEA' && lineId && !ctx.state.findLineById(lineId)) {
      this.addError(`Line not found: ${lineId}`);
    }
    if (amount == null || amount <= 0) this.addError('amount must be positive');
  }

  async execute(ctx) {
    const { lineId, amount, tipo, motivo } = this.payload;
    const ajuste = {
      ID_Linea: lineId || null,
      Tipo_Ajuste: tipo,
      Valor_Nuevo: amount,
      Motivo: motivo || '',
    };
    ctx.state.ajustesManuales.push(ajuste);
    this.addMessage('INFO', `Discount applied: ${tipo} ${amount}`);
  }
}
