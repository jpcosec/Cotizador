import { EventBus } from '../mock/Core/EventBus.js';
import { QuotationState, resetLineSeq } from '../mock/Core/QuotationState.js';
import { QuotationScenario } from '../mock/Scenarios/Quotation.js';
import { createSeededStore } from './store_factory.js';

export function createEventBus(opts = {}) {
  resetLineSeq();
  const store = opts.store || createSeededStore();
  const scenario = new QuotationScenario();
  const state = new QuotationState({
    paxGlobal: opts.paxGlobal || 25,
    fechaEvento: opts.fechaEvento || '2025-06-15',
    duracionDias: opts.duracionDias || 1,
    clienteId: opts.clienteId || 'CLI_CORP',
    cotizacionId: opts.cotizacionId || 'COT_TEST',
  });
  return new EventBus(scenario, state, store);
}
