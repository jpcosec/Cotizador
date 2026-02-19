import { describe, it, expect, beforeEach } from 'vitest';
import { AdvanceStep } from '../../../mock/Events/quotation/AdvanceStep.js';
import { EventBus } from '../../../mock/Core/EventBus.js';
import { AbstractScenario } from '../../../mock/Core/AbstractScenario.js';
import { QuotationState, resetLineSeq } from '../../../mock/Core/QuotationState.js';

const steps = [
  { name: 'init', allows: ['LoadCatalog', 'CreateQuotation'] },
  { name: 'basket', allows: ['AddItem', 'ChangePax', 'Recalculate'] },
  { name: 'finalization', allows: ['Validate', 'SaveQuotation'] },
];

describe('AdvanceStep', () => {
  beforeEach(() => resetLineSeq());

  it('advances to next step via EventBus', async () => {
    const scenario = new AbstractScenario('Quotation', steps);
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    const bus = new EventBus(scenario, state, {});

    const result = await bus.dispatch(new AdvanceStep({ _bus: bus }));
    expect(result.errors).toHaveLength(0);
    expect(scenario.currentStep.name).toBe('basket');
  });

  it('can jump backwards', async () => {
    const scenario = new AbstractScenario('Quotation', steps);
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    const bus = new EventBus(scenario, state, {});

    await bus.dispatch(new AdvanceStep({ _bus: bus })); // init -> basket
    await bus.dispatch(new AdvanceStep({ _bus: bus })); // basket -> finalization

    const result = await bus.dispatch(new AdvanceStep({ target: 'basket', _bus: bus }));
    expect(result.errors).toHaveLength(0);
    expect(scenario.currentStep.name).toBe('basket');
  });

  it('fails at last step without target', async () => {
    const scenario = new AbstractScenario('Quotation', steps);
    const state = new QuotationState({ paxGlobal: 10, cotizacionId: 'COT_1' });
    const bus = new EventBus(scenario, state, {});

    await bus.dispatch(new AdvanceStep({ _bus: bus }));
    await bus.dispatch(new AdvanceStep({ _bus: bus }));
    const result = await bus.dispatch(new AdvanceStep({ _bus: bus }));
    expect(result.errors).toHaveLength(1);
  });
});
