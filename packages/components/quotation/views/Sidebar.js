import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class Sidebar extends UIContainerBase {
  constructor(items = []) {
    super();
    this._items = [...items];
    this._searchTerm = '';
  }

  setItems(items = []) {
    this._items = [...items];
    return this;
  }

  search(term = '') {
    this._searchTerm = String(term).toLowerCase().trim();
    return this;
  }

  clearSearch() {
    this._searchTerm = '';
    return this;
  }

  getFilteredItems() {
    if (!this._searchTerm) {
      return [...this._items];
    }

    return this._items.filter((item) => {
      const name = String(item?.name ?? item?.nombre ?? '').toLowerCase();
      const category = String(item?.category ?? item?.categoria ?? '').toLowerCase();
      return name.includes(this._searchTerm) || category.includes(this._searchTerm);
    });
  }

  selectItem(itemId) {
    const selected = this._items.find((item) => item.id === itemId);
    if (selected) {
      this.emit('ITEM_SELECTED', selected);
    }
    return this;
  }

  toDisplayObject() {
    return {
      searchTerm: this._searchTerm,
      filteredItems: this.getFilteredItems()
    };
  }
}

export function createSidebar(items = []) {
  return new Sidebar(items);
}
