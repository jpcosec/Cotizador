import { AbstractEvent } from '../../../Core/AbstractEvent.js';
import { resolveDefaults } from '../../../../../src/Pricing/calculations/defaults.js';
import { calculateLinePrice } from '../../../../../src/Pricing/calculations/pricing.js';
import { applyLineAdjustments, applyGlobalAdjustments } from '../../../../../src/Pricing/calculations/rules.js';
import { applyManualAdjustments } from '../../../../../src/Pricing/manual.js';
import { calculateTaxes } from '../../../../../src/Pricing/taxes.js';

export class Recalculate extends AbstractEvent {
  constructor() {
    super('Recalculate');
  }

  async execute(ctx) {
    const { state, store } = ctx;

    // Strip computed, keep input fields
    for (const linea of state.lineas) {
      const keep = {};
      for (const [k, v] of Object.entries(linea)) {
        if (!k.startsWith('_') || k === '_source' || k === '_parentItem' || k === '_tipoPrecio' || k === '_cantidadComp') {
          keep[k] = v;
        }
      }
      Object.keys(linea).forEach(k => delete linea[k]);
      Object.assign(linea, keep);
    }

    // Defaults + pricing
    for (const linea of state.lineas) {
      resolveDefaults(linea, state.paxGlobal, store);
      calculateLinePrice(linea, store);
    }

    // Adjustments
    applyLineAdjustments(state.lineas, store);
    const messages = [];
    applyGlobalAdjustments(state.lineas, messages, store);
    state.messages = messages;

    // Manual adjustments
    applyManualAdjustments(state.lineas, state.ajustesManuales);

    // Taxes
    state.totals = calculateTaxes(state.lineas, store);

    this.addMessage('INFO', `Recalculated ${state.lineas.length} lines`);
  }
}
