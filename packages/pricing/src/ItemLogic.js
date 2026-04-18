import { formatCatalogTerms, policyHint, legendForBasket, resolveSchedule, evaluateRules } from './Formulas.js';
import { resolveContextQuantity, resolveBasketQuantity, applyExclusiveDefaultMode } from './QuantityResolution.js';
import { PricingKind, InitializationMode } from './Enums.js';
import { toNumber, toInteger, money } from './Helpers.js';
import { 
  detectPricingKind, 
  detectInitializationMode, 
  rateForKind, 
  overrideFieldForKind, 
  fixedAmountForKind 
} from './PricingDetection.js';


/**
 * Stateful business object for one item.
 *
 * Responsibilities:
 * - Resolve pricing kind and initialization mode
 * - Compute catalog (disaggregated) and basket (aggregated) views
 * - Track override state and UI visibility flags
 * - Expose render-ready projections for Alpine/XState bridges
 */
export class ItemLogic {
  /**
   * @param {Object} seed
   * @param {'catalog'|'basket'} [seed.mode]
   * @param {Object} [seed.definition]
   * @param {Object} [seed.externalContext]
   * @param {Object} [seed.overrides]
   */
  constructor(seed = {}) {
    this.initialize(seed);
  }

  /**
   * Build an ItemLogic instance from an XState-like context snapshot.
   * @param {Object} context
   * @returns {ItemLogic}
   */
  static fromContext(context = {}) {
    return new ItemLogic({
      mode: context.mode,
      definition: context.definition,
      externalContext: context.externalContext,
      overrides: context.overrides
    });
  }

  /**
   * Reset state with a new seed and recalculate all derived fields.
   * @param {Object} seed
   * @param {'catalog'|'basket'} [seed.mode='catalog']
   * @param {Object} [seed.definition={}]
   * @param {Object} [seed.externalContext={}]
   * @param {Object} [seed.overrides={}]
   * @returns {ItemLogic}
   */
  initialize({
    mode = 'catalog',
    definition = {},
    externalContext = {},
    overrides = {}
  } = {}) {
    this.mode = mode;
    this.definition = {
      ...(definition || {}),
      pricingProfile: { ...((definition || {}).pricingProfile || {}) },
      defaultQuantities: { ...((definition || {}).defaultQuantities || {}) },
      rules: [ ...((definition || {}).rules || []) ]
    };
    this.externalContext = { ...(externalContext || {}) };
    this.overrides = { ...(overrides || {}) };
    return this.recalculate();
  }

  /**
   * Normalize a raw pricing profile into canonical field names.
   * Supports both camelCase (`baseFijo`) and schema-style (`Costo_Base_Fijo`) keys.
   * @param {Object} [raw={}]
   * @returns {{ baseFijo: number, porPersona: number, porUnidad: number, porMinuto: number }}
   */
  normalizeProfile(raw = {}) {
    return {
      baseFijo: toNumber(raw.baseFijo ?? raw.Costo_Base_Fijo ?? 0),
      porPersona: toNumber(raw.porPersona ?? raw.Costo_Unitario_Pax ?? 0),
      porUnidad: toNumber(raw.porUnidad ?? raw.Costo_Unitario_Item ?? 0),
      porMinuto: toNumber(raw.porMinuto ?? raw.Costo_Unitario_Tiempo ?? 0)
    };
  }

  recalculate() {
    const defaults = this.definition.defaultQuantities || {};
    const profile = this.normalizeProfile(this.definition.pricingProfile || {});
    const kind = detectPricingKind(profile);
    const initMode = detectInitializationMode(kind, defaults);
    const rate = rateForKind(profile, kind);
    const base = toNumber(profile.baseFijo, 0);

    const basketResolution = resolveBasketQuantity(
      kind,
      initMode,
      defaults,
      this.externalContext,
      this.overrides
    );

    const quantity = basketResolution.quantity;
    const total = toInteger(base + (quantity * rate), 0);

    const quantities = {
      pax: kind === PricingKind.PAX ? quantity : 0,
      cantidad: kind === PricingKind.UNITS ? quantity : 0,
      duracionMin: kind === PricingKind.TIME ? quantity : 0
    };

    const schedule = resolveSchedule(this.externalContext, this.overrides);
    const ruleResult = evaluateRules(this.definition.rules || [], {
      mode: this.mode,
      quantities,
      schedule
    });

    this.profile = profile;
    this.pricingKind = kind;
    this.initializationMode = initMode;
    this.rate = rate;
    this.base = base;
    this.total = total;
    this.quantities = quantities;
    this.schedule = schedule;
    this.appliedRules = ruleResult.appliedRules;
    this.available = ruleResult.available;

    this.pricingHumanText = formatCatalogTerms(base, kind, initMode, rate, defaults);
    this.policyHintText = policyHint(kind, initMode, defaults);
    this.basketLegendText = legendForBasket(base, kind, quantity, rate, total);
    this.catalogDisaggregated = this.pricingHumanText;

    this.isOverridden = basketResolution.isOverridden;
    this.lineRateSubtotal = quantity * rate;
    this.lineRateLabel = kind === PricingKind.PAX ? 'Pax' : kind === PricingKind.UNITS ? 'Unidades' : 'Duracion';
    this.unitDisplay = quantity > 0 ? (total / quantity) : total;

    this.showPaxControl = kind === PricingKind.PAX;
    this.showUnitsControl = kind === PricingKind.UNITS;
    this.showTimeControl = kind === PricingKind.TIME;
    this.comentarios = this.overrides.comentarios || '';

    return this;
  }

