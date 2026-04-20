
import { toNumber } from '../domain/pricing.js';
import { applyExclusiveDefaultMode } from '../domain/quantity.js';

/**
 * A factory function that creates an object containing the state mutation methods for an Item.
 * This is designed to be composed into the Item class.
 * @param {Item} item - The Item instance.
 * @returns {Object} An object with state mutation methods.
 */
export function createItemState(item) {
  return {
    /**
     * Set mode (catalog/basket) and recalculate.
     *
     * @param {'catalog'|'basket'} mode
     * @returns {Item}
     */
    setMode(mode = 'catalog') {
      item.mode = mode;
      return item.calculate();
    },

    /**
     * Merge external context values and recalculate.
     * External context includes paxGlobal, duracionMin, dia, hora from the event.
     *
     * @param {Object} patch
     * @returns {Item}
     */
    receiveContext(patch = {}) {
      item.externalContext = {
        ...item.externalContext,
        ...(patch || {})
      };
      return item.calculate();
    },

    /**
     * Set one override value and recalculate.
     * Overrides include pax, cantidad, duracionMin, dia, hora, comentarios.
     *
     * @param {string} key
     * @param {any} value
     * @returns {Item}
     */
    setOverride(key, value) {
      item.overrides = {
        ...item.overrides,
        [key]: value
      };
      // Track quantity fields as user-set (not comments or schedule)
      if (['pax', 'cantidad', 'duracionMin'].includes(key)) {
        item.userSetFields.add(key);
      }
      return item.calculate();
    },

    /**
     * Remove one override value and recalculate.
     *
     * @param {string} key
     * @returns {Item}
     */
    clearOverride(key) {
      const next = { ...item.overrides };
      delete next[key];
      item.overrides = next;
      item.userSetFields.delete(key);
      return item.calculate();
    },

    /**
     * Clear all overrides and recalculate.
     *
     * @returns {Item}
     */
    resetOverrides() {
      item.overrides = {};
      item.userSetFields = new Set();
      return item.calculate();
    },

    /**
     * Update one pricing profile field and recalculate.
     *
     * @param {string} key
     * @param {number|string} value
     * @returns {Item}
     */
    setProfileValue(key, value) {
      item.definition.pricingProfile = {
        ...(item.definition.pricingProfile || {}),
        [key]: toNumber(value, 0)
      };
      return item.calculate();
    },

    /**
     * Update one initialization field with exclusivity rules and recalculate.
     * Uses applyExclusiveDefaultMode to enforce only one mode per kind.
     *
     * @param {string} key
     * @param {number|string} value
     * @returns {Item}
     */
    setDefaultQuantity(key, value) {
      item.definition.defaultQuantities = applyExclusiveDefaultMode(
        item.definition.defaultQuantities || {},
        key,
        value
      );
      return item.calculate();
    },

    /**
     * Remove one initialization field and recalculate.
     *
     * @param {string} key
     * @returns {Item}
     */
    clearDefaultQuantity(key) {
      const next = { ...(item.definition.defaultQuantities || {}) };
      delete next[key];
      item.definition.defaultQuantities = next;
      return item.calculate();
    }
  };
}
