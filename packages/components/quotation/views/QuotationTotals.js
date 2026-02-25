import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class QuotationTotals extends ViewBase {
  constructor(subtotal = 0, ivaRate = 0.19) {
    super();
    this._subtotal = subtotal;
    this._ivaRate = ivaRate;
  }

  setSubtotal(value) {
    this._subtotal = Number(value) || 0;
    return this;
  }

  setIvaRate(rate) {
    this._ivaRate = Number(rate) || 0;
    return this;
  }

  getIva() {
    return Math.round(this._subtotal * this._ivaRate);
  }

  getTotal() {
    return this._subtotal + this.getIva();
  }

  toDisplayObject() {
    return {
      subtotal: this._subtotal,
      iva: this.getIva(),
      total: this.getTotal()
    };
  }
}

export function createQuotationTotals(subtotal = 0, ivaRate = 0.19) {
  return new QuotationTotals(subtotal, ivaRate);
}
