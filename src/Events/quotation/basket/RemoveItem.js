import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class RemoveItem extends AbstractEvent {
  constructor(payload) {
    super('RemoveItem', payload);
  }

  async preExecution(ctx) {
    const { lineId } = this.payload;
    if (!lineId) return this.addError('lineId is required');
    if (!ctx.state.findLineById(lineId)) this.addError(`Line not found: ${lineId}`);
  }

  async execute(ctx) {
    const { lineId } = this.payload;
    const line = ctx.state.findLineById(lineId);

    // If removing a parent, also remove children
    if (!line._source) {
      ctx.state.removeLinesByParent(line.ID_Item);
    }
    ctx.state.removeLine(lineId);
    this.addMessage('INFO', `Removed line ${lineId}`);
  }
}
