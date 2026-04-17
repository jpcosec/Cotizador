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
  toNumber,
  normalizeProfile,
  detectPricingKind,
  detectInitializationMode,
  rateForKind,
} from './domain/pricing.js';
import {
  resolveBasketQuantity,
} from './domain/quantity.js';
import {
  formatCatalogTerms,
  policyHint,
  legendForBasket,
  profileHumanText,
  lineRateLabel
} from './domain/formatting.js';
import { resolveSchedule } from './domain/schedule.js';
import { RulesCoordinator } from './domain/rulesEngine/coordinator.js';
import { createItemState } from './logic/ItemState.js';
import { createItemProjections } from './logic/ItemProjections.js';

/**
 * Refactored Item class using domain functions.
 */
export class Item {
  mode;
  definition;
  externalContext;
  overrides;
  userSetFields;
  derived;
  rulesCoordinator;
  ruleResult;

  /**
   * Private constructor. Use static factories instead.
   */
  constructor() {
    const stateMethods = createItemState(this);
    const projectionGetters = createItemProjections(this);
    Object.assign(this, stateMethods);
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(projectionGetters));
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
        duracionMin:        resolvedDef.perfilInit?.Duracion_Min        ?? 0,
        unidadesPorUsuario: resolvedDef.perfilInit?.Unidades_Por_Pax    ?? 0,
        unidadesPorHora:    resolvedDef.perfilInit?.Unidades_Por_Hora   ?? 0,
        minutosPorUsuario:  resolvedDef.perfilInit?.Minutos_Por_Usuario ?? 0,
        cantidad:           resolvedDef.perfilInit?.Cantidad_Fija       ?? 0,
        pax:                resolvedDef.perfilInit?.Pax_Fijo            ?? 0,
        requierePax:    resolvedDef.categoria?.Def_Requiere_Pax    ?? false,
        requiereCant:   resolvedDef.categoria?.Def_Requiere_Cant   ?? false,
        requiereTiempo: resolvedDef.categoria?.Def_Requiere_Tiempo ?? false,
        requiereHora:   resolvedDef.categoria?.Def_Requiere_Hora   ?? false,
      },
      rules:    resolvedDef.reglas    ?? [],
      perfilInit: resolvedDef.perfilInit ?? null,
      perfil:   resolvedDef.perfil    ?? null,
      categoria: resolvedDef.categoria ?? null,
      children: resolvedDef.children ?? [],
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
    this.mode = mode;
    this.definition = {
      ...(definition || {}),
      pricingProfile: { ...((definition || {}).pricingProfile || {}) },
      defaultQuantities: { ...((definition || {}).defaultQuantities || {}) },
      rules: [...((definition || {}).rules || [])],
      children: [...((definition || {}).children || [])]
    };
    this.externalContext = { ...(externalContext || {}) };
    this.overrides = { ...(overrides || {}) };
    this.userSetFields = new Set(userSetFields || []);

    this.rulesCoordinator = new RulesCoordinator('ITEM', this.definition.rules || [], this.definition.id ?? null);

    return this.calculate();
  }

  /**
   * Recompute full derived state after any mutation.
   * @returns {Item}
   */
  calculate() {
    const defaults = this.definition.defaultQuantities || {};
    const profile = normalizeProfile(this.definition.pricingProfile || {});
    const kind = detectPricingKind(profile);
    const initMode = detectInitializationMode(kind, defaults);
    const rate = rateForKind(profile, kind);
    const base = toNumber(profile.baseFijo, 0);

    const isAbsorbido = this.externalContext.kitContext?.tipoPrecio === 'ABSORBIDO';
    const effectiveRate = isAbsorbido ? 0 : rate;
    const effectiveBase = isAbsorbido ? 0 : base;

    const basketResolution = resolveBasketQuantity(
      kind,
      initMode,
      defaults,
      this.externalContext,
      this.overrides
    );

    const quantity = basketResolution.quantity;
    const total = (effectiveBase + quantity * effectiveRate);

    const quantities = {
      pax: kind === PricingKind.PAX ? quantity : 0,
      cantidad: kind === PricingKind.UNITS ? quantity : 0,
      duracionMin: kind === PricingKind.TIME ? quantity : 0
    };

    const schedule = resolveSchedule(this.externalContext, this.overrides);
    const horaFinMin = schedule.horaMin + quantities.duracionMin;

    this.rulesCoordinator.invalidateCache();
    this.ruleResult = this.rulesCoordinator.evaluate({
      item: {
        id:       this.definition.id,
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
    const lineRateLabelText = lineRateLabel(kind, initMode);

    this.derived = {
      profile,
      pricingKind: kind,
      initializationMode: initMode,
      rate,
      base,
      basketQuantity: quantity,
      total,
      unitDisplay: quantity > 0 ? (total / quantity) : total,
      isAbsorbido,
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
      comentarios: this.overrides.comentarios ?? '',
      showPaxControl: kind === PricingKind.PAX,
      showUnitsControl: kind === PricingKind.UNITS,
      showTimeControl: kind === PricingKind.TIME,
      userSetFields: [...this.userSetFields],
      isUserSetPax: this.userSetFields.has('pax'),
      isUserSetCantidad: this.userSetFields.has('cantidad'),
      isUserSetDuracion: this.userSetFields.has('duracionMin')
    };

    return this;
  }
}
