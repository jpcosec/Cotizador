import { AbstractEvent } from '../../../Core/AbstractEvent.js';
import { resolveDefaults } from '../../../../src/Pricing/calculations/defaults.js';
import { calculateLinePrice } from '../../../../src/Pricing/calculations/pricing.js';

export class UpdateItem extends AbstractEvent {
  constructor(payload) {
    super('UpdateItem', payload);
  }

  async preExecution(ctx) {
    const { lineId } = this.payload;
    if (!lineId) return this.addError('lineId is required');
    if (!ctx.state.findLineById(lineId)) this.addError(`Line not found: ${lineId}`);
  }

  async execute(ctx) {
    const { lineId, overrides = {} } = this.payload;
    const line = ctx.state.findLineById(lineId);

    if (overrides.Override_Pax !== undefined) line.Override_Pax = overrides.Override_Pax;
    if (overrides.Override_Cantidad !== undefined) line.Override_Cantidad = overrides.Override_Cantidad;
    if (overrides.Override_Duracion_Min !== undefined) line.Override_Duracion_Min = overrides.Override_Duracion_Min;

    resolveDefaults(line, ctx.state.paxGlobal, ctx.store);
    calculateLinePrice(line, ctx.store);
    this.addMessage('INFO', `Updated line ${lineId}`);
  }
}
