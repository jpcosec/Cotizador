import { describe, expect, it, vi } from 'vitest';
import { createGlobalVariablesForm } from './GlobalVariablesForm.js';

describe('GlobalVariablesForm', () => {
  it('emits GLOBAL_VARIABLES_SUBMITTED on valid submit', async () => {
    const form = createGlobalVariablesForm({ pax: 20, fecha: '2026-03-20', duracion: 2 });
    const handler = vi.fn();
    form.on('GLOBAL_VARIABLES_SUBMITTED', handler);

    await form.submit();

    expect(handler).toHaveBeenCalledWith({ pax: 20, fecha: '2026-03-20', duracion: 2 });
  });

  it('includes mode in display object', () => {
    const form = createGlobalVariablesForm();

    expect(form.toDisplayObject().mode).toBe('GLOBAL_VARIABLES');
  });
});
