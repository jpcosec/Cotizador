import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class SaveQuotation extends AbstractEvent {
  constructor() {
    super('SaveQuotation');
  }

  async preExecution(ctx) {
    if (!ctx.state.lineas.length) this.addError('Cannot save empty quotation');
  }

  async execute(ctx) {
    const { state, store } = ctx;
    const snapshot = {
      cotizacion: { ...state.cotizacion },
      lineas: state.lineas.map(l => ({ ...l })),
      totals: { ...state.totals },
      ajustesManuales: [...state.ajustesManuales],
    };

    store.insert('CACHE_COTIZACION', {
      ID_Cotizacion: state.cotizacion.ID_Cotizacion,
      Snapshot_JSON: JSON.stringify(snapshot),
      Updated_At: new Date().toISOString(),
    });

    state.cotizacion.Estado = 'Enviada';
    this.addMessage('INFO', `Quotation ${state.cotizacion.ID_Cotizacion} saved`);
  }
}
