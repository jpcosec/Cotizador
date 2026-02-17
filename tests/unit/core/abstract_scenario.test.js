import { describe, it, expect } from 'vitest';
import { AbstractScenario } from '../../../src/Core/AbstractScenario.js';

const steps = [
  { name: 'init', allows: ['LoadCatalog', 'CreateQuotation'] },
  { name: 'basket', allows: ['AddItem', 'RemoveItem', 'ChangePax'] },
  { name: 'finalization', allows: ['Validate', 'SaveQuotation'] },
];

describe('AbstractScenario', () => {
  it('starts at first step', () => {
    const s = new AbstractScenario('Test', steps);
    expect(s.currentStep.name).toBe('init');
  });

  it('canDispatch returns true for allowed events', () => {
    const s = new AbstractScenario('Test', steps);
    expect(s.canDispatch('LoadCatalog')).toBe(true);
    expect(s.canDispatch('AddItem')).toBe(false);
  });

  it('AdvanceStep is always allowed', () => {
    const s = new AbstractScenario('Test', steps);
    expect(s.canDispatch('AdvanceStep')).toBe(true);
  });

  it('advance() moves to next step', () => {
    const s = new AbstractScenario('Test', steps);
    const result = s.advance();
    expect(result.ok).toBe(true);
    expect(s.currentStep.name).toBe('basket');
  });

  it('advance() fails at last step', () => {
    const s = new AbstractScenario('Test', steps);
    s.advance();
    s.advance();
    const result = s.advance();
    expect(result.ok).toBe(false);
  });

  it('advance(target) jumps to named step', () => {
    const s = new AbstractScenario('Test', steps);
    s.advance();
    s.advance();
    const result = s.advance('basket');
    expect(result.ok).toBe(true);
    expect(s.currentStep.name).toBe('basket');
  });

  it('advance(target) with unknown step returns error', () => {
    const s = new AbstractScenario('Test', steps);
    const result = s.advance('nonexistent');
    expect(result.ok).toBe(false);
  });

  it('reset() goes back to first step', () => {
    const s = new AbstractScenario('Test', steps);
    s.advance();
    s.reset();
    expect(s.currentStep.name).toBe('init');
  });
});
