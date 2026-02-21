import { ContainerBase } from '../base/ContainerBase.js';

/**
 * Kit — a named group of items used in both Catalog and Basket contexts.
 *
 * Extends ContainerBase (Rulable + Aggregable + XStateable + Alpineable).
 *
 * Mode determines behavior:
 *   'catalog' — items grouped for preview; aggregate() returns null (no real totals).
 *   'basket'  — items are independent line items; aggregate() returns real totals.
 *
 * Row shape (ITEM_CATALOGO table, kit rows):
 *   { ID_Item, Nombre, Activo }
 */
export class Kit extends ContainerBase {
  constructor(row, { mode = 'catalog', evaluator = null } = {}) {
    super();
    this.ID_Kit = row.ID_Item;
    this.Nombre = row.Nombre;
    this.Activo = row.Activo ?? true;
    this._mode = mode;
    this._evaluator = evaluator;
  }

  get id() {
    return this.ID_Kit;
  }

  get name() {
    return this.Nombre;
  }

  get isCatalogMode() {
    return this._mode === 'catalog';
  }

  get isBasketMode() {
    return this._mode === 'basket';
  }

  /** Changes mode to 'basket'. Returns this for chaining. */
  switchToBasketMode() {
    this._mode = 'basket';
    return this;
  }

  /**
   * Returns null in catalog mode (no meaningful totals).
   * Delegates to Aggregable in basket mode.
   *
   * @returns {null | { subtotal: number, breakdown: Array }}
   */
  aggregate() {
    if (this._mode === 'catalog') return null;
    return super.aggregate();
  }

  /**
   * Plain object for Alpine.js consumption.
   *
   * @returns {{ id, nombre, activo, mode, items: Object[], totals: null | { subtotal, breakdown } }}
   */
  toDisplayObject() {
    const items = [];
    for (const child of this._children.values()) {
      if (typeof child.toDisplayObject === 'function') {
        items.push(child.toDisplayObject());
      }
    }
    return {
      id: this.ID_Kit,
      nombre: this.Nombre,
      activo: this.Activo,
      mode: this._mode,
      items,
      totals: this.aggregate(),
    };
  }
}
