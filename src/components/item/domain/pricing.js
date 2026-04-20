/**
 * Bridge for pricing enums and detection.
 * Consumes from the shared @packages/pricing layer.
 */

export {
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
} from '../../../pricing/src/index.js';
