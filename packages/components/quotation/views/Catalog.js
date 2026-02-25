import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class Catalog extends UIContainerBase {
  constructor(categories = []) {
    super();
    this._categories = [...categories];
  }

  setCategories(categories = []) {
    this._categories = [...categories];
    return this;
  }

  getCategories() {
    return [...this._categories];
  }

  filterBySearch(term = '') {
    const searchTerm = String(term).toLowerCase().trim();
    if (!searchTerm) {
      return this.getCategories();
    }

    return this._categories
      .map((category) => ({
        ...category,
        items: (category.items ?? []).filter((item) =>
          String(item?.name ?? item?.nombre ?? '').toLowerCase().includes(searchTerm)
        )
      }))
      .filter((category) => category.items.length > 0);
  }

  selectItem(item) {
    this.emit('ITEM_SELECTED', item);
    this.emit('ITEM_CLICKED', item);
    return this;
  }

  toDisplayObject() {
    return {
      categories: this.getCategories()
    };
  }
}

export function createCatalog(categories = []) {
  return new Catalog(categories);
}
