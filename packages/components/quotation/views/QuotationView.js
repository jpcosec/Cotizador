import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class QuotationView extends UIContainerBase {
  constructor() {
    super();
    this._selectedDayIndex = 0;
    this._sidebar = null;
    this._basket = null;
    this._header = null;
    this._totals = null;
  }

  setSidebar(sidebar) {
    this._sidebar = sidebar;
    return this;
  }

  setBasket(basket) {
    this._basket = basket;
    return this;
  }

  setHeader(header) {
    this._header = header;
    return this;
  }

  setTotals(totals) {
    this._totals = totals;
    return this;
  }

  selectDay(index) {
    this._selectedDayIndex = Number(index) || 0;
    this.emit('DAY_SELECTED', { dayIndex: this._selectedDayIndex });
    return this;
  }

  addItem(item) {
    this.emit('ITEM_ADDED', { item, dayIndex: this._selectedDayIndex });
    return this;
  }

  toDisplayObject() {
    return {
      selectedDayIndex: this._selectedDayIndex,
      hasSidebar: this._sidebar !== null,
      hasBasket: this._basket !== null,
      hasHeader: this._header !== null,
      hasTotals: this._totals !== null
    };
  }
}

export function createQuotationView() {
  return new QuotationView();
}
