import { AbstractEvent } from '../../Core/AbstractEvent.js';

export class AdvanceStep extends AbstractEvent {
  constructor(payload = {}) {
    super('AdvanceStep', payload);
  }

  async execute(ctx) {
    const bus = this.payload._bus;
    if (!bus) return this.addError('AdvanceStep requires _bus reference');

    const result = bus.scenario.advance(this.payload.target);
    if (!result.ok) {
      this.addError(result.error);
    } else {
      this.addMessage('INFO', `Advanced to step: ${result.step.name}`);
    }
  }
}
