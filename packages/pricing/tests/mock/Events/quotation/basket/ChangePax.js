import { AbstractEvent } from '../../../Core/AbstractEvent.js';
import { Recalculate } from './Recalculate.js';

export class ChangePax extends AbstractEvent {
  constructor(payload) {
    super('ChangePax', payload);
  }

  async preExecution() {
    if (!this.payload.paxGlobal || this.payload.paxGlobal <= 0) {
      this.addError('paxGlobal must be positive');
    }
  }

  async execute(ctx) {
    ctx.state.paxGlobal = this.payload.paxGlobal;
    ctx.state.cotizacion.Pax_Global = this.payload.paxGlobal;

    // Delegate full recalculation
    const recalc = new Recalculate();
    await recalc.execute(ctx);

    this.messages.push(...recalc.messages);
    this.addMessage('INFO', `Pax changed to ${this.payload.paxGlobal}`);
  }
}
