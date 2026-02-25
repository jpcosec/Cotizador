import { describe, it, expect } from 'vitest';
import { createAppStateMachine } from './AppStateMachine.js';

describe('AppStateMachine', () => {
  it('should start in BROWSE state', () => {
    const machine = createAppStateMachine();
    expect(machine.getState().value).toBe('BROWSE');
  });

  it('should transition from BROWSE to CLIENT_SELECTOR on openClientModal()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    expect(machine.getState().value).toBe('CLIENT_SELECTOR');
  });

  it('should transition from CLIENT_SELECTOR to INITIALIZE on clientSelected()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    expect(machine.getState().value).toBe('INITIALIZE');
    expect(machine.getState().context.selectedClient.clientId).toBe('c1');
  });

  it('should transition from INITIALIZE to QUOTATION on formSubmitted()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    expect(machine.getState().value).toBe('QUOTATION');
    expect(machine.getState().context.quotation.pax).toBe(50);
  });

  it('should open GLOBAL_VARIABLES_FORM modal while staying in QUOTATION state', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('OPEN_GLOBAL_VARIABLES_FORM');
    expect(machine.getState().context.openModal).toBe('GLOBAL_VARIABLES_FORM');
    expect(machine.getState().value).toBe('QUOTATION'); // Still in quotation
  });

  it('should transition to VALIDATION on saveQuotation()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    expect(machine.getState().value).toBe('VALIDATION');
  });

  it('should transition to COMPLETED on confirmSave()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    machine.send('CONFIRM_SAVE');
    expect(machine.getState().value).toBe('COMPLETED');
  });

  it('should return to BROWSE on resetToHome()', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('RESET_TO_HOME');
    expect(machine.getState().value).toBe('BROWSE');
  });

  it('should have all required context fields initialized', () => {
    const machine = createAppStateMachine();
    const state = machine.getState();
    expect(state.context).toHaveProperty('selectedClient');
    expect(state.context).toHaveProperty('quotation');
    expect(state.context).toHaveProperty('basketItems');
    expect(state.context).toHaveProperty('dbCached');
    expect(state.context).toHaveProperty('errors');
    expect(state.context).toHaveProperty('quotationId');
    expect(Array.isArray(state.context.basketItems)).toBe(true);
    expect(Array.isArray(state.context.errors)).toBe(true);
  });

  it('should generate quotationId on CONFIRM_SAVE', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    machine.send('CONFIRM_SAVE');
    expect(machine.getState().context.quotationId).toBeTruthy();
    expect(machine.getState().context.quotationId).toMatch(/^Q-/);
  });

  it('should handle RESET_TO_HOME from QUOTATION state', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('RESET_TO_HOME');
    expect(machine.getState().value).toBe('BROWSE');
    expect(machine.getState().context.quotation).toBeNull();
  });

  it('should handle RESET_TO_HOME from VALIDATION state', () => {
    const machine = createAppStateMachine();
    machine.send('OPEN_CLIENT_MODAL');
    machine.send('CLIENT_SELECTED', { clientId: 'c1', clientName: 'Test Corp' });
    machine.send('INIT_FORM_SUBMITTED', { pax: 50, fecha: '2026-03-15', duracion: 3 });
    machine.send('SAVE_QUOTATION');
    machine.send('RESET_TO_HOME');
    expect(machine.getState().value).toBe('BROWSE');
    expect(machine.getState().context.basketItems).toEqual([]);
  });
});
