import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class Basket extends UIContainerBase {
  constructor() {
    super();
    this._itemsByDay = new Map();
    this._selectedDayIndex = 0;
  }

  setSelectedDayIndex(index) {
    this._selectedDayIndex = Number(index) || 0;
    return this;
  }

  setItemsForDay(dayIndex, items = []) {
    this._itemsByDay.set(Number(dayIndex), [...items]);
    return this;
  }

  getItemsForDay(dayIndex = this._selectedDayIndex) {
    return [...(this._itemsByDay.get(Number(dayIndex)) ?? [])];
  }

  addItem(item, dayIndex = this._selectedDayIndex) {
    const list = this.getItemsForDay(dayIndex);
    list.push(item);
    this._itemsByDay.set(Number(dayIndex), list);
    this.emit('ITEM_ADDED', { item, dayIndex: Number(dayIndex) });
    return this;
  }

  removeItem(itemId, dayIndex = this._selectedDayIndex) {
    const list = this.getItemsForDay(dayIndex).filter((item) => item.id !== itemId);
    this._itemsByDay.set(Number(dayIndex), list);
    this.emit('ITEM_REMOVED', { itemId, dayIndex: Number(dayIndex) });
    return this;
  }

  toDisplayObject() {
    return {
      selectedDayIndex: this._selectedDayIndex,
      items: this.getItemsForDay(this._selectedDayIndex)
    };
  }
}

export function createBasket() {
  return new Basket();
}