  /**
   * Set mode and recalculate.
   * @param {'catalog'|'basket'} mode
   * @returns {ItemLogic}
   */
  setMode(mode = 'catalog') {
    this.mode = mode;
    return this.recalculate();
  }

  /**
   * Merge external context values and recalculate.
   * @param {Object} patch
   * @returns {ItemLogic}
   */
  setExternalContext(patch = {}) {
    this.externalContext = {
      ...this.externalContext,
      ...(patch || {})
    };
    return this.recalculate();
  }

  /**
   * Update one pricing profile field and recalculate.
   * @param {string} key
   * @param {number|string} value
   * @returns {ItemLogic}
   */
  setProfileValue(key, value) {
    this.definition.pricingProfile = {
      ...(this.definition.pricingProfile || {}),
      [key]: toNumber(value, 0)
    };
    return this.recalculate();
  }

  /**
   * Update one initialization field with exclusivity rules and recalculate.
   * @param {string} key
   * @param {number|string} value
   * @returns {ItemLogic}
   */
  setDefaultInitializationValue(key, value) {
    this.definition.defaultQuantities = applyExclusiveDefaultMode(
      this.definition.defaultQuantities || {},
      key,
      value
    );
    return this.recalculate();
  }

  /**
   * Remove one initialization field and recalculate.
   * @param {string} key
   * @returns {ItemLogic}
   */
  clearDefaultInitializationValue(key) {
    const next = { ...(this.definition.defaultQuantities || {}) };
    delete next[key];
    this.definition.defaultQuantities = next;
    return this.recalculate();
  }

  /**
   * Set one override value and recalculate.
   * @param {string} key
   * @param {any} value
   * @returns {ItemLogic}
   */
  setOverride(key, value) {
    this.overrides = {
      ...this.overrides,
      [key]: value
    };
    return this.recalculate();
  }

  /**
   * Remove one override value and recalculate.
   * @param {string} key
   * @returns {ItemLogic}
   */
  clearOverride(key) {
    const next = { ...this.overrides };
    delete next[key];
    this.overrides = next;
    return this.recalculate();
  }

  /**
   * Clear all overrides and recalculate.
   * @returns {ItemLogic}
   */
  resetOverrides() {
    this.overrides = {};
    return this.recalculate();
  }

  /**
   * Update quantity-like fields (pax/cantidad/duracionMin/dia/hora).
   * @param {Object} quantities
   * @param {boolean} [isUserOverride=true]
   * @returns {ItemLogic}
   */
  modifyQuantities(quantities = {}, isUserOverride = true) {
    const patch = {};
    if (quantities.pax !== undefined) patch.pax = quantities.pax;
    if (quantities.cantidad !== undefined) patch.cantidad = quantities.cantidad;
    if (quantities.duracionMin !== undefined) patch.duracionMin = quantities.duracionMin;
    if (quantities.hora !== undefined) patch.hora = quantities.hora;
    if (quantities.dia !== undefined) patch.dia = quantities.dia;

    if (isUserOverride) {
      this.overrides = {
        ...this.overrides,
        ...patch
      };
    } else {
      this.externalContext = {
        ...this.externalContext,
        ...patch
      };
    }
    return this.recalculate();
  }

  /**
   * Alias kept for naming compatibility.
   * @param {Object} quantities
   * @param {boolean} [isUserOverride=true]
   * @returns {ItemLogic}
   */
  modify_quantities(quantities = {}, isUserOverride = true) {
    return this.modifyQuantities(quantities, isUserOverride);
  }

