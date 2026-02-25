import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class ItemAccordion extends ViewBase {
  constructor(item = {}) {
    super();
    this._item = { ...item };
    this._isExpanded = false;
  }

  toggle() {
    this._isExpanded = !this._isExpanded;
    return this;
  }

  setQuantity(field, value) {
    this._item[field] = value;
    this.emit('ITEM_UPDATED', { item: this._item, field, value });
    return this;
  }

  setComment(comment) {
    this._item.comentarios = comment;
    this.emit('ITEM_UPDATED', { item: this._item, field: 'comentarios', value: comment });
    return this;
  }

  delete() {
    this.emit('ITEM_DELETED', { itemId: this._item.id });
    return this;
  }

  toDisplayObject() {
    return {
      isExpanded: this._isExpanded,
      item: { ...this._item }
    };
  }
}

export function createItemAccordion(item = {}) {
  return new ItemAccordion(item);
}
