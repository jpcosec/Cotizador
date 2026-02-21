import { Prizable } from '../mixins/Prizable.js';
import { Rulable } from '../mixins/Rulable.js';
import { XStateable } from '../mixins/XStateable.js';
import { Alpineable } from '../mixins/Alpineable.js';

/**
 * ItemBase — abstract base for Item (leaf nodes in the domain tree).
 *
 * Mixins composed: Prizable + Rulable + XStateable + Alpineable
 *
 * Items:
 * - Calculate their own price via calculate()
 * - Receive context from parent container (via receiveContext from Rulable)
 * - Can be in catalog state (ID_Linea = null) or basket state (ID_Linea set)
 * - Never hold a store reference — all data injected at construction
 *
 * Mixin order matters: Prizable → Rulable → XStateable → Alpineable
 * This ensures proper method resolution and interface satisfaction.
 */
const ItemMixin = (Base) => Prizable(Rulable(XStateable(Alpineable(Base))));

export class ItemBase extends ItemMixin(class {}) {
  // ── Core identity ───────────────────────────────────────────────
  ID_Item = null;
  Nombre = null;
  ID_Categoria = null;
  Activo = true;
  _available = true;   // rule-computed availability (separate from Activo)

  // ── Basket state ────────────────────────────────────────────────
  ID_Linea = null;     // null = catalog state
  Dia = null;
  Hora = null;
  Comentarios = null;

  // ── Kit support ─────────────────────────────────────────────────
  isKit = false;
  children = [];

  // ── Rule results ────────────────────────────────────────────────
  _userAjustes = [];   // manual user adjustments
  _evaluator = null;   // injected evaluator

  // ── Lifecycle ───────────────────────────────────────────────────

  /**
   * Full calculation: resolveQuantities → calculatePrice → evaluateRules.
   * Called after receiveContext() has set _inheritedContext.
   *
   * Flow:
   * 1. Resolve quantities from inherited context and defaults
   * 2. Calculate price based on resolved quantities and profile
   * 3. Evaluate rules if evaluator is set
   * 4. Mark item as unavailable if any rule has blocking=true
   *
   * @returns {this} for chaining
   */
  calculate() {
    this.resolveQuantities(this._inheritedContext);
    this.calculatePrice();
    if (this._evaluator) {
      this.evaluateRules(this._evaluator);
      // Check for RESTRICCION_UI errors → update _available
      this._available = !this._appliedRules.some(r => r.blocking === true);
    }
    return this;
  }

  /**
   * Creates a basket-state copy of this catalog item.
   * Never mutates the original (catalog item stays pristine).
   *
   * The new instance:
   * - Shares prototype chain with original (preserves methods)
   * - Copies all own properties
   * - Resets computed state (_price, _appliedRules, _userAjustes)
   * - Sets basket identity (ID_Linea, Dia, Hora, Comentarios)
   * - Resets user-set flags (paxIsUserSet, etc.)
   *
   * @param {string|number} lineId - The new line ID for this basket instance
   * @returns {ItemBase} new basket-state copy
   */
  instantiate(lineId) {
    const instance = Object.create(Object.getPrototypeOf(this));
    // Copy all own properties
    Object.assign(instance, this);
    // Reset computed state
    instance._price = null;
    instance._appliedRules = [];
    instance._userAjustes = [];
    // Set basket identity
    instance.ID_Linea = lineId;
    instance.Dia = 1;
    instance.Hora = '09:00';
    instance.Comentarios = '';
    // Reset user-set flags (will be set by overrides)
    instance.paxIsUserSet = false;
    instance.cantidadIsUserSet = false;
    instance.duracionIsUserSet = false;
    return instance;
  }

  /**
   * Updates one or more quantities. Sets isUserSet = true for each quantity
   * provided when isUserOverride = true. Then recalculates.
   *
   * Use this when:
   * - User explicitly changes pax/cantidad/duracion in the UI
   * - Parent container wants to override item defaults (with isUserOverride=false)
   *
   * @param {object} quantities - e.g. { pax: 25, duracion: 120 }
   * @param {boolean} isUserOverride - if true, marks quantity as user-set
   *                                    (prevents future container override)
   * @returns {this} for chaining
   */
  updateQuantities(quantities = {}, isUserOverride = false) {
    if (quantities.pax !== undefined) {
      this.pax = quantities.pax;
      if (isUserOverride) this.paxIsUserSet = true;
    }
    if (quantities.cantidad !== undefined) {
      this.cantidad = quantities.cantidad;
      if (isUserOverride) this.cantidadIsUserSet = true;
    }
    if (quantities.duracion !== undefined) {
      this.duracion = quantities.duracion;
      if (isUserOverride) this.duracionIsUserSet = true;
    }
    this.calculate();
    return this;
  }

  // ── Getters ─────────────────────────────────────────────────────

  get id() {
    return this.ID_Item;
  }

  get name() {
    return this.Nombre;
  }

  /**
   * Returns true if this item is in basket state (has a truthy line ID).
   * Checks for !== null to allow 0 and other falsy values to return false.
   *
   * @returns {boolean}
   */
  get inBasket() {
    return this.ID_Linea != null; // null | undefined → false, anything else → true
  }

  /**
   * Returns human-readable descriptions of all applied rules.
   *
   * @returns {Array<string>} Rule descriptions or IDs
   */
  get humanizedRules() {
    return this._appliedRules.map(r => r.description || r.ruleId || String(r));
  }

  // ── Serialization ───────────────────────────────────────────────

  /**
   * Serializes to a plain object for Alpine.js store assignment.
   * Called by container's toDisplayObject() → AlpineXStateBridge.
   *
   * @returns {Object} Flat object with display properties
   */
  toDisplayObject() {
    return {
      id: this.ID_Linea || this.ID_Item,
      lineId: this.ID_Linea,
      itemId: this.ID_Item,
      nombre: this.Nombre,
      dia: this.Dia,
      hora: this.Hora,
      comentarios: this.Comentarios,
      pax: this.pax,
      paxIsUserSet: this.paxIsUserSet,
      cantidad: this.cantidad,
      cantidadIsUserSet: this.cantidadIsUserSet,
      duracion: this.duracion,
      duracionIsUserSet: this.duracionIsUserSet,
      precio: this.displayPrice,
      total: this.total,
      available: this._available,
      isKit: this.isKit,
      appliedRules: this.humanizedRules,
      userAjustes: this._userAjustes,
    };
  }

  /**
   * Serializes to storage format (for database write).
   * Only includes fields that differ from defaults.
   *
   * @returns {Object} Storage format with ID_Linea, overrides, etc.
   */
  toStorageObject() {
    return {
      ID_Linea: this.ID_Linea,
      ID_Item: this.ID_Item,
      Override_Pax: this.paxIsUserSet ? this.pax : null,
      Override_Cantidad: this.cantidadIsUserSet ? this.cantidad : null,
      Override_Duracion_Min: this.duracionIsUserSet ? this.duracion : null,
      Dia: this.Dia,
      Hora: this.Hora,
      Comentarios: this.Comentarios,
    };
  }
}