  /**
   * Projection for catalog card rendering.
   * @returns {Object}
   */
  toCatalogCard() {
    return {
      ID_Item: 'ITEM_DEMO',
      Nombre: this.definition.name,
      Precio_Calculado_Default: this.catalogDisaggregated,
      Precio_Por_Cantidad: this.pricingHumanText,
      InitPolicyHuman: this.policyHintText,
      detalle: `${this.definition.description || ''}\n${this.catalogDisaggregated}`,
      categoria: this.definition.category
    };
  }

  /**
   * Projection for basket line rendering.
   * @returns {Object}
   */
  toBasketLine() {
    return {
      id: this.mode === 'basket' ? 'LIN_DEMO_001' : 'ITEM_DEMO',
      lineId: this.mode === 'basket' ? 'LIN_DEMO_001' : null,
      itemId: 'ITEM_DEMO',
      nombre: this.definition.name,
      descripcion: this.definition.description,
      categoria: this.definition.category,
      hora: this.schedule.hora,
      dia: this.schedule.dia,
      comentarios: this.comentarios,
      pax: this.quantities.pax,
      cantidad: this.quantities.cantidad,
      duracionMin: this.quantities.duracionMin,
      precio: this.unitDisplay,
      baseFijo: this.base,
      rateLabel: this.lineRateLabel,
      rateValue: this.rate,
      rateSubtotal: this.lineRateSubtotal,
      pricingKind: this.pricingKind,
      basketLegend: this.basketLegendText,
      isOverridden: this.isOverridden,
      showPaxControl: this.showPaxControl,
      showUnitsControl: this.showUnitsControl,
      showTimeControl: this.showTimeControl,
      total: this.total,
      available: this.available
    };
  }

  /**
   * Projection consumed by XState context / Alpine bridge.
   * @returns {Object}
   */
  toMachineContext() {
    const catalogCard = this.toCatalogCard();
    const basketLine = this.toBasketLine();

    return {
      mode: this.mode,
      definition: this.definition,
      externalContext: this.externalContext,
      overrides: this.overrides,
      catalogCard,
      basketLine,
      profile: this.profile,
      quantities: this.quantities,
      schedule: this.schedule,
      comentarios: this.comentarios,
      pricingKind: this.pricingKind,
      initializationMode: this.initializationMode,
      pricingHuman: this.pricingHumanText,
      pricingPerQuantityHuman: this.catalogDisaggregated,
      total: this.total,
      catalogPriceDisaggregated: this.catalogDisaggregated,
      catalogFormulaHuman: this.catalogDisaggregated,
      initPolicyHuman: this.policyHintText,
      basketLegend: this.basketLegendText,
      isOverridden: this.isOverridden,
      lineRateLabel: this.lineRateLabel,
      lineRateValue: this.rate,
      lineRateSubtotal: this.lineRateSubtotal,
      lineBaseValue: this.base,
      unitDisplay: this.unitDisplay,
      showPaxControl: this.showPaxControl,
      showUnitsControl: this.showUnitsControl,
      showTimeControl: this.showTimeControl,
      available: this.available,
      appliedRules: this.appliedRules
    };
  }
}

/**
 * Default business definition for the standalone demo item.
 * Kept in pricing layer so machine modules stay orchestration-only.
 */
export const defaultItemDefinition = {
  name: 'Coffee Break Intermedio',
  category: 'Coffee',
  description: 'Servicio de coffee break para eventos corporativos.',
  pricingProfile: {
    baseFijo: 400,
    porPersona: 0,
    porUnidad: 1,
    porMinuto: 0
  },
  defaultQuantities: {
    unidadesPorUsuario: 3,
    unidadesPorHora: 0,
    minutosPorUsuario: 0
  },
  rules: [
    { id: 'R1', type: 'MAX_PAX', value: 500, label: 'Maximo 500 pax', active: true, blocking: true },
    {
      id: 'R2',
      type: 'ONLY_HOUR_RANGE',
      min: '07:00',
      max: '22:00',
      label: 'Disponible entre 07:00 y 22:00',
      active: true,
      blocking: true
    }
  ]
};

/**
 * Default item seed used to initialize standalone item state.
 * @returns {{mode: string, definition: Object, externalContext: Object, overrides: Object}}
 */
export function createDefaultItemSeed() {
  return {
    mode: 'catalog',
    definition: defaultItemDefinition,
    externalContext: {
      paxGlobal: 20,
      duracionMin: 120,
      dia: 1,
      hora: '09:00'
    },
    overrides: {}
  };
}
