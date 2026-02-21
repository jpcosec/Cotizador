import { ContainerBase } from '../base/ContainerBase.js';
import { DayCategory } from './DayCategory.js';
import { Kit } from './Kit.js';

/**
 * Basket — the active quotation's selected items, grouped by day.
 *
 * Extends ContainerBase (Rulable + Aggregable + XStateable + Alpineable).
 *
 * Tree structure:
 *   Basket
 *     └── DayCategory(dia)          one per event day, created lazily
 *           ├── Item(ID_Linea)      regular items
 *           └── Kit(ID_Kit)         basket-mode kit container
 *                 └── Item(ID_Linea) kit child items
 *
 * Rule inheritance flow: Basket → DayCategory → Item
 * Price aggregation flow: Item → DayCategory → Basket
 *
 * Basket owns basket-level rules (AJUSTE_GLOBAL, IMPUESTO) via this._rules.
 * Pass catalog.getBasketRules() to the constructor to populate them.
 */
export class Basket extends ContainerBase {
  /**
   * @param {Object} quotation  - { ID_Cotizacion, ID_Cliente, Fecha_Evento, Duracion_Dias, paxGlobal }
   * @param {Catalog} catalog   - Loaded Catalog instance for item lookup
   * @param {Object} opts
   * @param {Function|null} opts.evaluator - Rule evaluator fn(rule, ctx) => result|null
   * @param {Array}         opts.rules     - Basket-level rules (AJUSTE_GLOBAL, IMPUESTO)
   */
  constructor(quotation, catalog, { evaluator = null, rules = [] } = {}) {
    super();
    this._quotation = quotation;
    this._catalog   = catalog;
    this._seq       = 0;
    this._evaluator = evaluator;
    this._rules     = rules;

    if (quotation?.paxGlobal != null) {
      this._calculationParams.pax = quotation.paxGlobal;
    }
  }

  // ── Line ID generation ──────────────────────────────────────────

  _nextLineId() {
    this._seq++;
    return `LIN_${String(this._seq).padStart(4, '0')}`;
  }

  // ── Mutations ──────────────────────────────────────────────────

  /**
   * Adds an item (or kit) from the catalog into the correct DayCategory.
   *
   * @param {string} itemId   - ID_Item to add
   * @param {Object} overrides - { Dia, Hora, Comentarios, pax, cantidad, duracion }
   * @returns {Array<Item>} Added item instances (multiple for kits)
   */
  add(itemId, overrides = {}) {
    const catalogEntry = this._catalog.getItem(itemId);
    if (!catalogEntry) throw new Error(`Item not found in catalog: ${itemId}`);

    const dia = overrides.Dia ?? 1;
    const dayCategory = this._getOrCreateDayCategory(dia);
    const ctx = this.propagateContext();

    if (catalogEntry._mode !== undefined) {
      return this._addKit(catalogEntry, overrides, dayCategory, ctx);
    }

    return this._addItem(catalogEntry, overrides, dayCategory, ctx);
  }

  /**
   * Removes an item by lineId, cleaning up empty containers.
   *
   * @param {string} lineId
   */
  remove(lineId) {
    for (const [dia, dayCategory] of this._children) {
      if (dayCategory.getChild(lineId)) {
        dayCategory.removeChild(lineId);
        if (dayCategory.childCount === 0) this._children.delete(dia);
        return;
      }
      // Check inside Kit containers
      for (const [kitId, child] of dayCategory._children) {
        if (typeof child.getChild === 'function' && child.getChild(lineId)) {
          child.removeChild(lineId);
          if (child.childCount === 0) dayCategory.removeChild(kitId);
          if (dayCategory.childCount === 0) this._children.delete(dia);
          return;
        }
      }
    }
  }

  /**
   * Updates quantities or metadata on an existing basket item.
   *
   * @param {string} lineId
   * @param {Object} overrides - { pax, cantidad, duracion, Hora, Comentarios }
   * @returns {Item|null}
   */
  update(lineId, overrides = {}) {
    const item = this._findByLineId(lineId);
    if (!item) return null;

    if (overrides.Hora       !== undefined) item.Hora       = overrides.Hora;
    if (overrides.Comentarios !== undefined) item.Comentarios = overrides.Comentarios;

    const quantities = {};
    if (overrides.pax      !== undefined) quantities.pax      = overrides.pax;
    if (overrides.cantidad !== undefined) quantities.cantidad = overrides.cantidad;
    if (overrides.duracion !== undefined) quantities.duracion = overrides.duracion;

    if (Object.keys(quantities).length > 0) {
      item.updateQuantities(quantities, true);
    }

    return item;
  }

  /**
   * Reprices all items when paxGlobal changes.
   *
   * @param {number} paxGlobal
   */
  reprice(paxGlobal) {
    this._calculationParams.pax = paxGlobal;
    const ctx = this.propagateContext();
    for (const item of this._flatItems()) {
      item.receiveContext(ctx);
      item.calculate();
    }
  }

  // ── Totals ─────────────────────────────────────────────────────

