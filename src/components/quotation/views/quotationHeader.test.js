import { describe, expect, it } from 'vitest';
import { createQuotationHeader } from './QuotationHeader.js';

describe('QuotationHeader', () => {
  it('stores context and returns display object', () => {
    const header = createQuotationHeader({ clientName: 'Empresa A', pax: 80 });

    expect(header.toDisplayObject()).toMatchObject({ clientName: 'Empresa A', pax: 80 });
  });

  it('emits SAVE_CLICKED', () => {
    const header = createQuotationHeader();
    let called = false;
    header.on('SAVE_CLICKED', () => {
      called = true;
    });

    header.clickSave();

    expect(called).toBe(true);
  });
});
