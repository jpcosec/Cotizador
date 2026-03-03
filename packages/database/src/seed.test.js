/**
 * seed.test.js — CSV data and database integration tests.
 *
 * Source of truth: data/init/*.csv (real production data).
 * These tests verify that the CSV data conforms to Config_Schema.js,
 * that FK references resolve correctly, and that CRUD operations work
 * end-to-end through the createDatabase factory.
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DATA_SCHEMA } from './Config_Schema.js';
import { createDatabase } from './createDatabase.js';
import { loadSeedFromCsvDir } from './csvSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.resolve(__dirname, '../../../data/init');

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPrimaryKey(tableSchema) {
  const pk = tableSchema.columns.find(c => c.type === 'PK' || c.type === 'PK/FK');
  return pk ? pk.name : '_id';
}

function buildDb() {
  const seed = loadSeedFromCsvDir(CSV_DIR);
  return createDatabase({ seed });
}

// ── Schema conformance ────────────────────────────────────────────────────────

describe('CSV → schema conformance', () => {
  const CATALOG_TABLES = ['PERFILES_PRECIO', 'PERFILES_INICIALIZACION', 'CATEGORIAS', 'ITEM_CATALOGO', 'REGLAS_NEGOCIO'];

  it('loads all catalog tables with rows', () => {
    const db = buildDb();
    for (const table of CATALOG_TABLES) {
      const rows = db.models[table].all();
      expect(rows.length, `${table} should have rows`).toBeGreaterThan(0);
    }
  });

  it('every PERFILES_PRECIO row has the required PK and numeric fields', () => {
    const db = buildDb();
    for (const row of db.models.PERFILES_PRECIO.all()) {
      expect(typeof row.ID_Perfil_Precio).toBe('string');
      expect(row.ID_Perfil_Precio.length).toBeGreaterThan(0);
      expect(typeof row.Costo_Base_Fijo).toBe('number');
      expect(typeof row.Costo_Unitario_Pax).toBe('number');
      expect(typeof row.Costo_Unitario_Tiempo).toBe('number');
      expect(typeof row.Costo_Unitario_Item).toBe('number');
      expect(typeof row.Activo).toBe('boolean');
    }
  });

  it('every CATEGORIAS row has boolean dimension flags', () => {
    const db = buildDb();
    for (const row of db.models.CATEGORIAS.all()) {
      expect(typeof row.ID_Categoria).toBe('string');
      expect(typeof row.Def_Requiere_Pax).toBe('boolean');
      expect(typeof row.Def_Requiere_Cant).toBe('boolean');
      expect(typeof row.Def_Requiere_Tiempo).toBe('boolean');
      expect(typeof row.Def_Requiere_Hora).toBe('boolean');
    }
  });

  it('every CATEGORIAS row FK (ID_Perfil_Precio_Default) resolves', () => {
    const db = buildDb();
    const perfiles = new Set(db.models.PERFILES_PRECIO.all().map(r => r.ID_Perfil_Precio));
    for (const row of db.models.CATEGORIAS.all()) {
      if (row.ID_Perfil_Precio_Default) {
        expect(
          perfiles.has(row.ID_Perfil_Precio_Default),
          `Category ${row.ID_Categoria}: ID_Perfil_Precio_Default "${row.ID_Perfil_Precio_Default}" not found`
        ).toBe(true);
      }
    }
  });

  it('every CATEGORIAS row FK (ID_Perfil_Init_Default) resolves', () => {
    const db = buildDb();
    const perfilesInit = new Set(db.models.PERFILES_INICIALIZACION.all().map(r => r.ID_Perfil_Init));
    for (const row of db.models.CATEGORIAS.all()) {
      if (row.ID_Perfil_Init_Default) {
        expect(
          perfilesInit.has(row.ID_Perfil_Init_Default),
          `Category ${row.ID_Categoria}: ID_Perfil_Init_Default "${row.ID_Perfil_Init_Default}" not found`
        ).toBe(true);
      }
    }
  });

  it('every ITEM_CATALOGO row FK (ID_Categoria) resolves', () => {
    const db = buildDb();
    const cats = new Set(db.models.CATEGORIAS.all().map(r => r.ID_Categoria));
    for (const row of db.models.ITEM_CATALOGO.all()) {
      expect(
        cats.has(row.ID_Categoria),
        `Item ${row.ID_Item}: ID_Categoria "${row.ID_Categoria}" not found`
      ).toBe(true);
    }
  });

  it('items with ID_Perfil_Precio_Override reference a real profile', () => {
    const db = buildDb();
    const perfiles = new Set(db.models.PERFILES_PRECIO.all().map(r => r.ID_Perfil_Precio));
    const itemsWithOverride = db.models.ITEM_CATALOGO.all().filter(r => r.ID_Perfil_Precio_Override);
    expect(itemsWithOverride.length).toBeGreaterThan(0); // at least one override exists
    for (const row of itemsWithOverride) {
      expect(
        perfiles.has(row.ID_Perfil_Precio_Override),
        `Item ${row.ID_Item}: override profile "${row.ID_Perfil_Precio_Override}" not found`
      ).toBe(true);
    }
  });

  it('items with ID_Perfil_Init_Override reference a real init profile', () => {
    const db = buildDb();
    const perfilesInit = new Set(db.models.PERFILES_INICIALIZACION.all().map(r => r.ID_Perfil_Init));
    const itemsWithOverride = db.models.ITEM_CATALOGO.all().filter(r => r.ID_Perfil_Init_Override);
    for (const row of itemsWithOverride) {
      expect(
        perfilesInit.has(row.ID_Perfil_Init_Override),
        `Item ${row.ID_Item}: override init profile "${row.ID_Perfil_Init_Override}" not found`
      ).toBe(true);
    }
  });

  it('all items have a resolvable pricing profile (override or via category)', () => {
    const db = buildDb();
    const perfiles = new Set(db.models.PERFILES_PRECIO.all().map(r => r.ID_Perfil_Precio));
    const cats = Object.fromEntries(db.models.CATEGORIAS.all().map(r => [r.ID_Categoria, r]));
    for (const item of db.models.ITEM_CATALOGO.all()) {
      const profileId = item.ID_Perfil_Precio_Override
        ?? cats[item.ID_Categoria]?.ID_Perfil_Precio_Default;
      expect(
        perfiles.has(profileId),
        `Item ${item.ID_Item}: no resolvable profile (override="${item.ID_Perfil_Precio_Override}", catDefault="${cats[item.ID_Categoria]?.ID_Perfil_Precio_Default}")`
      ).toBe(true);
    }
  });

  it('REGLAS_NEGOCIO rows have valid ENUM values for Etapa and Scope', () => {
    const etapaOptions = DATA_SCHEMA.REGLAS_NEGOCIO.columns.find(c => c.name === 'Etapa').options;
    const scopeOptions = DATA_SCHEMA.REGLAS_NEGOCIO.columns.find(c => c.name === 'Scope').options;
    const db = buildDb();
    for (const row of db.models.REGLAS_NEGOCIO.all()) {
      expect(etapaOptions).toContain(row.Etapa);
      expect(scopeOptions).toContain(row.Scope);
    }
  });
});

// ── CRUD integration ──────────────────────────────────────────────────────────

describe('createDatabase CRUD integration', () => {
  it('creates one model per DATA_SCHEMA table', () => {
    const db = createDatabase();
    const expected = Object.keys(DATA_SCHEMA).sort();
    const actual = Object.keys(db.models).sort();
    expect(actual).toEqual(expected);
  });

  it('supports create / findById / update / deleteById lifecycle', () => {
    const db = createDatabase();
    const m = db.models.CLIENTES;

    const created = m.create({ Nombre_Empresa: 'Test Corp', Email: 'test@test.cl' });
    expect(typeof created.ID_Cliente).toBe('string');

    const found = m.findById(created.ID_Cliente);
    expect(found.Email).toBe('test@test.cl');

    const updated = m.update({ ...found, Email: 'updated@test.cl' });
    expect(updated.Email).toBe('updated@test.cl');

    const deleted = m.deleteById(created.ID_Cliente);
    expect(deleted).toBe(true);
    expect(m.findById(created.ID_Cliente)).toBeNull();
  });

  it('seeds all CSV rows into models', () => {
    const db = buildDb();
    const perfilesCount = db.models.PERFILES_PRECIO.all().length;
    const itemsCount = db.models.ITEM_CATALOGO.all().length;
    expect(perfilesCount).toBeGreaterThan(10);
    expect(itemsCount).toBeGreaterThan(50);
  });
});
