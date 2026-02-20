import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestActor,
  navigateToBasket,
  addItemToBasket,
  getContext,
  getCurrentWorkflowState,
} from '../helpers/actor_factory.js';

describe('Quotation Settings Sync', () => {
  let actor;

  beforeEach(() => {
    actor = createTestActor();
    navigateToBasket(actor, { paxGlobal: 25, fechaEvento: '2026-03-01', duracionDias: 3 });
  });

  describe('UPDATE_QUOTATION_SETTINGS event', () => {
    it('is accepted in basket state without changing state', () => {
      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 30 });
      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });

    it('persists paxGlobal to both quotation.paxGlobal and cotizacion.Pax_Global', () => {
      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 50 });
      const ctx = getContext(actor);
      expect(ctx.quotation.paxGlobal).toBe(50);
      expect(ctx.quotation.cotizacion.Pax_Global).toBe(50);
    });

    it('persists fechaEvento to cotizacion.Fecha_Evento', () => {
      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', fechaEvento: '2026-04-15' });
      const ctx = getContext(actor);
      expect(ctx.quotation.cotizacion.Fecha_Evento).toBe('2026-04-15');
    });

    it('persists duracionDias to cotizacion.Duracion_Dias', () => {
      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', duracionDias: 5 });
      const ctx = getContext(actor);
      expect(ctx.quotation.cotizacion.Duracion_Dias).toBe(5);
    });

    it('settings survive a subsequent ADD_ITEM snapshot', () => {
      actor.send({
        type: 'UPDATE_QUOTATION_SETTINGS',
        paxGlobal: 40,
        fechaEvento: '2026-05-01',
        duracionDias: 4,
      });
      addItemToBasket(actor, 'ITEM_SALON_FARIO');

      const ctx = getContext(actor);
      expect(ctx.quotation.paxGlobal).toBe(40);
      expect(ctx.quotation.cotizacion.Pax_Global).toBe(40);
      expect(ctx.quotation.cotizacion.Fecha_Evento).toBe('2026-05-01');
      expect(ctx.quotation.cotizacion.Duracion_Dias).toBe(4);
    });

    it('settings survive a subsequent REMOVE_ITEM snapshot', () => {
      addItemToBasket(actor, 'ITEM_SALON_FARIO');
      const ctx1 = getContext(actor);
      const lineId = ctx1.lineas[0].ID_Linea;

      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 60, duracionDias: 2 });
      actor.send({ type: 'REMOVE_ITEM', lineId });

      const ctx2 = getContext(actor);
      expect(ctx2.quotation.paxGlobal).toBe(60);
      expect(ctx2.quotation.cotizacion.Duracion_Dias).toBe(2);
    });

    it('recalculateExistingLines=false (default): existing line totals unchanged', () => {
      addItemToBasket(actor, 'ITEM_SALON_FARIO');
      const ctx1 = getContext(actor);
      const originalSubtotal = ctx1.totals.subtotal;

      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 100, recalculateExistingLines: false });

      const ctx2 = getContext(actor);
      expect(ctx2.totals.subtotal).toBe(originalSubtotal);
    });

    it('recalculateExistingLines=true: totals are recomputed deterministically', () => {
      addItemToBasket(actor, 'ITEM_COFFEE_INT');
      const ctx1 = getContext(actor);
      const originalSubtotal = ctx1.totals.subtotal;

      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 100, recalculateExistingLines: true });

      const ctx2 = getContext(actor);
      // With more pax, pax-based item total should change
      expect(ctx2.totals.subtotal).not.toBe(originalSubtotal);
      expect(ctx2.totals.subtotal).toBeGreaterThan(0);
    });
  });

  describe('ADD_ITEM with Dia and Hora overrides', () => {
    it('stores Dia and Hora in the created line', () => {
      actor.send({
        type: 'ADD_ITEM',
        itemId: 'ITEM_SALON_FARIO',
        overrides: { Dia: 2, Hora: '14:00' },
      });

      const ctx = getContext(actor);
      const line = ctx.lineas[0];
      expect(line.Dia).toBe(2);
      expect(line.Hora).toBe('14:00');
    });

    it('added item uses latest global pax after settings update', () => {
      actor.send({ type: 'UPDATE_QUOTATION_SETTINGS', paxGlobal: 75 });
      addItemToBasket(actor, 'ITEM_COFFEE_INT');

      const ctx = getContext(actor);
      expect(ctx.quotation.paxGlobal).toBe(75);
      expect(ctx.lineas.length).toBeGreaterThan(0);
    });

    it('Dia defaults to null when not provided', () => {
      addItemToBasket(actor, 'ITEM_SALON_FARIO');

      const ctx = getContext(actor);
      expect(ctx.lineas[0].Dia).toBeNull();
    });
  });

  describe('UPDATE_ITEM with Dia and Hora', () => {
    it('persists Dia and Hora in the updated line', () => {
      addItemToBasket(actor, 'ITEM_SALON_FARIO');
      const lineId = getContext(actor).lineas[0].ID_Linea;

      actor.send({ type: 'UPDATE_ITEM', lineId, overrides: { Dia: 3, Hora: '19:30' } });

      const line = getContext(actor).lineas.find(l => l.ID_Linea === lineId);
      expect(line.Dia).toBe(3);
      expect(line.Hora).toBe('19:30');
    });

    it('Dia and Hora survive subsequent ADD_ITEM and REMOVE_ITEM', () => {
      addItemToBasket(actor, 'ITEM_SALON_FARIO');
      const lineId = getContext(actor).lineas[0].ID_Linea;

      actor.send({ type: 'UPDATE_ITEM', lineId, overrides: { Dia: 2, Hora: '10:00' } });

      // Add a second item then remove it
      addItemToBasket(actor, 'ITEM_COFFEE_INT');
      const ctx2 = getContext(actor);
      const secondLineId = ctx2.lineas.find(l => l.ID_Linea !== lineId).ID_Linea;
      actor.send({ type: 'REMOVE_ITEM', lineId: secondLineId });

      const line = getContext(actor).lineas.find(l => l.ID_Linea === lineId);
      expect(line.Dia).toBe(2);
      expect(line.Hora).toBe('10:00');
    });

    it('partial update does not reset unrelated fields', () => {
      actor.send({
        type: 'ADD_ITEM',
        itemId: 'ITEM_SALON_FARIO',
        overrides: { Dia: 1, Hora: '09:00' },
      });
      const lineId = getContext(actor).lineas[0].ID_Linea;

      // Only update Hora
      actor.send({ type: 'UPDATE_ITEM', lineId, overrides: { Hora: '18:00' } });

      const line = getContext(actor).lineas.find(l => l.ID_Linea === lineId);
      expect(line.Dia).toBe(1); // unchanged
      expect(line.Hora).toBe('18:00'); // updated
    });
  });
});
