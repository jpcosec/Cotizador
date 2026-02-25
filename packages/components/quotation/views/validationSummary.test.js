import { describe, expect, it } from 'vitest';
import { createValidationSummary } from './ValidationSummary.js';

describe('ValidationSummary', () => {
  it('emits SUMMARY_CONFIRMED with lines', () => {
    const summary = createValidationSummary([{ id: 'L1' }]);
    let payload = null;
    summary.on('SUMMARY_CONFIRMED', (event) => {
      payload = event;
    });

    summary.confirm();

    expect(payload).toEqual({ lines: [{ id: 'L1' }] });
  });
});
