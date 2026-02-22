import { ItemLogic } from '../../../pricing/src/ItemLogic.js';
import { XStateInteractionBase } from './XStateInteractionBase.js';

export class ItemXStateInteraction extends XStateInteractionBase {
  /**
   * @param {import('../../../pricing/src/ItemLogic.js').ItemLogic} [logic]
   */
  constructor(logic = new ItemLogic()) {
    super(logic);
  }

  /**
   * Convert an XState context into a stateful ItemLogic instance.
   * @param {Object} context
   * @returns {ItemLogic}
   */
  asItem(context) {
    return ItemLogic.fromContext(context);
  }

  /**
   * Project context into UI/XState-consumable derived state.
   * @param {Object} context
   * @returns {Object}
   */
  project(context) {
    return this.asItem(context).toMachineContext();
  }

  /**
   * Reduce one event by delegating to ItemLogic mutators.
   * @param {Object} context
   * @param {Object} event
   * @returns {Object}
   */
  reduce(context, event) {
    const item = this.asItem(context);
    if (!event || !event.type) return item.toMachineContext();

    if (event.type === 'SET_MODE') return item.setMode(event.mode || 'catalog').toMachineContext();
    if (event.type === 'SET_EXTERNAL_CONTEXT') return item.setExternalContext(event.externalContext || {}).toMachineContext();
    if (event.type === 'SET_PROFILE_VALUE') return item.setProfileValue(event.key, event.value).toMachineContext();
    if (event.type === 'SET_DEFAULT_QUANTITY_VALUE') return item.setDefaultInitializationValue(event.key, event.value).toMachineContext();
    if (event.type === 'CLEAR_DEFAULT_QUANTITY_VALUE') return item.clearDefaultInitializationValue(event.key).toMachineContext();
    if (event.type === 'SET_OVERRIDE') return item.setOverride(event.key, event.value).toMachineContext();
    if (event.type === 'CLEAR_OVERRIDE') return item.clearOverride(event.key).toMachineContext();
    if (event.type === 'RESET_OVERRIDES') return item.resetOverrides().toMachineContext();

    return item.toMachineContext();
  }
}
