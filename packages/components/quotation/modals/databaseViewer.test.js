import { describe, expect, it } from 'vitest';
import { createDatabaseViewer } from './DatabaseViewer.js';

describe('DatabaseViewer', () => {
  const tables = {
    CLIENTES: [{ id: 'C1', nombre: 'Empresa A' }, { id: 'C2', nombre: 'Empresa B' }],
    ITEMS: [{ id: 'I1', nombre: 'Cafe' }]
  };

  it('selects table and exposes rows', () => {
    const viewer = createDatabaseViewer(tables);

    viewer.selectTable('ITEMS');

    expect(viewer.getRows()).toEqual([{ id: 'I1', nombre: 'Cafe' }]);
  });

  it('filters selected table rows', () => {
    const viewer = createDatabaseViewer(tables).selectTable('CLIENTES');

    viewer.setFilter('empresa b');

    expect(viewer.getFilteredRows()).toEqual([{ id: 'C2', nombre: 'Empresa B' }]);
  });
});
