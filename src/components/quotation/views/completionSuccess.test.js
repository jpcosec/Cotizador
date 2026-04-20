import { describe, expect, it } from 'vitest';
import { createCompletionSuccess } from './CompletionSuccess.js';

describe('CompletionSuccess', () => {
  it('returns message in display object', () => {
    const success = createCompletionSuccess('Done');

    expect(success.toDisplayObject()).toEqual({ message: 'Done' });
  });

  it('emits RESTART action', () => {
    const success = createCompletionSuccess();
    let called = false;
    success.on('RESTART', () => {
      called = true;
    });

    success.restart();

    expect(called).toBe(true);
  });
});
