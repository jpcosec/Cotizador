/**
 * databaseMachine.js — XState machine for the database browser playground.
 *
 * States: browsing | editing | addingRow
 *
 * The db instance lives in the factory closure (not in context — it's not
 * serializable). Actions mutate the closure and refresh context.rows by
 * reading back from the store.
 *
 * Closure:
 *   db = createDatabase(seed)   ← mutable, never in context
 *
 * Context:
 *   rows = db.models[table].all()  ← plain snapshot, refreshed after writes
 */

import { assign, createActor, createMachine } from 'xstate';
import { DATA_SCHEMA } from '../Config_Schema.js';
import { createDatabase } from '../createDatabase.js';
import { updateRow, addRow, deleteRow } from '../services/editService.js';
import { validateField, validateRow, isRowValid } from '../validation.js';
import { getPrimaryKeyForTable } from '../playgroundAdapter.js';

export const BROWSER_TABLES = [
  // Block 1 — Reference data
  'CLIENTES',
  'PERFILES_PRECIO',
  'PERFILES_INICIALIZACION',
  'CATEGORIAS',
  'ITEM_CATALOGO',
  'COMPOSICION_KIT',
  'REGLAS_NEGOCIO',
  // Block 2 — Transactional data
  'COTIZACIONES',
  'LINEA_DETALLE',
  'AJUSTES_COTIZACION',
  'CACHE_COTIZACION',
  'HISTORIAL_COTIZACION',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBlankRow(tableName) {
  const row = {};
  const primaryKey = getPrimaryKeyForTable(tableName, DATA_SCHEMA);
  for (const col of DATA_SCHEMA[tableName]?.columns ?? []) {
    if (col.name === primaryKey) continue;
    row[col.name] = col.type === 'BOOLEAN' ? false : '';
  }
  return row;
}

function mergedEditRow(context, models) {
  const model = models[context.activeTable];
  const currentRow = model?.findById(context.editTarget.rowId);
  if (!currentRow) return null;

  return {
    ...currentRow,
    [context.editTarget.field]: context.editTarget.buffer,
  };
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create and start a database browser actor.
 *
 * @param {Array} seed - SEED_DATA array (from csvSeed.browser or SEED_DATA)
 * @returns {import('xstate').Actor}
 */
export function createDatabaseActor(seed = []) {
  const db = createDatabase({ seed });

  function snap(tableName) { return db.models[tableName]?.all() ?? []; }

  function allRows() {
    return Object.fromEntries(BROWSER_TABLES.map(t => [t, snap(t)]));
  }

  function ctx() { return { models: db.models }; }

  // ── Machine ────────────────────────────────────────────────────────────────
  const machine = createMachine({
    id: 'databaseBrowser',
    initial: 'browsing',
    context: {
      activeTable: 'PERFILES_PRECIO',
      rows: allRows(),
      sort: { column: null, dir: 'asc' },
      tagFilters: [],
      editTarget: null,    // { rowId, field, buffer, originalValue, error }
      pendingRow: null,    // { fields: {}, errors: {} }
      deleteConfirm: null, // rowId awaiting confirmation click
    },

    states: {

      browsing: {
        on: {
          SELECT_TABLE: {
            actions: assign(({ event }) => ({
              activeTable: event.tableId,
              sort: { column: null, dir: 'asc' },
              tagFilters: [],
              deleteConfirm: null,
            }))
          },

          SORT: {
            actions: assign(({ context, event }) => {
              const sameCol = context.sort.column === event.column;
              return {
                sort: {
                  column: event.column,
                  dir: sameCol && context.sort.dir === 'asc' ? 'desc' : 'asc',
                }
              };
            })
          },

          TOGGLE_FILTER: {
            actions: assign(({ context, event }) => {
              const next = context.tagFilters.includes(event.tag)
                ? context.tagFilters.filter(t => t !== event.tag)
                : [...context.tagFilters, event.tag];
              return { tagFilters: next };
            })
          },

          DOUBLE_CLICK_CELL: {
            target: 'editing',
            actions: assign(({ event }) => ({
              editTarget: {
                rowId: event.rowId,
                field: event.field,
                buffer: String(event.value ?? ''),
                originalValue: event.value,
                error: null,
              }
            }))
          },

          ADD_ROW: {
            target: 'addingRow',
            actions: assign(({ context }) => ({
              pendingRow: { fields: makeBlankRow(context.activeTable), errors: {} }
            }))
          },

          DELETE_ROW: {
            actions: assign(({ context, event }) => {
              // Two-click confirm: first click arms, second executes
              if (context.deleteConfirm !== event.rowId) {
                return { deleteConfirm: event.rowId };
              }
              const model = db.models[context.activeTable];
              deleteRow(model, event.rowId);
              return {
                rows: { ...context.rows, [context.activeTable]: snap(context.activeTable) },
                deleteConfirm: null,
              };
            })
          },

          CANCEL_DELETE: {
            actions: assign({ deleteConfirm: null })
          },
        }
      },

      editing: {
        on: {
          UPDATE_BUFFER: {
            actions: assign(({ context, event }) => ({
              editTarget: { ...context.editTarget, buffer: event.value, error: null }
            }))
          },

          // Array form: first clause handles valid edits (guard passes → commit + go browsing)
          //             second clause handles invalid edits (always matches → show error, stay)
          COMMIT_EDIT: [
            {
              guard: ({ context }) => {
                const candidateRow = mergedEditRow(context, db.models);
                if (!candidateRow) return false;
                return isRowValid(validateRow(context.activeTable, candidateRow, ctx()));
              },
              target: 'browsing',
              actions: assign(({ context }) => {
                updateRow(
                  db.models[context.activeTable],
                  context.editTarget.rowId,
                  { [context.editTarget.field]: context.editTarget.buffer }
                );
                return {
                  rows: { ...context.rows, [context.activeTable]: snap(context.activeTable) },
                  editTarget: null,
                };
              })
            },
            {
              // guard implicitly fails — show validation error, stay in editing
              actions: assign(({ context }) => {
                const candidateRow = mergedEditRow(context, db.models);
                const errors = candidateRow
                  ? validateRow(context.activeTable, candidateRow, ctx())
                  : { [context.editTarget.field]: 'Row not found' };
                const error = errors[context.editTarget.field] || Object.values(errors)[0] || 'Invalid value';
                return { editTarget: { ...context.editTarget, error } };
              })
            }
          ],

          CANCEL_EDIT: {
            target: 'browsing',
            actions: assign({ editTarget: null })
          },
        }
      },

      addingRow: {
        on: {
          UPDATE_BUFFER: {
            actions: assign(({ context, event }) => ({
              pendingRow: {
                ...context.pendingRow,
                fields: { ...context.pendingRow.fields, [event.field]: event.value },
                errors: { ...context.pendingRow.errors, [event.field]: undefined },
              }
            }))
          },

          COMMIT_ADD: [
            {
              guard: ({ context }) => isRowValid(
                validateRow(context.activeTable, context.pendingRow.fields, ctx())
              ),
              target: 'browsing',
              actions: assign(({ context }) => {
                addRow(db.models[context.activeTable], context.pendingRow.fields);
                return {
                  rows: { ...context.rows, [context.activeTable]: snap(context.activeTable) },
                  pendingRow: null,
                };
              })
            },
            {
              actions: assign(({ context }) => {
                const errors = validateRow(context.activeTable, context.pendingRow.fields, ctx());
                return { pendingRow: { ...context.pendingRow, errors } };
              })
            }
          ],

          CANCEL_ADD: {
            target: 'browsing',
            actions: assign({ pendingRow: null })
          },
        }
      },

    }
  });

  const actor = createActor(machine);
  actor.start();
  return actor;
}
