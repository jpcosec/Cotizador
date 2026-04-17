
import { PricingKind } from '../domain/pricing.js';

/**
 * A factory function that creates an object containing the projection getters for an Item.
 * This is designed to be composed into the Item class.
 * @param {Item} item - The Item instance.
 * @returns {Object} An object with projection getters.
 */
export function createItemProjections(item) {
  return {
    /**
     * Get current mode (catalog or basket).
     * @returns {'catalog'|'basket'}
     */
    get mode() {
      return item.mode;
    },

    /**
     * Get current definition.
     * @returns {Object}
     */
    get definition() {
      return item.definition;
    },

    /**
     * Get current external context.
     * @returns {Object}
     */
    get externalContext() {
      return item.externalContext;
    },

    /**
     * Get current overrides.
     * @returns {Object}
     */
    get overrides() {
      return item.overrides;
    },

    /**
     * Get the detected pricing kind.
     * @returns {PricingKind}
     */
    get pricingKind() {
      return item.derived.pricingKind;
    },

    /**
     * Get the computed total price.
     * @returns {number}
     */
    get total() {
      return item.derived.total;
    },

    /**
     * Get whether the quantity is user-overridden.
     * @returns {boolean}
     */
    get isOverridden() {
      return item.derived.isOverridden;
    },

    /**
     * Get quantities object with pax, cantidad, duracionMin.
     * @returns {Object}
     */
    get quantities() {
      return item.derived.quantities;
    },

    /**
     * Get schedule object with dia and hora.
     * @returns {Object}
     */
    get schedule() {
      return item.derived.schedule;
    },

    /**
     * Get the rules array for this item.
     * @returns {Array}
     */
    get rules() {
      return item.definition.rules || [];
    },

    /**
     * Get the children array for this item (if it is a kit).
     * @returns {Array}
     */
    get children() {
      return item.definition.children || [];
    },

    /**
     * Projection for catalog card rendering.
     * Includes pricing formula, description, and category.
     *
     * @returns {Object}
     */
    get catalogCard() {
      return {
        ID_Item: item.definition.id ?? 'ITEM_UNKNOWN',
        Nombre: item.definition.name,
        Precio_Calculado_Default: item.derived.catalogDisaggregated,
        Precio_Por_Cantidad: item.derived.pricingHumanText,
        InitPolicyHuman: item.derived.policyHintText,
        detalle: `${item.definition.description || ''}
${item.derived.catalogDisaggregated}`,
        categoria: item.definition.category
      };
    },

    /**
     * Projection for basket line rendering.
     * Includes schedule, quantities, pricing details, and availability.
     *
     * @returns {Object}
     */
    get basketLine() {
      return {
        id: item.definition.id ?? 'ITEM_UNKNOWN',
        lineId: null,
        itemId: item.definition.id ?? 'ITEM_UNKNOWN',
        nombre: item.definition.name,
        descripcion: item.definition.description,
        categoria: item.definition.category,
        hora: item.derived.schedule.hora,
        horaMin: item.derived.schedule.horaMin,
        horaFinMin: item.derived.schedule.horaMin + item.derived.quantities.duracionMin,
        dia: item.derived.schedule.dia,
        comentarios: item.derived.comentarios,
        pax: item.derived.quantities.pax,
        cantidad: item.derived.quantities.cantidad,
        duracionMin: item.derived.quantities.duracionMin,
        precio: item.derived.unitDisplay,
        baseFijo: item.derived.base,
        rateLabel: item.derived.lineRateLabel,
        rateValue: item.derived.pricingKind === PricingKind.NONE
          ? item.derived.base
          : item.derived.rate,
        rateSubtotal: item.derived.lineRateSubtotal,
        pricingKind: item.derived.pricingKind,
        basketLegend: item.derived.basketLegendText,
        isOverridden: item.derived.isOverridden,
        isAbsorbido: item.derived.isAbsorbido,
        showPaxControl: item.derived.showPaxControl,
        showUnitsControl: item.derived.showUnitsControl,
        showTimeControl: item.derived.showTimeControl,
        total: item.derived.total,
        children: item.definition.children || []
      };
    },

    /**
     * Full projection consumed by XState context / Alpine bridge.
     * @returns {Object}
     */
    toDisplayObject() {
      const catalogCard = this.catalogCard;
      const basketLine = this.basketLine;

      return {
        mode: item.mode,
        definition: item.definition,
        externalContext: item.externalContext,
        overrides: item.overrides,
        catalogCard,
        basketLine,
        profile: item.derived.profile,
        quantities: item.derived.quantities,
        schedule: item.derived.schedule,
        comentarios: item.derived.comentarios,
        pricingKind: item.derived.pricingKind,
        initializationMode: item.derived.initializationMode,
        pricingHuman: item.derived.pricingHumanText,
        pricingPerQuantityHuman: item.derived.catalogDisaggregated,
        total: item.derived.total,
        catalogPriceDisaggregated: item.derived.catalogDisaggregated,
        catalogFormulaHuman: item.derived.catalogDisaggregated,
        initPolicyHuman: item.derived.policyHintText,
        basketLegend: item.derived.basketLegendText,
        isOverridden: item.derived.isOverridden,
        isAbsorbido: item.derived.isAbsorbido,
        lineRateLabel: item.derived.lineRateLabel,
        lineRateValue: item.derived.pricingKind === PricingKind.NONE
          ? item.derived.base
          : item.derived.rate,
        lineRateSubtotal: item.derived.lineRateSubtotal,
        lineBaseValue: item.derived.pricingKind === PricingKind.NONE
          ? 0
          : item.derived.base,
        unitDisplay: item.derived.unitDisplay,
        showPaxControl: item.derived.showPaxControl,
        showUnitsControl: item.derived.showUnitsControl,
        showTimeControl: item.derived.showTimeControl,
        userSetFields: item.derived.userSetFields,
        isUserSetPax: item.derived.isUserSetPax,
        isUserSetCantidad: item.derived.isUserSetCantidad,
        isUserSetDuracion: item.derived.isUserSetDuracion,
        appliedRules: item.ruleResult?.appliedRules || [],
        ruleErrors: item.ruleResult?.errors || [],
        ruleWarnings: item.ruleResult?.warnings || [],
        available: item.ruleResult?.available ?? true,
        showPax: item.definition.defaultQuantities?.requierePax ?? false,
        showCantidad: item.definition.defaultQuantities?.requiereCant ?? false,
        showDuracion: item.definition.defaultQuantities?.requiereTiempo ?? false,
        showHora: item.definition.defaultQuantities?.requiereHora ?? false,
        perfil: item.definition.perfil ?? null,
        perfilInit: item.definition.perfilInit ?? null,
        categoria: item.definition.categoria ?? null,
        children: item.definition.children ?? [],
      };
    },

    /**
     * Serialize state to a seed for persistence or transmission.
     * @returns {Object}
     */
    toSeed() {
      return {
        mode: item.mode,
        definition: item.definition,
        externalContext: item.externalContext,
        overrides: item.overrides,
        userSetFields: [...item.userSetFields]
      };
    }
  };
}
