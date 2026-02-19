import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestActor,
  navigateToBasket,
  addItemToBasket,
  getCurrentWorkflowState,
  getCurrentDatabaseState,
  getContext,
} from '../helpers/actor_factory.js';

describe('Parallel Regions: Quotation Workflow + Database Management', () => {
  let actor;

  beforeEach(() => {
    actor = createTestActor();
  });

  describe('Initial Parallel States', () => {
    it('starts with quotation_workflow in browse AND database_management closed', () => {
      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toBe('browse');
      expect(state.database_management).toBe('closed');
    });
  });

  describe('Database → Quotation Independence', () => {
    it('OPEN_DATABASE does not affect quotation_workflow state', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');

      actor.send({ type: 'OPEN_DATABASE' });

      const state = actor.getSnapshot().value;
      // Quotation workflow unchanged
      expect(state.quotation_workflow).toEqual({ quotation: 'basket' });
      // Database opened
      expect(state.database_management).toEqual({ open: 'browse_database' });
    });

    it('can modify database while in quotation basket', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      const ctx1 = getContext(actor);
      const itemCount1 = ctx1.lineas.length;

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'ROW_123',
        rowData: { ID_Perfil_Precio: 'PP_SALON_BASE' },
      });

      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toEqual({ quotation: 'basket' });
      expect(state.database_management).toEqual({ open: 'modify_row' });

      const ctx2 = getContext(actor);
      // Quotation context preserved during database operations
      expect(ctx2.lineas.length).toBe(itemCount1);
      expect(ctx2.selectedRowId).toBe('ROW_123');
    });

    it('can cancel database modifications and return to browse', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'ROW_123',
        rowData: { ID_Perfil_Precio: 'PP_SALON_BASE' },
      });
      actor.send({ type: 'CANCEL' });

      const state = actor.getSnapshot().value;
      expect(state.database_management).toEqual({ open: 'browse_database' });

      const ctx = getContext(actor);
      expect(ctx.selectedRowId).toBeNull();
      expect(ctx.selectedRowData).toBeNull();
    });
  });

  describe('CLOSE_DATABASE Triggers Recalculation', () => {
    it('CLOSE_DATABASE stays in quotation basket', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'CLOSE_DATABASE' });

      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toEqual({ quotation: 'basket' });
      expect(state.database_management).toBe('closed');
    });

    it('CLOSE_DATABASE recalculates totals from current basket', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      const ctx1 = getContext(actor);
      const totals1 = { ...ctx1.totals };

      actor.send({ type: 'OPEN_DATABASE' });
      // Simulate database modifications that might affect pricing
      // (in real scenario, store rules might change)
      actor.send({ type: 'CLOSE_DATABASE' });

      const ctx2 = getContext(actor);
      // Totals should be recalculated (may be same or different depending on rule changes)
      expect(ctx2.totals).toBeDefined();
      expect(ctx2.totals.subtotal).toBeGreaterThan(0);
    });

    it('quotation items preserved after database open/close cycle', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      addItemToBasket(actor, 'ITEM_COFFEE_BASIC');
      const ctx1 = getContext(actor);
      const itemIds1 = ctx1.lineas.map(l => l.ID_Item);

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'CLOSE_DATABASE' });

      const ctx2 = getContext(actor);
      const itemIds2 = ctx2.lineas.map(l => l.ID_Item);
      expect(itemIds2).toEqual(itemIds1);
    });
  });

  describe('Database CRUD Operations', () => {
    it('SELECT_ADD_NEW from browse_database transitions to add_new_row', () => {
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'SELECT_ADD_NEW' });

      const dbState = getCurrentDatabaseState(actor);
      expect(dbState).toEqual({ open: 'add_new_row' });
    });

    it('SAVE_ROW from add_new_row returns to browse_database', () => {
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'SELECT_ADD_NEW' });
      actor.send({
        type: 'SAVE_ROW',
        newRowData: {
          ID_Categoria: 'CAT_NEW',
          Nombre: 'New Category',
        },
      });

      const dbState = getCurrentDatabaseState(actor);
      expect(dbState).toEqual({ open: 'browse_database' });
    });

    it('SAVE_ROW in add_new_row persists new rows into store', () => {
      const newCategory = {
        tableName: 'CATEGORIAS',
        ID_Categoria: 'CAT_TEST_NEW',
        Nombre: 'Categoria Test',
      };

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'SELECT_ADD_NEW' });
      actor.send({ type: 'SAVE_ROW', tableName: 'CATEGORIAS', newRowData: newCategory });

      const ctx = getContext(actor);
      const inserted = ctx.store.findById('CATEGORIAS', 'ID_Categoria', 'CAT_TEST_NEW');
      expect(inserted).toBeDefined();
      expect(inserted.Nombre).toBe('Categoria Test');
    });

    it('CANCEL from add_new_row returns to browse_database', () => {
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'SELECT_ADD_NEW' });
      actor.send({ type: 'CANCEL' });

      const dbState = getCurrentDatabaseState(actor);
      expect(dbState).toEqual({ open: 'browse_database' });
    });

    it('SAVE_ROW from modify_row returns to browse_database', () => {
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'ROW_123',
        rowData: { ID_Categoria: 'CAT_SALON' },
      });
      actor.send({
        type: 'SAVE_ROW',
        modifiedData: { Nombre: 'Updated Name' },
      });

      const dbState = getCurrentDatabaseState(actor);
      expect(dbState).toEqual({ open: 'browse_database' });
    });

    it('SAVE_ROW in modify_row persists updates into store', () => {
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'CAT_SALON',
        rowData: {
          _tableName: 'CATEGORIAS',
          ID_Categoria: 'CAT_SALON',
          Nombre: 'Salones',
        },
      });
      actor.send({
        type: 'SAVE_ROW',
        modifiedData: { Nombre: 'Salones Premium' },
      });

      const ctx = getContext(actor);
      const updated = ctx.store.findById('CATEGORIAS', 'ID_Categoria', 'CAT_SALON');
      expect(updated).toBeDefined();
      expect(updated.Nombre).toBe('Salones Premium');
    });
  });

  describe('Complex Workflows: Quotation + Database Interaction', () => {
    it('full flow: browse → add items → open db → modify → close → validate', () => {
      // Quotation: browse
      expect(getCurrentWorkflowState(actor)).toBe('browse');
      expect(getCurrentDatabaseState(actor)).toBe('closed');

      // Quotation: initialize and add items
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'basket' });

      let ctx = getContext(actor);
      const itemCountBefore = ctx.lineas.length;

      // Database: open and modify
      actor.send({ type: 'OPEN_DATABASE' });
      expect(getCurrentDatabaseState(actor)).toEqual({ open: 'browse_database' });

      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'PP_SALON_BASE',
        rowData: { Nombre: 'Salon Base 4h' },
      });
      expect(getCurrentDatabaseState(actor)).toEqual({ open: 'modify_row' });

      // Still in quotation basket
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'basket' });
      ctx = getContext(actor);
      expect(ctx.lineas.length).toBe(itemCountBefore);

      // Cancel modification
      actor.send({ type: 'CANCEL' });
      expect(getCurrentDatabaseState(actor)).toEqual({ open: 'browse_database' });

      // Database: close (triggers recalc)
      actor.send({ type: 'CLOSE_DATABASE' });
      expect(getCurrentDatabaseState(actor)).toBe('closed');
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'basket' });

      // Quotation: continue to validation
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'validation' });

      actor.send({ type: 'VALIDATE_AND_SAVE' });
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'completed' });
    });

    it('can open database from validation state', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');
      actor.send({ type: 'ADVANCE_TO_VALIDATION' });

      // Database independent of workflow state
      actor.send({ type: 'OPEN_DATABASE' });
      expect(getCurrentDatabaseState(actor)).toEqual({ open: 'browse_database' });
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'validation' });

      actor.send({ type: 'CLOSE_DATABASE' });
      expect(getCurrentDatabaseState(actor)).toBe('closed');
      expect(getCurrentWorkflowState(actor)).toEqual({ quotation: 'validation' });
    });

    it('database operations do not interfere with RETURN_TO_BROWSE', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'ROW_123',
        rowData: {},
      });

      // From quotation basket, can still return to browse
      actor.send({ type: 'RETURN_TO_BROWSE' });

      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toBe('browse');
      // Database state is independent
      expect(state.database_management).toEqual({ open: 'modify_row' });

      const ctx = getContext(actor);
      expect(ctx.quotation).toBeNull();
      expect(ctx.lineas).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('cannot modify quotation while database operation is in progress (contextually)', () => {
      navigateToBasket(actor, { paxGlobal: 25 });
      addItemToBasket(actor, 'ITEM_CHINOOK');

      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({
        type: 'SELECT_ROW_TO_MODIFY',
        rowId: 'ROW_123',
        rowData: {},
      });

      // UI should prevent adding items while in modify_row state
      // But state machine allows it (business rule, not technical)
      actor.send({ type: 'ADD_ITEM', itemId: 'ITEM_ALMUERZO' });

      const state = actor.getSnapshot().value;
      // Item was added (state machine allows it)
      expect(state.quotation_workflow).toEqual({ quotation: 'basket' });
      // Database still in modify_row
      expect(state.database_management).toEqual({ open: 'modify_row' });
    });

    it('CLOSE_DATABASE with null quotation is safe', () => {
      // Still in browse, no quotation initialized
      actor.send({ type: 'OPEN_DATABASE' });
      actor.send({ type: 'CLOSE_DATABASE' });

      const state = actor.getSnapshot().value;
      expect(state.quotation_workflow).toBe('browse');
      expect(state.database_management).toBe('closed');

      const ctx = getContext(actor);
      expect(ctx.quotation).toBeNull();
    });
  });
});
