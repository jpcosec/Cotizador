import { createActor } from '../../../xstate/src/runtime/createActor.js';
import { createQuotationXStateMachine } from '../../../xstate/src/Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from '../../../xstate/src/Orchestration/adapters/index.js';
import { createSeededStore } from '../../../xstate/tests/helpers/store_factory.js';

export function createCotizadorActor(opts = {}) {
  const machine = createQuotationXStateMachine(quotationAdapters);
  const actor = createActor(machine);

  const snap = actor.getSnapshot();
  const store = opts.store || createSeededStore();
  snap.context.store = store;

  actor.start();

  const bootstrap = opts.bootstrap === true;
  if (bootstrap) {
    const clienteId = opts.clienteId || 'CLI_CORP';
    const paxGlobal = Number.isFinite(opts.paxGlobal) ? opts.paxGlobal : 10;
    const fechaEvento = opts.fechaEvento || new Date().toISOString().split('T')[0];
    const duracionDias = Number.isFinite(opts.duracionDias) ? opts.duracionDias : 1;
    const cotizacionId = opts.cotizacionId || `COT_LOCAL_${Date.now()}`;

    actor.send({ type: 'START_NEW_QUOTATION' });
    actor.send({ type: 'CREATE_NEW' });
    actor.send({
      type: 'QUOTATION_INITIALIZED',
      clienteId,
      paxGlobal,
      fechaEvento,
      duracionDias,
      cotizacionId,
    });
  }

  // Export local data for GAS shim to consume
  const catalogItems = (store.tables?.ITEM_CATALOGO || []).map(item => ({
    itemId:    item.ID_Item,
    nombre:    item.Nombre || item.ID_Item,
    categoria: item.ID_Categoria || 'Varios',
    precio:    item.Precio_Base || 0,
    detalle:   item.Default_Glosa || '',
    Default_Glosa: item.Default_Glosa || '',
  }));
  const clientes = store.tables?.CLIENTES || [];
  const pricingReferenceData = {
    PERFILES_PRECIO: store.tables?.PERFILES_PRECIO || [],
    CATEGORIAS: store.tables?.CATEGORIAS || [],
    ITEM_CATALOGO: store.tables?.ITEM_CATALOGO || [],
    COMPOSICION_KIT: store.tables?.COMPOSICION_KIT || [],
    REGLAS_NEGOCIO: store.tables?.REGLAS_NEGOCIO || [],
  };

  if (typeof window !== 'undefined') {
    window.createCotizadorActor = () => actor;
    window.localCatalogItems = catalogItems;
    window.localClientes = clientes;
    window.localPricingReferenceData = pricingReferenceData;
  }

  return actor;
}
