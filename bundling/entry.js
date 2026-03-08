import { createQuotationRuntime } from './createQuotationRuntime.js';
import { createQuotationFlowComponent } from './createQuotationFlowComponent.js';

export { createQuotationRuntime, createQuotationFlowComponent };

export const QuotationEngine = {
  createQuotationRuntime,
  createQuotationFlowComponent,
};

if (typeof window !== 'undefined') {
  window.QuotationEngine = QuotationEngine;
  if (typeof window.createQuotationFlowComponent !== 'function') {
    window.createQuotationFlowComponent = createQuotationFlowComponent;
  }
}
