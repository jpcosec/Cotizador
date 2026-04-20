import { describe, it, expect } from 'vitest';
import { SEED_DATA } from './seed.js';
import { resolveItemDefinition } from './resolveItemDefinition.js';

function buildDb() {
  return {
    items: SEED_DATA.find(s => s.table === 'ITEM_CATALOGO').records,
    categorias: SEED_DATA.find(s => s.table === 'CATEGORIAS').records,
    perfiles: SEED_DATA.find(s => s.table === 'PERFILES_PRECIO').records,
    perfilesInit: SEED_DATA.find(s => s.table === 'PERFILES_INICIALIZACION').records,
    reglas: SEED_DATA.find(s => s.table === 'REGLAS_NEGOCIO').records,
  };
}

describe('resolveItemDefinition — happy path', () => {
  it('returns all top-level ITEM_CATALOGO fields', () => {
    const db = buildDb();
    const result = resolveItemDefinition('ITEM-001', db);

    expect(result.ID_Item).toBe('ITEM-001');
    expect(result.Nombre).toBe('Coffee Break Estándar');
    expect(result.Default_Glosa).toBe('Coffee break con bebestibles calientes y snacks');
    expect(result.ID_Categoria).toBe('CAT-001');
    expect(result.ID_Perfil_Precio_Override).toBeNull();
    expect(result.ID_Perfil_Init_Override).toBeNull();
    expect(result.Def_Unidades_Por_Pax_Override).toBeUndefined();
    expect(result.Activo).toBe(true);
  });

  it('does not include Updated_At on the top-level item', () => {
    const db = buildDb();
    const result = resolveItemDefinition('ITEM-001', db);
    expect(result.Updated_At).toBeUndefined();
  });

  it('joins the full categoria row (without Updated_At and old init columns)', () => {
    const db = buildDb();
    const { categoria } = resolveItemDefinition('ITEM-001', db);

    expect(categoria.ID_Categoria).toBe('CAT-001');
    expect(categoria.Nombre).toBe('Coffee Break');
    expect(categoria.ID_Perfil_Precio_Default).toBe('PP-001');
    expect(categoria.ID_Perfil_Init_Default).toBe('PI-001');
    expect(categoria.Def_Requiere_Pax).toBe(true);
    expect(categoria.Def_Requiere_Cant).toBe(false);
    expect(categoria.Def_Requiere_Hora).toBe(true);
    expect(categoria.Icono_UI).toBe('coffee');
    expect(categoria.Def_Duracion_Min).toBeUndefined();
    expect(categoria.Def_Unidades_Por_Pax).toBeUndefined();
    expect(categoria.Updated_At).toBeUndefined();
  });

  it('resolves the category-default perfil when item has no override', () => {
    const db = buildDb();
    const { perfil } = resolveItemDefinition('ITEM-001', db);

    expect(perfil.ID_Perfil_Precio).toBe('PP-001');
    expect(perfil.Nombre).toBe('Solo por Pax');
    expect(perfil.Costo_Unitario_Pax).toBe(4600);
    expect(perfil.Updated_At).toBeUndefined();
  });

  it('uses the item-level perfil override when present', () => {
    const db = buildDb();
    const { perfil } = resolveItemDefinition('ITEM-002', db);

    expect(perfil.ID_Perfil_Precio).toBe('PP-003');
    expect(perfil.Nombre).toBe('Base + Pax');
    expect(perfil.Costo_Base_Fijo).toBe(50000);
    expect(perfil.Costo_Unitario_Pax).toBe(2500);
  });
});

describe('resolveItemDefinition — perfilInit resolution', () => {
  it('resolves perfilInit from category default FK', () => {
    const db = buildDb();
    const { perfilInit } = resolveItemDefinition('ITEM-001', db);

    expect(perfilInit).toMatchObject({
      ID_Perfil_Init: 'PI-001',
      Duracion_Min: 30,
      Unidades_Por_Pax: 1,
      Unidades_Por_Hora: 0,
      Minutos_Por_Usuario: 0,
      Cantidad_Fija: 0,
      Pax_Fijo: 0,
      Activo: true,
    });
  });

  it('resolves perfilInit from item override FK when present (override wins)', () => {
    const db = buildDb();
    const patchedItems = db.items.map(item => (
      item.ID_Item === 'ITEM-001'
        ? { ...item, ID_Perfil_Init_Override: 'PI-003' }
        : item
    ));

    const { perfilInit } = resolveItemDefinition('ITEM-001', {
      ...db,
      items: patchedItems,
    });

    expect(perfilInit?.ID_Perfil_Init).toBe('PI-003');
    expect(perfilInit?.Duracion_Min).toBe(120);
  });

  it('perfilInit is null when no FK is set', () => {
    const db = buildDb();
    const patchedCats = db.categorias.map(cat => (
      cat.ID_Categoria === 'CAT-001'
        ? { ...cat, ID_Perfil_Init_Default: null }
        : cat
    ));

    const { perfilInit } = resolveItemDefinition('ITEM-001', {
      ...db,
      categorias: patchedCats,
    });

    expect(perfilInit).toBeNull();
  });
});

