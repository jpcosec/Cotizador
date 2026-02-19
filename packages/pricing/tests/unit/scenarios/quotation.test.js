import { describe, it, expect, beforeEach } from 'vitest';
import { QuotationScenario } from '../../mock/Scenarios/Quotation.js';
import { EventBus } from '../../mock/Core/EventBus.js';
import { QuotationState, resetLineSeq } from '../../mock/Core/QuotationState.js';
import { AbstractEvent } from '../../mock/Core/AbstractEvent.js';

class TestEvent extends AbstractEvent {
  constructor(name) { super(name); }
}

describe('QuotationScenario step gating', () => {
  let bus;

  beforeEach(() => {
    resetLineSeq();
    const scenario = new QuotationScenario();
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    bus = new EventBus(scenario, state, {});
  });

  it('starts at init step', () => {
    expect(bus.scenario.currentStep.name).toBe('init');
  });

  it('allows LoadCatalog in init step', async () => {
    const result = await bus.dispatch(new TestEvent('LoadCatalog'));
    expect(result.errors).toHaveLength(0);
  });

  it('rejects AddItem in init step', async () => {
    const result = await bus.dispatch(new TestEvent('AddItem'));
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('not allowed');
  });

  it('allows AddItem in basket step', async () => {
    bus.scenario.advance(); // init -> basket
    const result = await bus.dispatch(new TestEvent('AddItem'));
    expect(result.errors).toHaveLength(0);
  });

  it('rejects SaveQuotation in basket step', async () => {
    bus.scenario.advance();
    const result = await bus.dispatch(new TestEvent('SaveQuotation'));
    expect(result.errors).toHaveLength(1);
  });

  it('allows Validate in finalization step', async () => {
    bus.scenario.advance();
    bus.scenario.advance();
    const result = await bus.dispatch(new TestEvent('Validate'));
    expect(result.errors).toHaveLength(0);
  });
});
