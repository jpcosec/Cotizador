/**
 * mountDatabasePlayground.js — Alpine.js mount function for the DB browser.
 *
 * Fetches CSV data, creates the XState actor, and registers an Alpine
 * component that is display-only (reads context, fires events up).
 *
 * @param {HTMLElement} root - Container element
 */

import { loadSeedFromCsvUrl } from '../../../../packages/database/src/csvSeed.browser.js';
import { createDatabaseActor, BROWSER_TABLES } from '../../../../packages/database/src/machine/databaseMachine.js';
import { DATA_SCHEMA } from '../../../../packages/database/src/Config_Schema.js';
import { getPrimaryKeyForTable } from '../../../../packages/database/src/playgroundAdapter.js';

const CSV_BASE_URL = '/data/init';

export async function mountDatabasePlayground(root) {
  if (!root) return;

  const templatePath = '/apps/sandbox/playground/database/DatabasePlayground.html';
  const html = await fetch(templatePath).then(r => r.text());

  const seed = await loadSeedFromCsvUrl(CSV_BASE_URL);
  const actor = createDatabaseActor(seed);

  window.databasePlaygroundComponent = function databasePlaygroundComponent() {
    return {
      // ── XState context mirror ────────────────────────────────────────────
      state: null,      // machine state name: 'browsing' | 'editing' | 'addingRow'
      ctx: {},          // snapshot.context

      // ── Derived UI helpers (computed from ctx) ───────────────────────────
      get activeRows() {
        return this.ctx.rows?.[this.ctx.activeTable] ?? [];
      },
      get activeColumns() {
        return DATA_SCHEMA[this.ctx.activeTable]?.columns ?? [];
      },
      get filteredRows() {
        let rows = this.activeRows;
        const filters = this.ctx.tagFilters ?? [];
        if (!filters.length) return this.sortedRows(rows);
        // Filter by tag value in any column
        rows = rows.filter(row =>
          filters.some(tag => Object.values(row).some(v => String(v) === tag))
        );
        return this.sortedRows(rows);
      },
      sortedRows(rows) {
        const { column, dir } = this.ctx.sort ?? {};
        if (!column) return rows;
        return [...rows].sort((a, b) => {
          const av = a[column] ?? '';
          const bv = b[column] ?? '';
          const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
          return dir === 'desc' ? -cmp : cmp;
        });
      },
      get tagOptions() {
        // Derive tag chips per table
        const table = this.ctx.activeTable;
        if (table === 'ITEM_CATALOGO') {
          return [...new Set(this.activeRows.map(r => r.ID_Categoria).filter(Boolean))];
        }
        if (table === 'REGLAS_NEGOCIO') {
          return [...new Set(this.activeRows.map(r => r.Tipo_Accion).filter(Boolean))];
        }
        return [];
      },
      get rowCount() { return this.filteredRows.length; },
      get tables() { return BROWSER_TABLES; },

      // ── Init ─────────────────────────────────────────────────────────────
      init() {
        // Seed with current snapshot immediately (subscribe may not fire synchronously)
        const snap = actor.getSnapshot();
        this.state = snap.value;
        this.ctx = snap.context;
        actor.subscribe(s => {
          this.state = s.value;
          this.ctx = s.context;
        });
      },

      // ── Event senders ─────────────────────────────────────────────────────
      selectTable(tableId) {
        actor.send({ type: 'SELECT_TABLE', tableId });
      },
      sort(column) {
        actor.send({ type: 'SORT', column });
      },
      toggleFilter(tag) {
        actor.send({ type: 'TOGGLE_FILTER', tag });
      },
      dblClickCell(rowId, field, value) {
        actor.send({ type: 'DOUBLE_CLICK_CELL', rowId, field, value });
      },
      updateBuffer(value) {
        actor.send({ type: 'UPDATE_BUFFER', value });
      },
      commitEdit() {
        actor.send({ type: 'COMMIT_EDIT' });
      },
      cancelEdit() {
        actor.send({ type: 'CANCEL_EDIT' });
      },
      addRow() {
        actor.send({ type: 'ADD_ROW' });
      },
      updatePendingField(field, value) {
        actor.send({ type: 'UPDATE_BUFFER', field, value });
      },
      commitAdd() {
        actor.send({ type: 'COMMIT_ADD' });
      },
      cancelAdd() {
        actor.send({ type: 'CANCEL_ADD' });
      },
      deleteRow(rowId) {
        actor.send({ type: 'DELETE_ROW', rowId });
      },
      cancelDelete() {
        actor.send({ type: 'CANCEL_DELETE' });
      },

      // ── Inline-edit helpers ───────────────────────────────────────────────
      isEditing(rowId, field) {
        return (
          this.state === 'editing' &&
          this.ctx.editTarget?.rowId === rowId &&
          this.ctx.editTarget?.field === field
        );
      },
      isPendingDelete(rowId) {
        return this.ctx.deleteConfirm === rowId;
      },
      rowId(row) {
        const pkField = getPrimaryKeyForTable(this.ctx.activeTable, DATA_SCHEMA);
        return row[pkField];
      },
      formatCell(value) {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + '…';
        return String(value);
      },
      sortIndicator(col) {
        if (this.ctx.sort?.column !== col) return '';
        return this.ctx.sort.dir === 'asc' ? ' ↑' : ' ↓';
      },
    };
  };

  root.innerHTML = html;
  if (window.Alpine?.initTree) {
    window.Alpine.initTree(root);
  }
}
