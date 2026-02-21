import { InitializationMode, ItemLogic, PricingKind } from './ItemLogic.js';

const logic = new ItemLogic();

export { ItemLogic, PricingKind, InitializationMode };

export function normalizeProfile(raw = {}) {
  return logic.normalizeProfile(raw);
}

export function detectPricingKind(profile) {
  return logic.detectPricingKind(profile);
}

export function detectInitializationMode(kind, defaults = {}) {
  return logic.detectInitializationMode(kind, defaults);
}

export function evaluateItemPricing(input) {
  return logic.evaluate(input);
}

export function applyExclusiveDefaultMode(defaultQuantities = {}, key, rawValue) {
  return logic.applyExclusiveDefaultMode(defaultQuantities, key, rawValue);
}
