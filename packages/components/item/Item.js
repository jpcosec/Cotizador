/**
 * Refactored Item business object.
 *
 * Stateful business object for one item with:
 * - Pure domain function-based calculations
 * - Semantic mutation methods
 * - Render-ready projections for Alpine/XState
 *
 * Responsibilities:
 * - Resolve pricing kind and initialization mode
 * - Compute catalog (disaggregated) and basket (aggregated) views
 * - Track override state and UI visibility flags
 * - Expose render-ready projections
 *
 * @module Item
 */

import {
  PricingKind,
  InitializationMode,
  toNumber,
  toInteger,
  normalizeProfile,
  detectPricingKind,
  detectInitializationMode,
  rateForKind,
  overrideFieldForKind,
  fixedAmountForKind
} from './domain/pricing.js';
import {
  resolveContextQuantity,
  resolveBasketQuantity,
  applyExclusiveDefaultMode
} from './domain/quantity.js';
import {
  money,
  formatCatalogTerms,
  policyHint,
  legendForBasket,
  profileHumanText,
  lineRateLabel
} from './domain/formatting.js';
import { resolveSchedule } from './domain/schedule.js';
import { RulesCoordinator } from './domain/rulesEngine/coordinator.js';

/**
 * Refactored Item class using domain functions.
 * All fields are private (#). Public interface is via getters and mutations.
 */
export class Item {
  #mode;
  #definition;
  #externalContext;
  #overrides;
  #userSetFields;
  #derived;
  #rulesCoordinator;
  #ruleResult;

  /**
   * Private constructor. Use static factories instead.
   */
  constructor() {
    // Nothing here; factories set private fields via initialize()
  }

  /**
   * Build an Item instance from a definition and optional context.
   * Useful for catalog card display (no overrides).
   *
   * @param {Object} definition - Item definition object
   * @param {Object} [options={}] - Optional context and overrides
   * @param {Object} [options.externalContext={}] - External context
   * @param {Object} [options.overrides={}] - User overrides
   * @returns {Item}
   */
  static fromDefinition(resolvedDef, options = {}) {
    const item = new Item();
    const definition = {
      id:             resolvedDef.ID_Item,
      name:           resolvedDef.Nombre,
      description:    resolvedDef.Default_Glosa ?? null,
      category:       resolvedDef.categoria?.Nombre ?? null,
      categoriaIcono: resolvedDef.categoria?.Icono_UI ?? null,
      pricingProfile: {
        baseFijo:   resolvedDef.perfil?.Costo_Base_Fijo       ?? 0,
        porPersona: resolvedDef.perfil?.Costo_Unitario_Pax    ?? 0,
        porMinuto:  resolvedDef.perfil?.Costo_Unitario_Tiempo ?? 0,
        porUnidad:  resolvedDef.perfil?.Costo_Unitario_Item   ?? 0,
      },
      defaultQuantities: {
        duracionMin:        resolvedDef.categoria?.Def_Duracion_Min ?? 0,
        unidadesPorUsuario: resolvedDef.Def_Unidades_Por_Pax_Override
                         ?? resolvedDef.categoria?.Def_Unidades_Por_Pax ?? 0,
        requierePax:    resolvedDef.categoria?.Def_Requiere_Pax    ?? false,
        requiereCant:   resolvedDef.categoria?.Def_Requiere_Cant   ?? false,
        requiereTiempo: resolvedDef.categoria?.Def_Requiere_Tiempo ?? false,
        requiereHora:   resolvedDef.categoria?.Def_Requiere_Hora   ?? false,
      },
      rules:    resolvedDef.reglas    ?? [],
      perfil:   resolvedDef.perfil    ?? null,
      categoria: resolvedDef.categoria ?? null,
    };
    return item.initialize({
      mode: 'catalog',
      definition,
      externalContext: options.externalContext || {},
      overrides:       options.overrides       || {}
    });
  }

  /**
   * Build an Item instance from a complete seed.
   * Useful for restoring persisted state.
   *
   * @param {Object} seed - Complete state seed
   * @param {string} [seed.mode='catalog']
   * @param {Object} [seed.definition={}]
   * @param {Object} [seed.externalContext={}]
   * @param {Object} [seed.overrides={}]
   * @returns {Item}
   */
  static fromSeed(seed) {
    const item = new Item();
    return item.initialize(seed);
  }

