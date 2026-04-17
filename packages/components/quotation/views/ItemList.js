import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

function parseOverrideValue(value) {
  if (value === '') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

/**
 * Controller for the Item List (Basket details).
 */
export class ItemListController extends UIContainerBase {
  constructor(runtime) {
    super();
    this.runtime = runtime;
  }

  setBasketOverride(entryId, key, value) {
    if (value === '') {
      this.runtime.clearEntryOverride(entryId, key);
      return;
    }
    this.runtime.setEntryOverride(entryId, key, parseOverrideValue(value));
  }

  clearBasketOverride(entryId, key) {
    this.runtime.clearEntryOverride(entryId, key);
  }

  resetBasketOverrides(entryId) {
    this.runtime.resetEntryOverrides(entryId);
  }

  destroyRuntimeEntry(column, entryId) {
    if (column !== 'basket') return;
    this.runtime.removeEntry(entryId);
  }

  duplicateBasketEntry(entryId) {
    this.runtime.duplicateEntryInDay(entryId);
  }

  copyBasketEntry(entryId) {
    const snapshot = this.runtime.getSnapshot();
    const target = Number(snapshot.basket?.selectedDayIndex || 0) + 2; // Next day
    this.runtime.copyEntryToDay(entryId, target);
  }

  toDisplayObject() {
    const snapshot = this.runtime.getSnapshot();
    return {
      basket: snapshot.basket,
      setBasketOverride: (id, k, v) => this.setBasketOverride(id, k, v),
      clearBasketOverride: (id, k) => this.clearBasketOverride(id, k),
      resetBasketOverrides: (id) => this.resetBasketOverrides(id),
      destroyRuntimeEntry: (c, id) => this.destroyRuntimeEntry(c, id),
      duplicateBasketEntry: (id) => this.duplicateBasketEntry(id),
      copyBasketEntry: (id) => this.copyBasketEntry(id),
    };
  }
}

export function createItemList(runtime) {
  return new ItemListController(runtime);
}