  /**
   * Aggregates item prices, applies basket-level rules, computes taxes.
   *
   * @returns {{ subtotal: number, taxes: Array, total: number }}
   */
  get totals() {
    const { subtotal } = this.aggregate();
    let adjustedSubtotal = subtotal;

    const globalRules = this._rules.filter(r => r.Etapa === 'AJUSTE_GLOBAL' && r.Activo !== false);
    if (this._evaluator && globalRules.length > 0) {
      const ctx = { subtotal: adjustedSubtotal, lineas: this._flatItems().map(i => i.toDisplayObject()) };
      for (const rule of globalRules) {
        const result = this._evaluator(rule, ctx);
        if (result?.delta) adjustedSubtotal += result.delta;
      }
    }

    const taxes = [];
    const taxRules = this._rules.filter(r => r.Etapa === 'IMPUESTO' && r.Activo !== false);
    if (this._evaluator && taxRules.length > 0) {
      for (const rule of taxRules) {
        const result = this._evaluator(rule, { subtotal: adjustedSubtotal });
        if (result) taxes.push(result);
      }
    }

    const taxTotal = taxes.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { subtotal: adjustedSubtotal, taxes, total: adjustedSubtotal + taxTotal };
  }

  // ── Serialization ──────────────────────────────────────────────

  /**
   * Flat snapshot compatible with XState context (backward-compat for Phase B).
   *
   * @returns {{ cotizacion: Object, lineas: Object[], totals: Object }}
   */
  toSnapshot() {
    return {
      cotizacion: { ...this._quotation },
      lineas: this._flatItems().map(i => i.toStorageObject()),
      totals: this.totals,
    };
  }

  /**
   * Persists quotation, line items, and cache snapshot to the store.
   *
   * @param {Object} store
   */
  save(store) {
    store.insert('COTIZACIONES', { ...this._quotation, Estado: 'Guardada' });
    for (const item of this._flatItems()) {
      store.insert('LINEA_DETALLE', {
        ...item.toStorageObject(),
        ID_Cotizacion: this._quotation.ID_Cotizacion,
      });
    }
    store.insert('CACHE_COTIZACION', {
      ID_Cotizacion: this._quotation.ID_Cotizacion,
      Snapshot_JSON: JSON.stringify(this.toSnapshot()),
      Updated_At:    new Date().toISOString(),
    });
  }

  /**
   * Display object for Alpine — days array with items and totals.
   *
   * @returns {{ days: Object[], totals: Object }}
   */
  toDisplayObject() {
    const days = [];
    for (const dayCategory of this._children.values()) {
      days.push(dayCategory.toDisplayObject());
    }
    return { days, totals: this.totals };
  }

  // ── Private helpers ────────────────────────────────────────────

  _getOrCreateDayCategory(dia) {
    if (!this._children.has(dia)) {
      this._children.set(dia, new DayCategory(dia, { evaluator: this._evaluator }));
    }
    return this._children.get(dia);
  }

  _addItem(catalogItem, overrides, dayCategory, ctx) {
    const instance = catalogItem.instantiate(this._nextLineId());
    if (this._evaluator) instance._evaluator = this._evaluator;
    _applySimpleOverrides(instance, overrides);
    _applyQuantityOverrides(instance, overrides);
    instance.receiveContext(ctx);
    instance.calculate();
    dayCategory.addChild(instance.ID_Linea, instance);
    return [instance];
  }

  _addKit(catalogKit, overrides, dayCategory, ctx) {
    const basketKit = new Kit(
      { ID_Item: catalogKit.ID_Kit, Nombre: catalogKit.Nombre, Activo: catalogKit.Activo },
      { mode: 'basket', evaluator: this._evaluator }
    );

    const addedItems = [];
    for (const catalogChild of catalogKit._children.values()) {
      const instance = catalogChild.instantiate(this._nextLineId());
      if (this._evaluator) instance._evaluator = this._evaluator;
      _applySimpleOverrides(instance, overrides);
      _applyQuantityOverrides(instance, overrides);
      instance.receiveContext(ctx);
      instance.calculate();
      basketKit.addChild(instance.ID_Linea, instance);
      addedItems.push(instance);
    }

    dayCategory.addChild(catalogKit.ID_Kit, basketKit);
    return addedItems;
  }

  _findByLineId(lineId) {
    for (const item of this._flatItems()) {
      if (item.ID_Linea === lineId) return item;
    }
    return null;
  }

  _flatItems() {
    const items = [];
    for (const dayCategory of this._children.values()) {
      for (const child of dayCategory._children.values()) {
        if (typeof child._mode !== 'undefined') {
          // Kit — collect its leaf items
          for (const kitItem of child._children.values()) {
            items.push(kitItem);
          }
        } else {
          items.push(child);
        }
      }
    }
    return items;
  }
}

// ── Module-level helpers ────────────────────────────────────────────────────

function _applySimpleOverrides(item, overrides) {
  if (overrides.Dia         !== undefined) item.Dia         = overrides.Dia;
  if (overrides.Hora        !== undefined) item.Hora        = overrides.Hora;
  if (overrides.Comentarios !== undefined) item.Comentarios = overrides.Comentarios;
}

function _applyQuantityOverrides(item, overrides) {
  if (overrides.pax      !== undefined) { item.pax      = overrides.pax;      item.paxIsUserSet      = true; }
  if (overrides.cantidad !== undefined) { item.cantidad = overrides.cantidad; item.cantidadIsUserSet = true; }
  if (overrides.duracion !== undefined) { item.duracion = overrides.duracion; item.duracionIsUserSet = true; }
}
