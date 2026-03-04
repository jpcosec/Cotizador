import { describe, expect, it } from 'vitest';
import { SEED_DATA } from './seed.js';
import { seedToResolverDb, getPrimaryKeyForTable } from './playgroundAdapter.js';

describe('playgroundAdapter', () => {
  it('maps seed data into resolver db shape', () => {
    const db = seedToResolverDb(SEED_DATA);

    expect(Array.isArray(db.items)).toBe(true);
    expect(Array.isArray(db.categorias)).toBe(true);
    expect(Array.isArray(db.perfiles)).toBe(true);
    expect(Array.isArray(db.perfilesInit)).toBe(true);
    expect(Array.isArray(db.reglas)).toBe(true);
    expect(db.items.length).toBeGreaterThan(0);
  });

  it('returns empty arrays when tables are missing', () => {
    const db = seedToResolverDb([]);

    expect(db).toEqual({
      items: [],
      categorias: [],
      perfiles: [],
      perfilesInit: [],
      reglas: [],
    });
  });

  it('resolves primary key field from schema', () => {
    expect(getPrimaryKeyForTable('ITEM_CATALOGO')).toBe('ID_Item');
    expect(getPrimaryKeyForTable('LINEA_DETALLE')).toBe('ID_Linea');
    expect(getPrimaryKeyForTable('UNKNOWN_TABLE')).toBe('_id');
  });
});
