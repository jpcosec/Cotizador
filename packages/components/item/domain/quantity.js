/**
 * Bridge for quantity resolution logic.
 * Consumes from the shared @packages/pricing layer.
 */

export {
  resolveContextQuantity,
  resolveBasketQuantity,
  applyExclusiveDefaultMode
} from '../../../pricing/src/index.js';