describe('resolveItemDefinition — rules filtering', () => {
  it('includes global RESTRICCION_UI ITEM rules for any item', () => {
    const db = buildDb();
    const { reglas } = resolveItemDefinition('ITEM-001', db);
    const ids = reglas.map(r => r.ID_Regla);
    expect(ids).toContain('R-001');
  });

  it('includes item-specific rules when ID_Componente matches', () => {
    const db = buildDb();
    const { reglas } = resolveItemDefinition('ITEM-006', db);
    const ids = reglas.map(r => r.ID_Regla);
    expect(ids).toContain('R-001');
    expect(ids).toContain('R-002');
  });

  it('excludes item-specific rules when ID_Componente does not match', () => {
    const db = buildDb();
    const { reglas } = resolveItemDefinition('ITEM-001', db);
    const ids = reglas.map(r => r.ID_Regla);
    expect(ids).not.toContain('R-002');
  });

  it('sorts rules by Prioridad ASC', () => {
    const db = buildDb();
    const { reglas } = resolveItemDefinition('ITEM-006', db);
    for (let i = 1; i < reglas.length; i++) {
      expect(reglas[i].Prioridad).toBeGreaterThanOrEqual(reglas[i - 1].Prioridad);
    }
  });

  it('for global-ID_Componente rules, keeps only condition-matched item.id rules', () => {
    const db = buildDb();
    const rules = [
      ...db.reglas,
      {
        ID_Regla: 'R-COND-OK',
        Nombre: 'Conditional for ITEM-001',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        ID_Componente: null,
        Tipo_Accion: 'WARNING',
        Hook: null,
        Condicion_JSON: { '===': [{ var: 'item.id' }, 'ITEM-001'] },
        Payload_JSON: { message: 'only item 001' },
        Prioridad: 5,
        Acumulable: true,
        Activo: true,
      },
      {
        ID_Regla: 'R-COND-NO',
        Nombre: 'Conditional for ITEM-006',
        Etapa: 'RESTRICCION_UI',
        Scope: 'ITEM',
        ID_Componente: null,
        Tipo_Accion: 'WARNING',
        Hook: null,
        Condicion_JSON: { '===': [{ var: 'item.id' }, 'ITEM-006'] },
        Payload_JSON: { message: 'only item 006' },
        Prioridad: 6,
        Acumulable: true,
        Activo: true,
      },
    ];

    const { reglas } = resolveItemDefinition('ITEM-001', { ...db, reglas: rules });
    const ids = reglas.map(r => r.ID_Regla);
    expect(ids).toContain('R-COND-OK');
    expect(ids).not.toContain('R-COND-NO');
  });
});

describe('resolveItemDefinition — output shape', () => {
  it('each rule row has the required contract fields', () => {
    const db = buildDb();
    const { reglas } = resolveItemDefinition('ITEM-001', db);
    reglas.forEach(r => {
      expect(r).toHaveProperty('ID_Regla');
      expect(r).toHaveProperty('Nombre');
      expect(r).toHaveProperty('Etapa');
      expect(r).toHaveProperty('Scope');
      expect(r).toHaveProperty('ID_Componente');
      expect(r).toHaveProperty('Tipo_Accion');
      expect(r).toHaveProperty('Hook');
      expect(r).toHaveProperty('Condicion_JSON');
      expect(r).toHaveProperty('Payload_JSON');
      expect(r).toHaveProperty('Prioridad');
      expect(r).toHaveProperty('Acumulable');
      expect(r).toHaveProperty('Activo', true);
    });
  });

  it('perfil has the required contract fields', () => {
    const db = buildDb();
    const { perfil } = resolveItemDefinition('ITEM-001', db);
    expect(perfil).toHaveProperty('ID_Perfil_Precio');
    expect(perfil).toHaveProperty('Nombre');
    expect(perfil).toHaveProperty('Costo_Base_Fijo');
    expect(perfil).toHaveProperty('Costo_Unitario_Pax');
    expect(perfil).toHaveProperty('Costo_Unitario_Tiempo');
    expect(perfil).toHaveProperty('Costo_Unitario_Item');
    expect(perfil).toHaveProperty('Activo');
  });

  it('perfilInit has the required contract fields when present', () => {
    const db = buildDb();
    const { perfilInit } = resolveItemDefinition('ITEM-001', db);
    expect(perfilInit).toHaveProperty('ID_Perfil_Init');
    expect(perfilInit).toHaveProperty('Nombre');
    expect(perfilInit).toHaveProperty('Duracion_Min');
    expect(perfilInit).toHaveProperty('Unidades_Por_Pax');
    expect(perfilInit).toHaveProperty('Unidades_Por_Hora');
    expect(perfilInit).toHaveProperty('Minutos_Por_Usuario');
    expect(perfilInit).toHaveProperty('Cantidad_Fija');
    expect(perfilInit).toHaveProperty('Pax_Fijo');
    expect(perfilInit).toHaveProperty('Activo');
  });
});

describe('resolveItemDefinition — error handling', () => {
  it('throws a descriptive error when itemId is not found', () => {
    const db = buildDb();
    expect(() => resolveItemDefinition('ITEM-BOGUS', db)).toThrow("item 'ITEM-BOGUS' not found");
  });

  it('throws when the categoria FK is dangling', () => {
    const db = buildDb();
    const brokenItems = [{ ...db.items[0], ID_Categoria: 'CAT-BOGUS' }];
    expect(() => resolveItemDefinition('ITEM-001', { ...db, items: brokenItems }))
      .toThrow("categoria 'CAT-BOGUS' not found");
  });

  it('throws when the resolved perfil FK is dangling', () => {
    const db = buildDb();
    const brokenPerfiles = db.perfiles.filter(p => p.ID_Perfil_Precio !== 'PP-001');
    expect(() => resolveItemDefinition('ITEM-001', { ...db, perfiles: brokenPerfiles }))
      .toThrow("perfil 'PP-001' not found");
  });
});
