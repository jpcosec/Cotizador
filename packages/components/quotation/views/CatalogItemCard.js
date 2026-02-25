import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class CatalogItemCard extends ViewBase {
  constructor(item = {}) {
    super();
    this._item = item;
  }

  click() {
    this.emit('ITEM_CLICKED', this._item);
    return this;
  }

  toDisplayObject() {
    return {
      item: this._item
    };
  }
}

export function createCatalogItemCard(item) {
  return new CatalogItemCard(item);
}
