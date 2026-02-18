import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestActor,
  navigateToBasket,
  addItemToBasket,
  getCurrentWorkflowState,
  getCurrentDatabaseState,
  getContext,
} from '../helpers/actor_factory.js';

describe('State Machine Transitions', () => {
  let actor;

  beforeEach(() => {
    actor = createTestActor();
  });

  describe('Initial State', () => {
    it('starts in browse state', () => {
      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toBe('browse');
      expect(state.database_management).toBe('closed');
    });

    it('context is empty initially', () => {
      const ctx = getContext(actor);
      expect(ctx.quotation).toBeNull();
      expect(ctx.lineas).toEqual([]);
      expect(ctx.totals.subtotal).toBe(0);
      expect(ctx.errors).toEqual([]);
    });
  });

  describe('Browse → Initialize Transitions', () => {
    it('START_NEW_QUOTATION transitions to initialize.chooseSource', () => {
      actor.send({ type: 'START_NEW_QUOTATION' });
      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: { initialize: 'chooseSource' } });
    });

    it('CREATE_NEW from chooseSource transitions to creatingNew', () => {
      actor.send({ type: 'START_NEW_QUOTATION' });
      actor.send({ type: 'CREATE_NEW' });
      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: { initialize: 'creatingNew' } });
    });

    it('LOAD_PREVIOUS from chooseSource transitions to loadingPrevious', () => {
      actor.send({ type: 'START_NEW_QUOTATION' });
      actor.send({ type: 'LOAD_PREVIOUS' });
      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: { initialize: 'loadingPrevious' } });
    });
  });

  describe('Initialize → Basket Transitions', () => {
    it('QUOTATION_INITIALIZED transitions from creatingNew to basket', () => {
      actor.send({ type: 'START_NEW_QUOTATION' });
      actor.send({ type: 'CREATE_NEW' });
      actor.send({
        type: 'QUOTATION_INITIALIZED',
        paxGlobal: 25,
        clienteId: 'CLI_CORP',
        fechaEvento: '2025-06-15',
        duracionDias: 1,
      });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });

    it('QUOTATION_INITIALIZED sets quotation context', () => {
      navigateToBasket(actor, {
        paxGlobal: 50,
        clienteId: 'CLI_WEDDING',
        fechaEvento: '2025-12-20',
        duracionDias: 2,
      });

      const ctx = getContext(actor);
      expect(ctx.quotation).not.toBeNull();
      expect(ctx.quotation.paxGlobal).toBe(50);
      expect(ctx.quotation.cotizacion.ID_Cliente).toBe('CLI_WEDDING');
      expect(ctx.quotation.cotizacion.Pax_Global).toBe(50);
    });
  });

  describe('Basket Mutations', () => {
    beforeEach(() => {
      navigateToBasket(actor, { paxGlobal: 25 });
    });

    it('ADD_ITEM adds line to basket', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');

      const ctx = getContext(actor);
      expect(ctx.lineas.length).toBeGreaterThan(0);
      expect(ctx.lineas[0].ID_Item).toBe('ITEM_CHINOOK');
    });

    it('ADD_ITEM updates totals', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');

      const ctx = getContext(actor);
      expect(ctx.totals.subtotal).toBeGreaterThan(0);
      expect(ctx.totals.total).toBeGreaterThan(ctx.totals.subtotal); // with IVA
    });

    it('multiple ADD_ITEM calls accumulate', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      addItemToBasket(actor, 'ITEM_COFFEE_BASIC');
      addItemToBasket(actor, 'ITEM_ALMUERZO');

      const ctx = getContext(actor);
      expect(ctx.lineas.length).toBe(3);
      expect(ctx.totals.subtotal).toBeGreaterThan(0);
    });

    it('ADD_ITEM in basket stays in basket', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });

    it('UPDATE_ITEM mutates existing line', () => {
      addItemToBasket(actor, 'ITEM_COFFEE_BASIC'); // Pax-based pricing
      const ctx1 = getContext(actor);
      const lineId = ctx1.lineas[0].ID_Linea;
      const originalPrice = ctx1.totals.subtotal;

      actor.send({
        type: 'UPDATE_ITEM',
        lineId,
        overrides: { Override_Pax: 50 }, // Change from default 25 to 50
      });

      const ctx2 = getContext(actor);
      // Line should still exist and be updated
      const updatedLine = ctx2.lineas.find(l => l.ID_Linea === lineId);
      expect(updatedLine).toBeDefined();
      expect(updatedLine.Override_Pax).toBe(50);
      // Total should be recalculated (likely changed due to pax override)
      expect(ctx2.totals).toBeDefined();
    });

    it('REMOVE_ITEM soft-deletes line', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      const ctx1 = getContext(actor);
      const lineId = ctx1.lineas[0].ID_Linea;

      actor.send({ type: 'REMOVE_ITEM', lineId });

      const ctx2 = getContext(actor);
      // Line should still exist but marked as removed
      const removedLine = ctx2.lineas.find(l => l.ID_Linea === lineId);
      expect(removedLine._removed).toBe(true);
    });

    it('REMOVE_ITEM recalculates totals (excludes removed)', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      const ctx1 = getContext(actor);
      const lineId = ctx1.lineas[0].ID_Linea;
      const priceWithItem = ctx1.totals.subtotal;

      actor.send({ type: 'REMOVE_ITEM', lineId });

      const ctx2 = getContext(actor);
      expect(ctx2.totals.subtotal).toBeLessThan(priceWithItem);
    });
  });

  describe('Basket → Validation Transitions', () => {
    beforeEach(() => {
      navigateToBasket(actor, { paxGlobal: 25 });
    });

    it('ADVANCE_TO_VALIDATION blocked without items', () => {
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });

      // Should still be in basket (guard blocked)
      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });

    it('ADVANCE_TO_VALIDATION allowed with items', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'validation' });
    });

    it('ADVANCE_TO_VALIDATION blocked with blocking errors', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      // Inject blocking error
      const ctx = actor.getSnapshot().context;
      ctx.errors = [{ blocking: true, message: 'test error' }];

      actor.send({ type: 'ADVANCE_TO_VALIDATION' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });

    it('ADVANCE_TO_VALIDATION allowed with non-blocking errors', () => {
      addItemToBasket(actor, 'ITEM_CHINOOK');
      // Inject non-blocking error
      const ctx = actor.getSnapshot().context;
      ctx.errors = [{ blocking: false, message: 'warning' }];

      actor.send({ type: 'ADVANCE_TO_VALIDATION' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'validation' });
    });
  });

  describe('Validation → Completed Transitions', () => {
    beforeEach(() => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });
    });

    it('VALIDATE_AND_SAVE transitions to completed', () => {
      actor.send({ type: 'VALIDATE_AND_SAVE' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'completed' });
    });

    it('VALIDATE_AND_SAVE marks quotation as Guardada', () => {
      actor.send({ type: 'VALIDATE_AND_SAVE' });

      const ctx = getContext(actor);
      expect(ctx.quotation.cotizacion.Estado).toBe('Guardada');
    });

    it('BACK_TO_BASKET from validation returns to basket', () => {
      actor.send({ type: 'BACK_TO_BASKET' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toEqual({ quotation: 'basket' });
    });
  });

  describe('Return to Browse', () => {
    it('RETURN_TO_BROWSE from basket clears context', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      const ctx1 = getContext(actor);
      expect(ctx1.quotation).not.toBeNull();

      actor.send({ type: 'RETURN_TO_BROWSE' });

      const ctx2 = getContext(actor);
      expect(ctx2.quotation).toBeNull();
      expect(ctx2.lineas).toEqual([]);
    });

    it('RETURN_TO_BROWSE from completed returns to browse', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });
      actor.send({ type: 'VALIDATE_AND_SAVE' });

      actor.send({ type: 'RETURN_TO_BROWSE' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toBe('browse');
    });

    it('RETURN_TO_BROWSE from basket returns to browse', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      actor.send({ type: 'RETURN_TO_BROWSE' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toBe('browse');
    });
  });

  describe('Guard Enforcement', () => {
    it('ADD_ITEM blocked in browse state', () => {
      actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_CHINOOK' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toBe('browse');

      const ctx = getContext(actor);
      expect(ctx.lineas).toEqual([]);
    });

    it('UPDATE_ITEM blocked in browse state', () => {
      actor.send({ type: 'UPDATE_ITEM', lineId: 'LIN_1', overrides: {} });

      const state = getCurrentWorkflowState(actor);
      expect(state).toBe('browse');
    });

    it('REMOVE_ITEM blocked in browse state', () => {
      actor.send({ type: 'REMOVE_ITEM', lineId: 'LIN_1' });

      const state = getCurrentWorkflowState(actor);
      expect(state).toBe('browse');
    });
  });
});
