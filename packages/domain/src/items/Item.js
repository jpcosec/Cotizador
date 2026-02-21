import { ItemBase } from '../base/ItemBase.js';

/**
 * Item — concrete leaf node representing a single catalog entry or basket line.
 *
 * Catalog state:  ID_Linea = null (pristine, never mutated)
 * Basket state:   ID_Linea set via instantiate(lineId)
 *
 * The default pricing formula:
 *   price = Costo_Base
 *         + pax      * Costo_Unitario_Pax
 *         + duracion * Costo_Unitario_Tiempo
 *         + cantidad * Costo_Unitario_Item
 *
 * An external pricingFn may be injected to override the formula.
 */
export class Item extends ItemBase {
  /**
   * @param {Object} row - Raw ITEM_CATALOGO DB row
   * @param {Object} opts
   * @param {Object|null} opts.profile     - Resolved profile object
   * @param {Array}       opts.rules       - Array of rule objects
   * @param {Function|null} opts.evaluator - Rule evaluator fn(rule, ctx) => result|null
   * @param {Function|null} opts.pricingFn - External pricing fn(profile, pax, cantidad, duracion) => number
   */
  constructor(row, { profile = null, rules = [], evaluator = null, pricingFn = null } = {}) {
    super();

    // ── DB row fields ──────────────────────────────────────────────
    this.ID_Item    = row.ID_Item    ?? null;
    this.Nombre     = row.Nombre     ?? null;
    this.ID_Categoria = row.ID_Categoria ?? null;
    this.Activo     = row.Activo     !== undefined ? Boolean(row.Activo) : true;

    // Pricing coefficients
    this.Costo_Base            = row.Costo_Base            || 0;
    this.Costo_Unitario_Pax    = row.Costo_Unitario_Pax    || 0;
    this.Costo_Unitario_Tiempo = row.Costo_Unitario_Tiempo || 0;
    this.Costo_Unitario_Item   = row.Costo_Unitario_Item   || 0;

    // Default quantities (read by Prizable.resolveQuantities)
    this._defaultPax      = row.Pax_Default            ?? null;
    this._defaultCantidad = row.Cantidad_Default        ?? null;
    this._defaultDuracion = row.Duracion_Min_Default    ?? null;

    // Kit flag
    this.isKit = Boolean(row.Es_Kit);

    // ── Injected dependencies ──────────────────────────────────────
    this._profile   = profile;
    this._rules     = rules;
    this._evaluator = evaluator;
    this._pricingFn = pricingFn ?? this._defaultPricingFn.bind(this);
  }

  /**
   * Built-in pricing formula. Used when no external pricingFn is injected.
   *
   * Priority: profile coefficients (from PERFILES_PRECIO) when available,
   * falling back to direct coefficients on the row (used in unit tests).
   *
   * @param {Object|null} profile
   * @param {number|null} pax
   * @param {number|null} cantidad
   * @param {number|null} duracion
   * @returns {number}
   */
  _defaultPricingFn(profile, pax, cantidad, duracion) {
    const hasDirectCoefficients = this.Costo_Base || this.Costo_Unitario_Pax
      || this.Costo_Unitario_Tiempo || this.Costo_Unitario_Item;

    if (!hasDirectCoefficients && profile) {
      return (profile.Costo_Base_Fijo          || 0)
        + (pax      || 0) * (profile.Costo_Unitario_Pax     || 0)
        + (duracion || 0) * (profile.Costo_Unitario_Tiempo  || 0)
        + (cantidad || 0) * (profile.Costo_Unitario_Item    || 0);
    }

    return this.Costo_Base
      + (pax      || 0) * this.Costo_Unitario_Pax
      + (duracion || 0) * this.Costo_Unitario_Tiempo
      + (cantidad || 0) * this.Costo_Unitario_Item;
  }
}
