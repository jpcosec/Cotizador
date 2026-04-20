/**
 * Bridge for pricing formatting.
 * Consumes from the shared @packages/pricing layer.
 */

export {
  money,
  formatCatalogTerms,
  policyHint,
  legendForBasket,
  profileHumanText,
  lineRateLabel
} from '../../../pricing/src/index.js';
