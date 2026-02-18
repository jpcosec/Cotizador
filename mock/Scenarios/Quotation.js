import { AbstractScenario } from '../Core/AbstractScenario.js';

const STEPS = [
  {
    name: 'init',
    allows: ['LoadCatalog', 'CreateQuotation'],
  },
  {
    name: 'basket',
    allows: [
      'AddItem', 'UpdateItem', 'RemoveItem',
      'ChangePax', 'Recalculate',
      'ApplyDiscount', 'OverridePrice', 'AddSurcharge',
    ],
  },
  {
    name: 'finalization',
    allows: ['Validate', 'SaveQuotation', 'SendQuotation'],
  },
];

export class QuotationScenario extends AbstractScenario {
  constructor() {
    super('Quotation', STEPS);
  }
}
