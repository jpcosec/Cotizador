import { AbstractEvent } from '../../../Core/AbstractEvent.js';
import { expandCompositions } from '../../../../src/Pricing/calculations/expand.js';
import { resolveDefaults } from '../../../../src/Pricing/calculations/defaults.js';
import { calculateLinePrice } from '../../../../src/Pricing/calculations/pricing.js';

export class AddItem extends AbstractEvent {
  constructor(payload) {
    super('AddItem', payload);
  }

  async preExecution(ctx) {
    const { itemId } = this.payload;
    if (!itemId) return this.addError('itemId is required');
    const item = ctx.store.findById('ITEM_CATALOGO', 'ID_Item', itemId);
    if (!item) this.addError(`Item not found: ${itemId}`);
    if (item && !item.Activo) this.addError(`Item is inactive: ${itemId}`);
  }

  async execute(ctx) {
    const { itemId, overrides = {} } = this.payload;
    const { state, store } = ctx;

    const baseLine = {
      ID_Linea: state.nextLineId(),
      ID_Cotizacion: state.cotizacion.ID_Cotizacion,
      ID_Item: itemId,
      Override_Pax: overrides.Override_Pax ?? null,
      Override_Cantidad: overrides.Override_Cantidad ?? null,
      Override_Duracion_Min: overrides.Override_Duracion_Min ?? null,
    };

    const expanded = expandCompositions([baseLine], store);

    for (const line of expanded) {
      if (line.ID_Linea === baseLine.ID_Linea && expanded.length > 1) {
        // Parent was expanded — children get new IDs
      }
      if (line !== baseLine) {
        line.ID_Linea = state.nextLineId();
      }
      resolveDefaults(line, state.paxGlobal, store);
      calculateLinePrice(line, store);
      state.addLine(line);
    }

    this._recalcSubtotal(state);
    this.addMessage('INFO', `Added ${expanded.length} line(s) for ${itemId}`);
  }

  _recalcSubtotal(state) {
    state.totals.subtotal = state.lineas.reduce((sum, l) => sum + (l._netoBase || 0), 0);
  }
}
