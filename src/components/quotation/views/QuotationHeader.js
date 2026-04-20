import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class QuotationHeader extends ViewBase {
  constructor(context = {}) {
    super();
    this._context = {
      clientName: context.clientName ?? '',
      pax: context.pax ?? 0,
      fecha: context.fecha ?? '',
      duracion: context.duracion ?? 1
    };
  }

  setContext(context = {}) {
    this._context = {
      ...this._context,
      ...context
    };
    return this;
  }

  clickUpdateQuantities() {
    this.emit('UPDATE_QUANTITIES_CLICKED', this._context);
    return this;
  }

  clickSave() {
    this.emit('SAVE_CLICKED', this._context);
    return this;
  }

  clickPdf() {
    this.emit('PDF_CLICKED', this._context);
    return this;
  }

  clickDatabase() {
    this.emit('DATABASE_CLICKED', this._context);
    return this;
  }

  toDisplayObject() {
    return {
      ...this._context
    };
  }
}

export function createQuotationHeader(context = {}) {
  return new QuotationHeader(context);
}
