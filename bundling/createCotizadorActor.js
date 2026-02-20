import { createActor } from '../packages/xstate/src/runtime/createActor.js';
import { createQuotationXStateMachine } from '../packages/xstate/src/Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from '../packages/xstate/src/Orchestration/adapters/index.js';
import { createSeededStore } from '../packages/xstate/tests/helpers/store_factory.js';

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

  // Populate window.local* so Local_GAS_Shim can serve them on localhost
  if (typeof window !== 'undefined') {
    const store = actor.getSnapshot().context.store;
    const all = (t) => store?.all ? store.all(t) : [];
    window.localClientes = all('CLIENTES');
    window.localCatalogItems = all('ITEM_CATALOGO').map(item => ({
      itemId: item.ID_Item,
      nombre: item.Nombre || item.ID_Item,
      categoria: item.ID_Categoria || 'Varios',
      precio: item.Precio_Base || 0,
      detalle: item.Default_Glosa || '',
      Default_Glosa: item.Default_Glosa || '',
    }));
    window.localPricingReferenceData = {
      PERFILES_PRECIO: all('PERFILES_PRECIO'),
      CATEGORIAS: all('CATEGORIAS'),
      ITEM_CATALOGO: all('ITEM_CATALOGO'),
      COMPOSICION_KIT: all('COMPOSICION_KIT'),
      REGLAS_NEGOCIO: all('REGLAS_NEGOCIO'),
    };
  }

  return actor;
}
