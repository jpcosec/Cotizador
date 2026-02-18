import { AbstractEvent } from '../../../Core/AbstractEvent.js';

export class LoadCatalog extends AbstractEvent {
  constructor(payload = {}) {
    super('LoadCatalog', payload);
  }

  async preExecution(ctx) {
    const tables = ['CLIENTES', 'CATEGORIAS', 'ITEM_CATALOGO', 'PERFILES_PRECIO', 'COMPOSICION_KIT', 'REGLAS_NEGOCIO'];
    for (const t of tables) {
      if (!ctx.store.all(t).length) {
        this.addError(`Table ${t} is empty or missing`);
      }
    }
  }

  async execute() {
    this.addMessage('INFO', 'Catalog loaded');
  }
}
