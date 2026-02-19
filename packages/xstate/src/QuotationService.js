import { createActor } from 'xstate';
import { createQuotationXStateMachine } from './Orchestration/quotationMachine.xstate.js';
import { quotationAdapters } from './Orchestration/adapters/index.js';

/**
 * Main orchestration service for quotation workflows.
 *
 * XState remains middleware only: callers must provide the data store
 * (typically from @claps/database) and optional transport/persistence hooks
 * through adapter overrides.
 *
 * Usage:
 *   const service = new QuotationService({ store });
 *   const actor = service.startNew('CLI_001', 25);
 *   service.addItem('ITEM_SALA');
 *   service.validateAndSave();
 */
export class QuotationService {
  constructor({ store, adapters } = {}) {
    if (!store) {
      throw new Error('QuotationService requires a store instance (from @claps/database).');
    }

    this.store = store;
    this.adapters = adapters || quotationAdapters;
    this.actor = null;
  }

  /**
   * Start a new quotation workflow.
   *
   * @param {string} clienteId - Client identifier
   * @param {number} paxGlobal - Number of attendees
   * @param {object} opts - Additional options
   * @param {string} opts.fechaEvento - Event date (YYYY-MM-DD)
   * @param {number} opts.duracionDias - Event duration in days
   * @param {string} opts.cotizacionId - Custom quotation ID (optional, auto-generated if not provided)
   *
   * @returns {object} XState actor ready to send events
   *
   * @example
   *   const actor = service.startNew('CLI_CORP', 25, {
   *     fechaEvento: '2025-06-15',
   *     duracionDias: 1,
   *   });
   */
  startNew(clienteId, paxGlobal, opts = {}) {
    const machine = createQuotationXStateMachine(this.adapters);

    // Create actor
    this.actor = createActor(machine);

    // Set store in context before starting
    const snap = this.actor.getSnapshot();
    snap.context.store = this.store;

    this.actor.start();

    // Navigate through initialization
    this.actor.send({ type: 'START_NEW_QUOTATION' });
    this.actor.send({ type: 'CREATE_NEW' });

    // Initialize with provided data
    this.actor.send({
      type: 'QUOTATION_INITIALIZED',
      clienteId,
      paxGlobal,
      fechaEvento: opts.fechaEvento || new Date().toISOString().split('T')[0],
      duracionDias: opts.duracionDias || 1,
      cotizacionId: opts.cotizacionId || `COT_${Date.now()}`,
    });

    return this.actor;
  }

  /**
   * Add an item to the current quotation.
   *
   * @param {string} itemId - Item catalog ID
   * @param {object} overrides - Price overrides
   * @param {number} overrides.Override_Pax - Custom pax count
   * @param {number} overrides.Override_Cantidad - Custom quantity
   * @param {number} overrides.Override_Duracion_Min - Custom duration in minutes
   *
   * @example
   *   service.addItem('ITEM_CHINOOK');
   *   service.addItem('ITEM_ALMUERZO', { Override_Pax: 80 });
   *   service.addItem('ITEM_CHINOOK', { Override_Duracion_Min: 600 });
   */
  addItem(itemId, overrides = {}) {
    this._ensureActive();
    this.actor.send({
      type: 'ADD_ITEM',
      itemId,
      overrides,
    });
  }

  /**
   * Update an existing item in the quotation.
   *
   * @param {string} lineId - Line item ID (obtained from getSnapshot)
   * @param {object} overrides - New override values
   *
   * @example
   *   const snap = service.getSnapshot();
   *   const lineId = snap.context.lineas[0].ID_Linea;
   *   service.updateItem(lineId, { Override_Pax: 50 });
   */
  updateItem(lineId, overrides = {}) {
    this._ensureActive();
    this.actor.send({
      type: 'UPDATE_ITEM',
      lineId,
      overrides,
    });
  }

  /**
   * Remove an item from the quotation (soft delete).
   * Item remains in history but is excluded from totals.
   *
   * @param {string} lineId - Line item ID
   *
   * @example
   *   service.removeItem('LIN_001');
   */
  removeItem(lineId) {
    this._ensureActive();
    this.actor.send({
      type: 'REMOVE_ITEM',
      lineId,
    });
  }

  /**
   * Validate and save the quotation to file.
   *
   * Performs a full recalculation (LEVEL 2) and saves to data/quotations/ directory.
   *
   * @returns {object} Final snapshot with saved quotation
   * @throws {Error} If quotation has blocking errors
   *
   * @example
   *   const result = service.validateAndSave();
   *   console.log(`Saved: ${result.context.quotation.cotizacion.ID_Cotizacion}`);
   */
  validateAndSave() {
    this._ensureActive();

    // Advance to validation state
    this.actor.send({ type: 'ADVANCE_TO_VALIDATION' });

    // Validate and save to file
    this.actor.send({ type: 'VALIDATE_AND_SAVE' });

    const snap = this.getSnapshot();

    // Check for blocking errors
    if (snap.context.errors.some(e => e.blocking)) {
      throw new Error(
        `Validation failed: ${snap.context.errors
          .filter(e => e.blocking)
          .map(e => e.message)
          .join(', ')}`
      );
    }

    return snap;
  }

  /**
   * Get the current XState snapshot.
   *
   * Contains full state machine state and context.
   *
   * @returns {object|null} XState snapshot or null if no active quotation
   *
   * @example
   *   const snap = service.getSnapshot();
   *   console.log(snap.value);        // State node paths
   *   console.log(snap.context);      // Current context
   *   console.log(snap.context.lineas); // Array of line items
   *   console.log(snap.context.totals); // Price totals
   */
  getSnapshot() {
    if (!this.actor) return null;
    return this.actor.getSnapshot();
  }

  /**
   * Get a human-readable inspection of the current quotation.
   *
   * Useful for logging and debugging.
   *
   * @returns {object} Formatted state, items, and totals
   *
   * @example
   *   const inspection = service.inspect();
   *   console.log(inspection);
   *   // {
   *   //   state: { quotation_workflow: { quotation: 'basket' } },
   *   //   quotation: { cotizacion: {...}, paxGlobal: 25, ... },
   *   //   items: [ { id, item, price, removed }, ... ],
   *   //   totals: { subtotal, taxes, total },
   *   //   errors: [],
   *   //   messages: []
   *   // }
   */
  inspect() {
    const snap = this.getSnapshot();
    if (!snap) return null;

    return {
      state: snap.value,
      quotation: snap.context.quotation,
      items: snap.context.lineas.map(l => ({
        id: l.ID_Linea,
        item: l.ID_Item,
        price: l._netoBase,
        removed: l._removed || false,
      })),
      totals: snap.context.totals,
      errors: snap.context.errors,
      messages: snap.context.messages,
    };
  }

  /**
   * Cancel the current quotation and return to browse state.
   *
   * Discards all unsaved changes.
   *
   * @example
   *   service.cancel();
   *   // Can now call startNew() again
   */
  cancel() {
    if (!this.actor) return;
    this.actor.send({ type: 'RETURN_TO_BROWSE' });
    this.actor = null;
  }

  // === Private Helpers ===

  _ensureActive() {
    if (!this.actor) {
      throw new Error(
        'No active quotation. Call startNew(clienteId, paxGlobal) first.'
      );
    }
  }
}
