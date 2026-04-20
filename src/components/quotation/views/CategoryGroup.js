import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class CategoryGroup extends ViewBase {
  constructor(category = { id: null, name: '', items: [] }) {
    super();
    this._category = category;
    this._isExpanded = true;
  }

  toggle() {
    this._isExpanded = !this._isExpanded;
    this.emit('CATEGORY_TOGGLED', {
      categoryId: this._category.id,
      isExpanded: this._isExpanded
    });
    return this;
  }

  expand() {
    this._isExpanded = true;
    return this;
  }

  collapse() {
    this._isExpanded = false;
    return this;
  }

  clickItem(item) {
    this.emit('ITEM_SELECTED', item);
    return this;
  }

  toDisplayObject() {
    return {
      category: this._category,
      isExpanded: this._isExpanded
    };
  }
}

export function createCategoryGroup(category) {
  return new CategoryGroup(category);
}
