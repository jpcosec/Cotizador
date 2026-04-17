/**
 * Represents the internal state of an Item.
 *
 * @module ItemState
 */

/**
 * ItemState class holding all raw and derived data.
 */
export class ItemState {
  /**
   * Initialize default state.
   */
  constructor() {
    this.mode = 'catalog';
    this.definition = {
      pricingProfile: {},
      defaultQuantities: {},
      rules: [],
      children: []
    };
    this.externalContext = {};
    this.overrides = {};
    this.userSetFields = new Set();
    this.derived = {};
    this.ruleResult = null;
    this.rulesCoordinator = null;
  }
}
