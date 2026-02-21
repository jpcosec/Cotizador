import { ContainerBase } from '../base/ContainerBase.js';

/**
 * DayCategory — groups basket Items for a single event day.
 *
 * Extends ContainerBase (Rulable + Aggregable + XStateable + Alpineable).
 *
 * Created lazily by Basket.add() when an item arrives on a day that has no
 * existing DayCategory. Items are already instantiated (have ID_Linea) when
 * added here.
 *
 * Rule inheritance flow: Basket → DayCategory → Item
 * Price aggregation flow: Item → DayCategory → Basket
 */
export class DayCategory extends ContainerBase {
  constructor(dia, { evaluator = null } = {}) {
    super();
    this.dia = dia;
    this._evaluator = evaluator;
  }

  get id() {
    return this.dia;
  }

  get name() {
    return `Día ${this.dia}`;
  }

  /**
   * Plain object for Alpine.js consumption.
   *
   * Overrides ContainerBase.toDisplayObject() to return the basket-day shape:
   * dia + items array + daily totals from aggregate().
   *
   * @returns {{ dia: number, items: Object[], totals: { subtotal, breakdown } }}
   */
  toDisplayObject() {
    const items = [];
    for (const child of this._children.values()) {
      if (typeof child.toDisplayObject === 'function') {
        items.push(child.toDisplayObject());
      }
    }
    return {
      dia: this.dia,
      items,
      totals: this.aggregate(),
    };
  }
}
