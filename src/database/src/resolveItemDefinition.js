/**
 * resolveItemDefinition.js — 5-way join: item + categoria + perfil + perfilInit + reglas.
 *
 * Returns the `ResolvedItemDefinition` contract used by Item.fromDefinition()
 * and the III-1 resolver panel.
 *
 * Contract: see plan/III-1-resolver/field_contracts.md
 *
 * @param {string} itemId
 * @param {{ items, categorias, perfiles, perfilesInit, reglas }} db
 * @returns {ResolvedItemDefinition}
 * @throws {Error} if itemId is not found or any required FK is missing
 */
function parseConditionJson(conditionJson) {
  if (conditionJson == null) return null;
  if (typeof conditionJson === 'string') {
    try {
      return JSON.parse(conditionJson);
    } catch {
      return null;
    }
  }
  return conditionJson;
}

function nodeMentionsItemId(node) {
  if (node == null) return false;
  if (Array.isArray(node)) return node.some(nodeMentionsItemId);
  if (typeof node === 'object') {
    if (node.var === 'item.id') return true;
    return Object.values(node).some(nodeMentionsItemId);
  }
  return false;
}

function isItemIdVar(node) {
  return !!node && typeof node === 'object' && node.var === 'item.id';
}

function comparisonMatchesItemId(comparison, itemId) {
  if (!Array.isArray(comparison) || comparison.length < 2) return false;
  const [left, right] = comparison;
  return (isItemIdVar(left) && right === itemId) || (isItemIdVar(right) && left === itemId);
}

function nodeTargetsItemId(node, itemId) {
  if (node == null) return false;
  if (Array.isArray(node)) return node.some(child => nodeTargetsItemId(child, itemId));
  if (typeof node !== 'object') return false;

  for (const [op, value] of Object.entries(node)) {
    if ((op === '===' || op === '==') && comparisonMatchesItemId(value, itemId)) return true;
    if (nodeTargetsItemId(value, itemId)) return true;
  }
  return false;
}

