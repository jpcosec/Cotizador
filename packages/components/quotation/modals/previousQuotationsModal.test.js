import { describe, expect, it } from 'vitest';
import { createPreviousQuotationsModal } from './PreviousQuotationsModal.js';

describe('PreviousQuotationsModal', () => {
  const quotations = [
    { id: 'Q-1', cliente: 'Empresa A' },
    { id: 'Q-2', cliente: 'Empresa B' }
  ];

  it('filters quotations by search term', () => {
    const modal = createPreviousQuotationsModal(quotations);

    modal.search('empresa a');

    expect(modal.getFilteredQuotations()).toHaveLength(1);
  });

  it('emits QUOTATION_SELECTED on selection', () => {
    const modal = createPreviousQuotationsModal(quotations);
    let selected = null;
    modal.on('QUOTATION_SELECTED', (quotation) => {
      selected = quotation;
    });

    modal.selectQuotation('Q-2');

    expect(selected.id).toBe('Q-2');
  });
});