  /**
   * Reset state with a new seed and recalculate all derived fields.
   * Called by factories and after any mutation.
   *
   * @param {Object} seed
   * @param {'catalog'|'basket'} [seed.mode='catalog']
   * @param {Object} [seed.definition={}]
   * @param {Object} [seed.externalContext={}]
   * @param {Object} [seed.overrides={}]
   * @returns {Item}
   */
  initialize({
    mode = 'catalog',
    definition = {},
    externalContext = {},
    overrides = {},
    userSetFields = []
  } = {}) {
    this.#mode = mode;
    this.#definition = {
      ...(definition || {}),
      pricingProfile: { ...((definition || {}).pricingProfile || {}) },
      defaultQuantities: { ...((definition || {}).defaultQuantities || {}) },
      rules: [...((definition || {}).rules || [])]
    };
    this.#externalContext = { ...(externalContext || {}) };
    this.#overrides = { ...(overrides || {}) };
    this.#userSetFields = new Set(userSetFields || []);

    // Initialize RulesCoordinator for ITEM-scoped rules (Step 3.3)
    // Rules will be evaluated in calculate() with full context available
    this.#rulesCoordinator = new RulesCoordinator('ITEM', this.#definition.rules || [], this.#definition.id ?? null);

    return this.calculate();
  }

  /**
   * Recompute full derived state after any mutation.
   * Implements the complete calculation pipeline:
   * 1. Normalize profile
   * 2. Detect pricing kind
   * 3. Detect initialization mode
   * 4. Extract rate
   * 5. Resolve basket quantity
   * 6. Compute total
   * 7. Resolve schedule
   * 8. Evaluate rules
   * 9. Format display strings
   *
   * @returns {Item}
   */
  calculate() {
    const defaults = this.#definition.defaultQuantities || {};
    const profile = normalizeProfile(this.#definition.pricingProfile || {});
    const kind = detectPricingKind(profile);
    const initMode = detectInitializationMode(kind, defaults);
    const rate = rateForKind(profile, kind);
    const base = toNumber(profile.baseFijo, 0);

    const basketResolution = resolveBasketQuantity(
      kind,
      initMode,
      defaults,
      this.#externalContext,
      this.#overrides
    );

    const quantity = basketResolution.quantity;
    const total = toInteger(base + quantity * rate, 0);

    const quantities = {
      pax: kind === PricingKind.PAX ? quantity : 0,
      cantidad: kind === PricingKind.UNITS ? quantity : 0,
      duracionMin: kind === PricingKind.TIME ? quantity : 0
    };

    const schedule = resolveSchedule(this.#externalContext, this.#overrides);
    const horaFinMin = schedule.horaMin + quantities.duracionMin;

    // Evaluate rules using RulesCoordinator.
    // Snapshot uses the `linea.*` namespace that matches Condicion_JSON var paths
    // in REGLAS_NEGOCIO.csv (e.g. { "var": "linea._pax" }, { "var": "linea.ID_Item" }).
    this.#rulesCoordinator.invalidateCache();
    this.#ruleResult = this.#rulesCoordinator.evaluate({
      item: {
        id:       this.#definition.id,
        pax:      quantities.pax,
        cantidad: quantities.cantidad,
        duracion: quantities.duracionMin,
        hora:     schedule.hora,
        horaMin:  schedule.horaMin,
        horaFinMin,
        dia:      schedule.dia,
      }
    });

    const catalogDisaggregated = formatCatalogTerms(
      base,
      kind,
      initMode,
      rate,
      defaults
    );

    const policyHintText = policyHint(kind, initMode, defaults);
    const basketLegendText = legendForBasket(base, kind, quantity, rate, total);
    const pricingHumanText = profileHumanText(base, kind, rate);
    const lineRateLabelText = lineRateLabel(kind);

    // Store all derived values
    this.#derived = {
      profile,
      pricingKind: kind,
      initializationMode: initMode,
      rate,
      base,
      basketQuantity: quantity,
      total,
      unitDisplay: quantity > 0 ? toInteger(total / quantity, 0) : toInteger(total, 0),
      isOverridden: basketResolution.isOverridden,
      overrideField: basketResolution.overrideField,
      catalogDisaggregated,
      policyHintText,
      basketLegendText,
      pricingHumanText,
      quantities,
      schedule,
      lineRateLabel: lineRateLabelText,
      lineRateSubtotal: quantity * rate,
      comentarios: this.#overrides.comentarios ?? '',
      showPaxControl: kind === PricingKind.PAX,
      showUnitsControl: kind === PricingKind.UNITS,
      showTimeControl: kind === PricingKind.TIME,
      userSetFields: [...this.#userSetFields],
      isUserSetPax: this.#userSetFields.has('pax'),
      isUserSetCantidad: this.#userSetFields.has('cantidad'),
      isUserSetDuracion: this.#userSetFields.has('duracionMin')
    };

    return this;
  }

  // ---- Semantic Mutations (each returns this for chaining) ----

  /**
   * Set mode (catalog/basket) and recalculate.
   *
   * @param {'catalog'|'basket'} mode
   * @returns {Item}
   */
  setMode(mode = 'catalog') {
    this.#mode = mode;
    return this.calculate();
  }

  /**
   * Merge external context values and recalculate.
   * External context includes paxGlobal, duracionMin, dia, hora from the event.
   *
   * @param {Object} patch
   * @returns {Item}
   */
  receiveContext(patch = {}) {
    this.#externalContext = {
      ...this.#externalContext,
      ...(patch || {})
    };
    return this.calculate();
  }

  /**
   * Set one override value and recalculate.
   * Overrides include pax, cantidad, duracionMin, dia, hora, comentarios.
   *
   * @param {string} key
   * @param {any} value
   * @returns {Item}
   */
  setOverride(key, value) {
    this.#overrides = {
      ...this.#overrides,
      [key]: value
    };
    // Track quantity fields as user-set (not comments or schedule)
    if (['pax', 'cantidad', 'duracionMin'].includes(key)) {
      this.#userSetFields.add(key);
    }
    return this.calculate();
  }

  /**
   * Remove one override value and recalculate.
   *
   * @param {string} key
   * @returns {Item}
   */
  clearOverride(key) {
    const next = { ...this.#overrides };
    delete next[key];
    this.#overrides = next;
    this.#userSetFields.delete(key);
    return this.calculate();
  }

  /**
   * Clear all overrides and recalculate.
   *
   * @returns {Item}
   */
  resetOverrides() {
    this.#overrides = {};
    this.#userSetFields = new Set();
    return this.calculate();
  }

  /**
   * Update one pricing profile field and recalculate.
   *
   * @param {string} key
   * @param {number|string} value
   * @returns {Item}
   */
  setProfileValue(key, value) {
    this.#definition.pricingProfile = {
      ...(this.#definition.pricingProfile || {}),
      [key]: toNumber(value, 0)
    };
    return this.calculate();
  }

  /**
   * Update one initialization field with exclusivity rules and recalculate.
   * Uses applyExclusiveDefaultMode to enforce only one mode per kind.
   *
   * @param {string} key
   * @param {number|string} value
   * @returns {Item}
   */
  setDefaultQuantity(key, value) {
    this.#definition.defaultQuantities = applyExclusiveDefaultMode(
      this.#definition.defaultQuantities || {},
      key,
      value
    );
    return this.calculate();
  }

  /**
   * Remove one initialization field and recalculate.
   *
   * @param {string} key
   * @returns {Item}
   */
  clearDefaultQuantity(key) {
    const next = { ...(this.#definition.defaultQuantities || {}) };
    delete next[key];
    this.#definition.defaultQuantities = next;
    return this.calculate();
  }

  // ---- Getters (read-only, no computation) ----

  /**
   * Get current mode (catalog or basket).
   * @returns {'catalog'|'basket'}
   */
  get mode() {
    return this.#mode;
  }

  /**
   * Get current definition.
   * @returns {Object}
   */
  get definition() {
    return this.#definition;
  }

  /**
   * Get current external context.
   * @returns {Object}
   */
  get externalContext() {
    return this.#externalContext;
  }

  /**
   * Get current overrides.
   * @returns {Object}
   */
  get overrides() {
    return this.#overrides;
  }

  // ---- Key Derived Fields (from #derived cache) ----

  /**
   * Get the detected pricing kind.
   * @returns {PricingKind}
   */
  get pricingKind() {
    return this.#derived.pricingKind;
  }

  /**
   * Get the computed total price.
   * @returns {number}
   */
  get total() {
    return this.#derived.total;
  }

  /**
   * Get whether the quantity is user-overridden.
   * @returns {boolean}
   */
  get isOverridden() {
    return this.#derived.isOverridden;
  }


  /**
   * Get quantities object with pax, cantidad, duracionMin.
   * @returns {Object}
   */
  get quantities() {
    return this.#derived.quantities;
  }

  /**
   * Get schedule object with dia and hora.
   * @returns {Object}
   */
  get schedule() {
    return this.#derived.schedule;
  }

  /**
   * Get the rules array for this item.
   * Rules evaluation is NOT YET IMPLEMENTED at Item level (Step 3.3).
   *
   * Rule structure (from REGLAS_NEGOCIO.csv):
   * {
   *   ID_Regla: string,
   *   Nombre: string,
   *   Etapa: string,              // (not used in Step 3.3)
   *   Scope: string,              // ITEM, CATEGORY, KIT, CONTAINER, BASKET
   *   Tipo_Accion: string,        // ERROR, WARNING, MULTIPLY, ADD_FIXED, SET_VALUE, SET_TAX, SET_DEFAULT, ADD_ITEM, INVALIDATE_BASKET
   *   Condicion_JSON: string|obj, // json-logic-js expression (business logic only, no ID matching)
   *   Payload_JSON: string|obj,   // action-specific payload
   *   Prioridad: number,
   *   Acumulable: boolean,
   *   Activo: boolean,
   *   Updated_At: string
   * }
   *
   * When implemented (Step 3.3):
   * - Filter rules at construction: r.Scope === 'ITEM' && r.ID_Item === itemId && r.Activo === true
   * - Sort by Prioridad (ascending)
   * - Evaluate each condition (Condicion_JSON) against: { pax, cantidad, duracionMin, hora, dia }
   * - Execute matching action handlers (ERROR/WARNING have effects, others are no-op for now)
   * - Cache results (no re-evaluation on quantity changes)
   * - Use humanize.js for readable condition/action formatting
   * - Re-evaluate on externalContext changes (re-filter + re-evaluate)
   *
   * Key insight: Component ID matching (ID_Item) happens in the FILTER, not the condition.
   * This keeps conditions pure and reusable across CATEGORY, KIT, CONTAINER, BASKET later.
   *
   * See: packages/components/item/domain/rulesEngine/README.md (filtering strategy)
   * See: claps_codelab/packages/pricing/src/RulesEngine/ (implementation reference)
   *
   * @returns {Array}
   */
  get rules() {
    return this.#definition.rules || [];
  }

  // ---- Projections ----

  /**
   * Projection for catalog card rendering.
   * Includes pricing formula, description, and category.
   *
   * @returns {Object}
   */
  get catalogCard() {
    return {
      ID_Item: this.#definition.id ?? 'ITEM_UNKNOWN',
      Nombre: this.#definition.name,
      Precio_Calculado_Default: this.#derived.catalogDisaggregated,
      Precio_Por_Cantidad: this.#derived.pricingHumanText,
      InitPolicyHuman: this.#derived.policyHintText,
      detalle: `${this.#definition.description || ''}\n${this.#derived.catalogDisaggregated}`,
      categoria: this.#definition.category
    };
  }

  /**
   * Projection for basket line rendering.
   * Includes schedule, quantities, pricing details, and availability.
   *
   * @returns {Object}
   */
  get basketLine() {
    return {
      id: this.#definition.id ?? 'ITEM_UNKNOWN',
      lineId: null,
      itemId: this.#definition.id ?? 'ITEM_UNKNOWN',
      nombre: this.#definition.name,
      descripcion: this.#definition.description,
      categoria: this.#definition.category,
      hora: this.#derived.schedule.hora,
      horaMin: this.#derived.schedule.horaMin,
      horaFinMin: this.#derived.schedule.horaMin + this.#derived.quantities.duracionMin,
      dia: this.#derived.schedule.dia,
      comentarios: this.#derived.comentarios,
      pax: this.#derived.quantities.pax,
      cantidad: this.#derived.quantities.cantidad,
      duracionMin: this.#derived.quantities.duracionMin,
      precio: this.#derived.unitDisplay,
      baseFijo: this.#derived.base,
      rateLabel: this.#derived.lineRateLabel,
      rateValue: this.#derived.rate,
      rateSubtotal: this.#derived.lineRateSubtotal,
      pricingKind: this.#derived.pricingKind,
      basketLegend: this.#derived.basketLegendText,
      isOverridden: this.#derived.isOverridden,
      showPaxControl: this.#derived.showPaxControl,
      showUnitsControl: this.#derived.showUnitsControl,
      showTimeControl: this.#derived.showTimeControl,
      total: this.#derived.total
    };
  }

  /**
   * Full projection consumed by XState context / Alpine bridge.
   * Includes all computed fields and both catalog/basket views.
   *
   * EXACT same shape as ItemLogic.toMachineContext() for backward compat.
   *
   * @returns {Object}
   */
  toDisplayObject() {
    const catalogCard = this.catalogCard;
    const basketLine = this.basketLine;

    return {
      mode: this.#mode,
      definition: this.#definition,
      externalContext: this.#externalContext,
      overrides: this.#overrides,
      catalogCard,
      basketLine,
      profile: this.#derived.profile,
      quantities: this.#derived.quantities,
      schedule: this.#derived.schedule,
      comentarios: this.#derived.comentarios,
      pricingKind: this.#derived.pricingKind,
      initializationMode: this.#derived.initializationMode,
      pricingHuman: this.#derived.pricingHumanText,
      pricingPerQuantityHuman: this.#derived.catalogDisaggregated,
      total: this.#derived.total,
      catalogPriceDisaggregated: this.#derived.catalogDisaggregated,
      catalogFormulaHuman: this.#derived.catalogDisaggregated,
      initPolicyHuman: this.#derived.policyHintText,
      basketLegend: this.#derived.basketLegendText,
      isOverridden: this.#derived.isOverridden,
      lineRateLabel: this.#derived.lineRateLabel,
      lineRateValue: this.#derived.rate,
      lineRateSubtotal: this.#derived.lineRateSubtotal,
      lineBaseValue: this.#derived.base,
      unitDisplay: this.#derived.unitDisplay,
      showPaxControl: this.#derived.showPaxControl,
      showUnitsControl: this.#derived.showUnitsControl,
      showTimeControl: this.#derived.showTimeControl,
      userSetFields: this.#derived.userSetFields,
      isUserSetPax: this.#derived.isUserSetPax,
      isUserSetCantidad: this.#derived.isUserSetCantidad,
      isUserSetDuracion: this.#derived.isUserSetDuracion,
      appliedRules: this.#ruleResult?.appliedRules || [],
      ruleErrors: this.#ruleResult?.errors || [],
      ruleWarnings: this.#ruleResult?.warnings || [],
      available: this.#ruleResult?.available ?? true,
      // Visibility flags — from category dimension flags (set by DB definition)
      showPax:      this.#definition.defaultQuantities?.requierePax    ?? false,
      showCantidad: this.#definition.defaultQuantities?.requiereCant   ?? false,
      showDuracion: this.#definition.defaultQuantities?.requiereTiempo ?? false,
      showHora:     this.#definition.defaultQuantities?.requiereHora   ?? false,
      // Raw DB objects for read-only display panels
      perfil:    this.#definition.perfil    ?? null,
      categoria: this.#definition.categoria ?? null,
    };
  }

  /**
   * Serialize state to a seed for persistence or transmission.
   * Can be restored with Item.fromSeed().
   *
   * @returns {Object}
   */
  toSeed() {
    return {
      mode: this.#mode,
      definition: this.#definition,
      externalContext: this.#externalContext,
      overrides: this.#overrides,
      userSetFields: [...this.#userSetFields]
    };
  }
}
