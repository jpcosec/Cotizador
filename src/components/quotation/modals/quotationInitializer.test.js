import { describe, expect, it, vi } from 'vitest';
import { createQuotationInitializer } from './QuotationInitializer.js';

describe('QuotationInitializer', () => {
  it('validates required fields', () => {
    const modal = createQuotationInitializer({ pax: 0, fecha: '', duracion: 0 });

    const result = modal.validate();

    expect(result).toEqual(['pax', 'fecha', 'duracion']);
    expect(modal.hasErrors()).toBe(true);
  });

  it('emits FORM_SUBMITTED after valid submit', async () => {
    const modal = createQuotationInitializer({ pax: 50, fecha: '2026-03-20', duracion: 2 });
    const emitted = vi.fn();
    modal.on('FORM_SUBMITTED', emitted);

    await modal.submit();

    expect(emitted).toHaveBeenCalledWith({ pax: 50, fecha: '2026-03-20', duracion: 2 });
  });

  it('uses preloader service when available', async () => {
    const load = vi.fn(async () => {});
    const preloader = {
      isReady: () => false,
      load
    };
    const modal = createQuotationInitializer({ pax: 10, fecha: '2026-03-20', duracion: 1 });
    modal.injectService('databasePreloader', preloader);

    await modal.submit();

    expect(load).toHaveBeenCalledTimes(1);
  });
});
