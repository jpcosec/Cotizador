import { describe, it, expect } from 'vitest';
import { EventBus } from '../../../mock/Core/EventBus.js';
import { AbstractEvent } from '../../../mock/Core/AbstractEvent.js';
import { AbstractScenario } from '../../../mock/Core/AbstractScenario.js';
import { QuotationState, resetLineSeq } from '../../../mock/Core/QuotationState.js';

class SetValueEvent extends AbstractEvent {
  constructor(value) {
    super('SetValue', { value });
  }
  async execute(ctx) {
    ctx.state.paxGlobal = this.payload.value;
    this.addMessage('INFO', 'Pax updated');
  }
}

class DisallowedEvent extends AbstractEvent {
  constructor() { super('AddItem'); }
}

const steps = [
  { name: 'init', allows: ['SetValue'] },
  { name: 'basket', allows: ['AddItem'] },
];

describe('EventBus', () => {
  it('dispatches allowed events, updates state, and logs history', async () => {
    resetLineSeq();
    const scenario = new AbstractScenario('Test', steps);
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    const bus = new EventBus(scenario, state, {});

    const result = await bus.dispatch(new SetValueEvent(50));

    expect(result.errors).toHaveLength(0);
    expect(bus.state.paxGlobal).toBe(50);
    expect(bus.getHistory()).toHaveLength(1);
    expect(bus.getHistory()[0].event).toBe('SetValue');
  });

  it('rejects events not allowed in current step', async () => {
    resetLineSeq();
    const scenario = new AbstractScenario('Test', steps);
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    const bus = new EventBus(scenario, state, {});

    const result = await bus.dispatch(new DisallowedEvent());

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('not allowed');
  });
});
