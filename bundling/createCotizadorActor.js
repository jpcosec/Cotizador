import { createActor } from '../../claps_codelab_xstate/node_modules/xstate/dist/xstate.cjs.mjs';
import { createQuotationXStateMachine } from '../../claps_codelab_xstate/src/Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from '../../claps_codelab_xstate/src/Orchestration/adapters/index.js';
import { createSeededStore } from '../../claps_codelab_xstate/tests/helpers/store_factory.js';

export function createCotizadorActor(opts = {}) {
  const machine = createQuotationXStateMachine(quotationAdapters);
  const actor = createActor(machine);

  const snap = actor.getSnapshot();
  snap.context.store = opts.store || createSeededStore();

  actor.start();

  const bootstrap = opts.bootstrap !== false;
  if (bootstrap) {
    actor.send({ type: 'START_NEW_QUOTATION' });
    actor.send({ type: 'CREATE_NEW' });
    actor.send({
      type: 'QUOTATION_INITIALIZED',
      clienteId: opts.clienteId || 'CLI_CORP',
      paxGlobal: Number.isFinite(opts.paxGlobal) ? opts.paxGlobal : 10,
      fechaEvento: opts.fechaEvento || new Date().toISOString().split('T')[0],
      duracionDias: Number.isFinite(opts.duracionDias) ? opts.duracionDias : 1,
      cotizacionId: opts.cotizacionId || `COT_BUNDLE_${Date.now()}`,
    });
  }

  return actor;
}
