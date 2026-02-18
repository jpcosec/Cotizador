import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class OverridePrice extends AbstractEvent {
  constructor(payload) {
    super('OverridePrice', payload);
  }

  async preExecution(ctx) {
    const { lineId, newPrice } = this.payload;
    if (!lineId) this.addError('lineId is required');
    if (lineId && !ctx.state.findLineById(lineId)) this.addError(`Line not found: ${lineId}`);
    if (newPrice == null || newPrice < 0) this.addError('newPrice must be non-negative');
  }

  async execute(ctx) {
    const { lineId, newPrice, motivo } = this.payload;
    const line = ctx.state.findLineById(lineId);
    const ajuste = {
      ID_Linea: lineId,
      Tipo_Ajuste: 'OVERRIDE_PRECIO',
      Valor_Original: line._netoFinal ?? line._netoAjustado ?? line._netoBase,
      Valor_Nuevo: newPrice,
      Motivo: motivo || '',
    };
    ctx.state.ajustesManuales.push(ajuste);
    this.addMessage('INFO', `Price overridden on ${lineId}: ${newPrice}`);
  }
}
