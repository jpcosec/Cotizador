import { ContainerBase } from '../base/ContainerBase.js';

/**
 * Category — groups Items by category inside a Catalog.
 *
 * Extends ContainerBase (Rulable + Aggregable + XStateable + Alpineable).
 *
 * Catalog context only: no price aggregation subtotal is shown to the user
 * here — items display preview prices, but the category itself has no
 * meaningful "total" until items land in the Basket.
 *
 * Row shape (CATEGORIAS table):
 *   { ID_Categoria, Nombre_Categoria, Activo }
 */
export class Category extends ContainerBase {
  constructor(row, { evaluator = null } = {}) {
    super();
    this.ID_Categoria = row.ID_Categoria;
    this.Nombre = row.Nombre ?? row.Nombre_Categoria;
    this.Activo = row.Activo ?? true;
    this._evaluator = evaluator;
  }

  get id() {
    return this.ID_Categoria;
  }

  get name() {
    return this.Nombre;
  }

  /**
   * Plain object for Alpine.js consumption.
   *
   * Overrides ContainerBase.toDisplayObject() to return the catalog-specific
   * shape: items array + count instead of { children, totals }.
   *
   * @returns {{ id, nombre, activo, items: Object[], count: number }}
   */
  toDisplayObject() {
    const items = [];
    for (const child of this._children.values()) {
      if (typeof child.toDisplayObject === 'function') {
        items.push(child.toDisplayObject());
      }
    }
    return {
      id: this.ID_Categoria,
      nombre: this.Nombre,
      activo: this.Activo,
      items,
      count: this.childCount,
    };
  }
}
