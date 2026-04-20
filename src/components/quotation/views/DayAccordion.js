import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class DayAccordion extends ViewBase {
  constructor(dayIndex = 0, items = []) {
    super();
    this._dayIndex = dayIndex;
    this._items = [...items];
  }

  setItems(items = []) {
    this._items = [...items];
    return this;
  }

  getItemCount() {
    return this._items.length;
  }

  getTotal() {
    return this._items.reduce((sum, item) => sum + Number(item?.total ?? 0), 0);
  }

  toDisplayObject() {
    return {
      dayIndex: this._dayIndex,
      itemCount: this.getItemCount(),
      total: this.getTotal(),
      items: [...this._items]
    };
  }
}

export function createDayAccordion(dayIndex = 0, items = []) {
  return new DayAccordion(dayIndex, items);
}