export function resolveItemDefinition(itemId, db, visited = new Set()) {
  if (visited.has(itemId)) {
    throw new Error(`resolveItemDefinition: circular dependency detected for item '${itemId}'`);
  }
  visited.add(itemId);

  // ── 1. Item row ────────────────────────────────────────────────────────────
  const item = db.items.find(r => r.ID_Item === itemId);
  if (!item) throw new Error(`resolveItemDefinition: item '${itemId}' not found`);

  // ── 2. Categoria row ───────────────────────────────────────────────────────
  const categoria = db.categorias.find(r => r.ID_Categoria === item.ID_Categoria);
  if (!categoria) {
    throw new Error(
      `resolveItemDefinition: categoria '${item.ID_Categoria}' not found (required by '${itemId}')`
    );
  }

  // ── 3. Perfil row — item override wins, falls back to category default ─────
  const perfilId = item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default;
  if (!perfilId) {
    throw new Error(
      `resolveItemDefinition: no pricing profile resolvable for '${itemId}'`
    );
  }
  const perfil = db.perfiles.find(r => r.ID_Perfil_Precio === perfilId);
  if (!perfil) {
    throw new Error(
      `resolveItemDefinition: perfil '${perfilId}' not found (required by '${itemId}')`
    );
  }

  // ── 4. Perfil Init — item override wins, falls back to category default ─────
  const perfilInitId = item.ID_Perfil_Init_Override ?? categoria.ID_Perfil_Init_Default;
  const perfilInit = perfilInitId
    ? (db.perfilesInit ?? []).find(r => r.ID_Perfil_Init === perfilInitId)
    : null;

  // ── 5. Reglas — filter to ITEM scope, RESTRICCION_UI stage, active, sorted ─
  const reglas = (db.reglas ?? [])
    .filter(r =>
      r.Activo === true &&
      r.Scope === 'ITEM' &&
      r.Etapa === 'RESTRICCION_UI' &&
      (r.ID_Componente == null || r.ID_Componente === itemId)
    )
    .filter(r => {
      if (r.ID_Componente != null) return true;
      const condition = parseConditionJson(r.Condicion_JSON);
      if (!nodeMentionsItemId(condition)) return true;
      return nodeTargetsItemId(condition, itemId);
    })
    .sort((a, b) => (a.Prioridad ?? 0) - (b.Prioridad ?? 0))
    .map(r => ({
      ID_Regla:       r.ID_Regla,
      Nombre:         r.Nombre,
      Etapa:          r.Etapa,
      Scope:          r.Scope,
      ID_Componente:  r.ID_Componente ?? null,
      Tipo_Accion:    r.Tipo_Accion,
      Hook:           r.Hook ?? null,
      Condicion_JSON: r.Condicion_JSON ?? null,
      Payload_JSON:   r.Payload_JSON ?? null,
      Prioridad:      r.Prioridad,
      Acumulable:     r.Acumulable,
      Activo:         true,
    }));

  // ── 6. Assemble output — strip Updated_At from all nested objects ──────────
  return {
    // From ITEM_CATALOGO
    ID_Item:                       item.ID_Item,
    Nombre:                        item.Nombre,
    Default_Glosa:                 item.Default_Glosa ?? null,
    ID_Categoria:                  item.ID_Categoria,
    ID_Perfil_Precio_Override:     item.ID_Perfil_Precio_Override ?? null,
    ID_Perfil_Init_Override:       item.ID_Perfil_Init_Override ?? null,
    Activo:                        item.Activo,

    // From CATEGORIAS (full row, Updated_At stripped)
    categoria: {
      ID_Categoria:             categoria.ID_Categoria,
      Nombre:                   categoria.Nombre,
      ID_Perfil_Precio_Default: categoria.ID_Perfil_Precio_Default,
      ID_Perfil_Init_Default:   categoria.ID_Perfil_Init_Default ?? null,
      Def_Requiere_Pax:         categoria.Def_Requiere_Pax,
      Def_Requiere_Cant:        categoria.Def_Requiere_Cant,
      Def_Requiere_Tiempo:      categoria.Def_Requiere_Tiempo,
      Def_Requiere_Hora:        categoria.Def_Requiere_Hora,
      Icono_UI:                 categoria.Icono_UI ?? null,
      Activo:                   categoria.Activo,
    },

    // From PERFILES_PRECIO (resolved, Updated_At stripped)
    perfil: {
      ID_Perfil_Precio:      perfil.ID_Perfil_Precio,
      Nombre:                perfil.Nombre,
      Costo_Base_Fijo:       perfil.Costo_Base_Fijo,
      Costo_Unitario_Pax:    perfil.Costo_Unitario_Pax,
      Costo_Unitario_Tiempo: perfil.Costo_Unitario_Tiempo,
      Costo_Unitario_Item:   perfil.Costo_Unitario_Item,
      Activo:                perfil.Activo,
    },

    perfilInit: perfilInit ? {
      ID_Perfil_Init:      perfilInit.ID_Perfil_Init,
      Nombre:              perfilInit.Nombre,
      Duracion_Min:        perfilInit.Duracion_Min ?? 0,
      Unidades_Por_Pax:    perfilInit.Unidades_Por_Pax ?? 0,
      Unidades_Por_Hora:   perfilInit.Unidades_Por_Hora ?? 0,
      Minutos_Por_Usuario: perfilInit.Minutos_Por_Usuario ?? 0,
      Cantidad_Fija:       perfilInit.Cantidad_Fija ?? 0,
      Pax_Fijo:            perfilInit.Pax_Fijo ?? 0,
      Activo:              perfilInit.Activo,
    } : null,

    // From REGLAS_NEGOCIO (filtered, sorted)
    reglas,

    // ── 7. Composicion Kit (Children) ─────────────────────────────────────────
    children: (db.composicionKit || [])
      .filter(c => c.ID_Item_Padre === itemId)
      .map(c => {
        try {
          const resolvedChild = resolveItemDefinition(c.ID_Item_Hijo, db, new Set(visited));
          return {
            ID_Composicion: c.ID_Composicion,
            ID_Item_Hijo:   c.ID_Item_Hijo,
            Cantidad:       c.Cantidad,
            Tipo_Precio:    c.Tipo_Precio,
            resolved:       resolvedChild
          };
        } catch (e) {
          console.warn(`resolveItemDefinition: could not resolve child '${c.ID_Item_Hijo}' for parent '${itemId}': ${e.message}`);
          return null;
        }
      })
      .filter(child => child !== null),
  };
}
