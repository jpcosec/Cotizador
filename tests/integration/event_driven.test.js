import { describe, it, expect } from 'vitest';
import { createEventBus } from '../helpers/event_bus_factory.js';
import { LoadCatalog } from '../../src/Events/quotation/init/LoadCatalog.js';
import { CreateQuotation } from '../../src/Events/quotation/init/CreateQuotation.js';
import { AddItem } from '../../src/Events/quotation/basket/AddItem.js';
import { ChangePax } from '../../src/Events/quotation/basket/ChangePax.js';
import { Recalculate } from '../../src/Events/quotation/basket/Recalculate.js';
import { Validate } from '../../src/Events/quotation/finalization/Validate.js';
import { AdvanceStep } from '../../src/Events/quotation/AdvanceStep.js';

describe('Integration: Corporate Seminar (25 pax, EventBus)', () => {
  const bus = createEventBus({ paxGlobal: 25, clienteId: 'CLI_CORP' });
  const state = bus.state;

  it('1. initial state → empty, total=0', () => {
    expect(state.lineas).toHaveLength(0);
    expect(state.totals.total).toBe(0);
  });

  it('2. advance to basket', async () => {
    const result = await bus.dispatch(new AdvanceStep({ _bus: bus }));
    expect(result.errors).toHaveLength(0);
    expect(bus.scenario.currentStep.name).toBe('basket');
  });

  it('3. addItem(Salon Chinook) → subtotal=385,000', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_CHINOOK' }));
    expect(state.totals.subtotal).toBe(385000);
  });

  it('4. addItem(Coffee Basic) → subtotal=544,500', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }));
    expect(state.totals.subtotal).toBe(385000 + 6380 * 25);
  });

  it('5. addItem(Almuerzo) → subtotal updated', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_ALMUERZO' }));
    expect(state.totals.subtotal).toBe(385000 + 6380 * 25 + 27311 * 25);
  });

  it('6. recalculate with taxes → total = subtotal × 1.19', async () => {
    await bus.dispatch(new Recalculate());
    const expected = 385000 + 6380 * 25 + 27311 * 25;
    expect(state.totals.subtotal).toBe(expected);
    expect(state.totals.total).toBeCloseTo(expected * 1.19, 0);
  });

  it('7. changePax(50) → coffee + almuerzo recalculated, salon unchanged', async () => {
    await bus.dispatch(new ChangePax({ paxGlobal: 50 }));

    expect(state.lineas[0]._netoBase).toBe(385000);
    expect(state.lineas[1]._pax).toBe(50);
    expect(state.lineas[1]._netoBase).toBe(6380 * 50);
    expect(state.lineas[2]._pax).toBe(50);
    expect(state.lineas[2]._netoBase).toBe(27311 * 50);

    const expected = 385000 + 6380 * 50 + 27311 * 50;
    expect(state.totals.subtotal).toBe(expected);
    expect(state.totals.total).toBeCloseTo(expected * 1.19, 0);
  });

  it('8. event history tracks all actions', () => {
    const history = bus.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(5);
    expect(history.map(h => h.event)).toContain('AddItem');
    expect(history.map(h => h.event)).toContain('ChangePax');
  });
});

describe('Integration: Wedding (80 pax, overtime + composition, EventBus)', () => {
  const bus = createEventBus({ paxGlobal: 80, clienteId: 'CLI_WEDDING' });
  const state = bus.state;

  it('1. initial state → 80 pax, empty', () => {
    expect(state.paxGlobal).toBe(80);
    expect(state.lineas).toHaveLength(0);
  });

  it('2. advance to basket + addItem(Salon Chinook, Override_Duracion=600)', async () => {
    await bus.dispatch(new AdvanceStep({ _bus: bus }));
    await bus.dispatch(new AddItem({ itemId: 'ITEM_CHINOOK', overrides: { Override_Duracion_Min: 600 } }));
    expect(state.lineas[0]._duracionMin).toBe(600);
  });

  it('3. addItem(Coffee Break Pack) → expands to 3 children', async () => {
    await bus.dispatch(new AddItem({ itemId: 'PACK_COFFEE_COMPLETO' }));
    expect(state.lineas).toHaveLength(4);
    expect(state.lineas.filter(l => l._source === 'COMPOSITION')).toHaveLength(3);
  });

  it('4. addItem(DJ large) → fixed price', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_DJ_LARGE' }));
    expect(state.lineas).toHaveLength(5);
    expect(state.lineas[4]._netoBase).toBe(1200000);
  });

  it('5. addItem(Ticket Cerveza) → auto-qty from 80 pax', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_TICKET_CERVEZA' }));
    const cerveza = state.lineas[5];
    expect(cerveza._pax).toBe(80);
    expect(cerveza._cantidad).toBe(40);
    expect(cerveza._netoBase).toBe(3529 * 40);
  });

  it('6. addItem(Caminata) → base + per pax', async () => {
    await bus.dispatch(new AddItem({ itemId: 'ITEM_CAMINATA' }));
    const caminata = state.lineas[6];
    expect(caminata._netoBase).toBe(300000 + 10000 * 80);
  });

  it('7. recalculate → overtime applied, pack expanded, IVA on total', async () => {
    await bus.dispatch(new Recalculate());

    const salon = state.lineas[0];
    expect(salon._ajustes).toHaveLength(1);
    expect(salon._netoAjustado).toBe(385000 * 1.25);

    const coffees = state.lineas.filter(l => l._source === 'COMPOSITION');
    expect(coffees).toHaveLength(3);

    expect(state.totals.taxes).toHaveLength(1);
    expect(state.totals.taxes[0].name).toBe('IVA');
    expect(state.totals.total).toBeGreaterThan(state.totals.subtotal);
    expect(state.totals.total).toBeCloseTo(state.totals.subtotal * 1.19, 0);
  });

  it('8. advance to finalization → validate passes', async () => {
    await bus.dispatch(new AdvanceStep({ _bus: bus }));
    expect(bus.scenario.currentStep.name).toBe('finalization');

    const result = await bus.dispatch(new Validate());
    expect(result.errors).toHaveLength(0);
  });
});
