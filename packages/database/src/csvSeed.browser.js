/**
 * csvSeed.browser.js — browser-compatible CSV loader using fetch.
 *
 * Mirrors the Node.js API of csvSeed.js, but replaces `fs.readFileSync`
 * with `fetch` so it can run in the browser (sandbox playground).
 *
 * Usage:
 *   import { loadSeedFromCsvUrl } from './csvSeed.browser.js';
 *   const seed = await loadSeedFromCsvUrl('/data/init');
 *   const db = createDatabase({ seed });
 *
 * Applies the same type coercions as csvSeed.js (booleans, numbers, JSON).
 */

// ── CSV parser (shared logic with Node csvSeed) ──────────────────────────────

function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nx = line[i + 1];
    if (ch === '"') {
      if (inQ && nx === '"') { cur += '"'; i++; }
      else inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) { cells.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

function parseCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(stripBom(lines[0])).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

// ── Type coercion (same as csvSeed.js) ──────────────────────────────────────

function toBool(v) {
  if (v === true || v === false) return v;
  return String(v).toLowerCase() === 'true';
}

function toNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullable(v) {
  return v === '' || v == null ? null : v;
}

function toJson(v) {
  if (!v || v === '') return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return v; }
}

const COERCE = {
  CLIENTES: row => ({
    ID_Cliente:     row.ID_Cliente,
    Nombre_Empresa: row.Nombre_Empresa,
    RUT:            row.RUT,
    Email:          row.Email,
    Telefono:       toNullable(row.Telefono),
    Updated_At:     row.Updated_At,
  }),
  PERFILES_PRECIO: row => ({
    ID_Perfil_Precio:       row.ID_Perfil_Precio,
    Nombre:                 row.Nombre,
    Costo_Base_Fijo:        toNum(row.Costo_Base_Fijo),
    Costo_Unitario_Pax:     toNum(row.Costo_Unitario_Pax),
    Costo_Unitario_Tiempo:  toNum(row.Costo_Unitario_Tiempo),
    Costo_Unitario_Item:    toNum(row.Costo_Unitario_Item),
    Activo:                 toBool(row.Activo),
    Updated_At:             row.Updated_At,
  }),
  PERFILES_INICIALIZACION: row => ({
    ID_Perfil_Init:      row.ID_Perfil_Init,
    Nombre:              row.Nombre,
    Duracion_Min:        toNum(row.Duracion_Min),
    Unidades_Por_Pax:    toNum(row.Unidades_Por_Pax),
    Unidades_Por_Hora:   toNum(row.Unidades_Por_Hora),
    Minutos_Por_Usuario: toNum(row.Minutos_Por_Usuario),
    Cantidad_Fija:       toNum(row.Cantidad_Fija),
    Pax_Fijo:            toNum(row.Pax_Fijo),
    Activo:              toBool(row.Activo),
    Updated_At:          row.Updated_At,
  }),
  CATEGORIAS: row => ({
    ID_Categoria:              row.ID_Categoria,
    Nombre:                    row.Nombre,
    ID_Perfil_Precio_Default:  toNullable(row.ID_Perfil_Precio_Default),
    ID_Perfil_Init_Default:    toNullable(row.ID_Perfil_Init_Default),
    Def_Requiere_Pax:          toBool(row.Def_Requiere_Pax),
    Def_Requiere_Cant:         toBool(row.Def_Requiere_Cant),
    Def_Requiere_Tiempo:       toBool(row.Def_Requiere_Tiempo),
    Def_Requiere_Hora:         toBool(row.Def_Requiere_Hora),
    Icono_UI:                  toNullable(row.Icono_UI),
    Activo:                    toBool(row.Activo),
    Updated_At:                row.Updated_At,
  }),
  ITEM_CATALOGO: row => ({
    ID_Item:                       row.ID_Item,
    Nombre:                        row.Nombre,
    ID_Categoria:                  row.ID_Categoria,
    ID_Perfil_Precio_Override:     toNullable(row.ID_Perfil_Precio_Override),
    ID_Perfil_Init_Override:       toNullable(row.ID_Perfil_Init_Override),
    Default_Glosa:                 toNullable(row.Default_Glosa),
    Activo:                        toBool(row.Activo),
    Updated_At:                    row.Updated_At,
  }),
  COMPOSICION_KIT: row => ({
    ID_Composicion: row.ID_Composicion,
    ID_Item_Padre:  row.ID_Item_Padre,
    ID_Item_Hijo:   row.ID_Item_Hijo,
    Cantidad:       toNum(row.Cantidad),
    Tipo_Precio:    row.Tipo_Precio,
    Updated_At:     row.Updated_At,
  }),
  REGLAS_NEGOCIO: row => ({
    ID_Regla:       row.ID_Regla,
    Nombre:         row.Nombre,
    Etapa:          row.Etapa,
    Scope:          row.Scope,
    ID_Componente:  null,
    Tipo_Accion:    row.Tipo_Accion,
    Hook:           toNullable(row.Hook),
    Condicion_JSON: toJson(row.Condicion_JSON),
    Payload_JSON:   toJson(row.Payload_JSON),
    Prioridad:      toNum(row.Prioridad),
    Acumulable:     toBool(row.Acumulable),
    Activo:         toBool(row.Activo),
    Updated_At:     row.Updated_At,
  }),
  COTIZACIONES: row => ({
    ID_Cotizacion: row.ID_Cotizacion,
    ID_Cliente:    row.ID_Cliente,
    Estado:        row.Estado,
    Fecha_Evento:  toNullable(row.Fecha_Evento),
    Duracion_Dias: toNum(row.Duracion_Dias),
    Pax_Global:    toNum(row.Pax_Global),
    Updated_At:    row.Updated_At,
  }),
  LINEA_DETALLE: row => ({
    ID_Linea:              row.ID_Linea,
    ID_Cotizacion:         row.ID_Cotizacion,
    ID_Item:               row.ID_Item,
    Estado_Linea:          row.Estado_Linea,
    Dia_Numero:            toNum(row.Dia_Numero),
    Hora_Inicio:           toNullable(row.Hora_Inicio),
    Override_Pax:          toNum(row.Override_Pax),
    Override_Cantidad:     toNum(row.Override_Cantidad),
    Override_Duracion_Min: toNum(row.Override_Duracion_Min),
    Comentarios:           toNullable(row.Comentarios),
    Updated_At:            row.Updated_At,
  }),
  AJUSTES_COTIZACION: row => ({
    ID_Ajuste:      row.ID_Ajuste,
    ID_Cotizacion:  row.ID_Cotizacion,
    ID_Linea:       row.ID_Linea,
    Tipo_Ajuste:    row.Tipo_Ajuste,
    Valor_Original: toNum(row.Valor_Original),
    Valor_Nuevo:    toNum(row.Valor_Nuevo),
    Motivo:         toNullable(row.Motivo),
    Usuario:        toNullable(row.Usuario),
    Updated_At:     row.Updated_At,
  }),
  CACHE_COTIZACION: row => ({
    ID_Cotizacion: row.ID_Cotizacion,
    Snapshot_JSON: toJson(row.Snapshot_JSON),
    Updated_At:    row.Updated_At,
  }),
  HISTORIAL_COTIZACION: row => ({
    ID_Log:         row.ID_Log,
    ID_Cotizacion:  row.ID_Cotizacion,
    Timestamp:      row.Timestamp,
    Usuario:        toNullable(row.Usuario),
    Accion:         row.Accion,
    Detalle_Cambio: toJson(row.Detalle_Cambio),
  }),
};

const DEFAULT_TABLES = Object.keys(COERCE);

/**
 * Fetch and parse CSV files from a base URL path.
 *
 * @param {string} baseUrl - URL prefix, e.g. '/data/init'
 * @param {string[]} [tables] - Which tables to load (defaults to the four catalog tables)
 * @returns {Promise<Array<{table: string, records: object[]}>>}
 */
export async function loadSeedFromCsvUrl(baseUrl, tables = DEFAULT_TABLES) {
  const results = await Promise.all(
    tables.map(async table => {
      const coerce = COERCE[table];
      if (!coerce) return null;
      try {
        const url = `${baseUrl}/${table}.csv`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[CSV] ${url} returned ${res.status}`);
          return null;
        }
        const text = await res.text();
        const records = parseCsv(text).map(coerce);
        console.log(`[CSV] Loaded ${table}: ${records.length} records`);
        return records.length > 0 ? { table, records } : null;
      } catch (err) {
        console.error(`[CSV] Failed to load ${table}:`, err.message);
        return null;
      }
    })
  );
  const loaded = results.filter(Boolean);
  console.log(`[CSV] Seed loaded: ${loaded.length}/${tables.length} tables`);
  return loaded;
}
