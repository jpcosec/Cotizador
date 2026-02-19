import fs from 'node:fs';
import path from 'node:path';
import { DATA_SCHEMA } from './schema.js';

function stripBom(value) {
  if (!value) return value;
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function normalizeHeader(value) {
  return stripBom(String(value || '')).trim();
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(content) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const row = {};

    headers.forEach((header, columnIndex) => {
      row[header] = values[columnIndex] ?? '';
    });

    rows.push(row);
  }

  return rows;
}

function slugify(value, fallback) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
}

function toIsoNow() {
  return new Date().toISOString();
}

function parseLegacyMoney(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/\$/g, '').replace(/\s/g, '');
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  let normalized = cleaned;
  if (hasDot && hasComma) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dedupeByPrimaryKey(rows, primaryKey) {
  const map = new Map();
  for (const row of rows) {
    const id = String(row[primaryKey] || '').trim();
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, row);
    }
  }
  return Array.from(map.values());
}

function toBooleanByNumber(value) {
  return Number(value || 0) > 0;
}

function createUniqueId(base, registry) {
  let candidate = base;
  let suffix = 2;
  while (registry.has(candidate)) {
    candidate = `${base}_${suffix++}`;
  }
  registry.add(candidate);
  return candidate;
}

export function parseV1CsvToSchemaRows({ dataDir, schema = DATA_SCHEMA, now = toIsoNow() }) {
  const clientesPath = path.resolve(dataDir, 'Cotizador - CLIENTES.csv');
  const itemsPath = path.resolve(dataDir, 'Cotizador - Items.csv');

  const clientesRows = parseCsv(fs.readFileSync(clientesPath, 'utf8'));
  const itemsRows = parseCsv(fs.readFileSync(itemsPath, 'utf8'));

  const rowsByTable = {};
  for (const tableName of Object.keys(schema)) {
    rowsByTable[tableName] = [];
  }

  rowsByTable.CLIENTES = dedupeByPrimaryKey(
    clientesRows.map((row) => ({
      ID_Cliente: String(row.ID_Cliente || '').trim(),
      Nombre_Empresa: String(row.Nombre_Empresa || '').trim(),
      RUT: String(row.RUT || '').trim(),
      Email: String(row.Email || '').trim(),
      Telefono: String(row.Telefono || '').trim(),
      Updated_At: now
    })),
    'ID_Cliente'
  );

  const categoryIds = new Set();
  const profileIds = new Set();
  const itemIds = new Set();

  const categoryState = new Map();

  for (const row of itemsRows) {
    const categoryName = String(row.Categoria || '').trim();
    const itemName = String(row.Item || '').trim();
    if (!categoryName || !itemName) continue;

    const fixed = parseLegacyMoney(row['Valor Fijo'] || row['Valor Original']);
    const perPax = parseLegacyMoney(row['Valor por persona']);
    const requiresPax = toBooleanByNumber(perPax);
    const requiresTime = String(row.Horario || '').trim() !== '';

    let category = categoryState.get(categoryName);
    if (!category) {
      const categoryId = createUniqueId(`CAT_${slugify(categoryName, 'GEN')}`, categoryIds);
      category = {
        categoryId,
        categoryName,
        defaultProfileId: null,
        requiresPax,
        requiresCant: false,
        requiresTime,
        requiresHour: requiresTime,
        durationMin: requiresTime ? 480 : 0,
        unitsPerPax: requiresPax ? 1 : 0,
        icon: ''
      };
      categoryState.set(categoryName, category);
    } else {
      category.requiresPax = category.requiresPax || requiresPax;
      category.requiresTime = category.requiresTime || requiresTime;
      category.requiresHour = category.requiresHour || requiresTime;
    }

    const profileId = createUniqueId(`PROF_${slugify(itemName, 'ITEM')}`, profileIds);
    const itemId = createUniqueId(`ITEM_${slugify(itemName, 'SIN_NOMBRE')}`, itemIds);

    rowsByTable.PERFILES_PRECIO.push({
      ID_Perfil_Precio: profileId,
      Nombre: `Perfil ${itemName}`,
      Costo_Base_Fijo: fixed,
      Costo_Unitario_Pax: perPax,
      Costo_Unitario_Tiempo: 0,
      Costo_Unitario_Item: 0,
      Activo: true,
      Updated_At: now
    });

    rowsByTable.ITEM_CATALOGO.push({
      ID_Item: itemId,
      Nombre: itemName,
      ID_Categoria: category.categoryId,
      ID_Perfil_Precio_Override: profileId,
      Def_Unidades_Por_Pax_Override: requiresPax ? 1 : '',
      Activo: true,
      Updated_At: now
    });

    if (!category.defaultProfileId) {
      category.defaultProfileId = profileId;
    }
  }

  for (const category of categoryState.values()) {
    rowsByTable.CATEGORIAS.push({
      ID_Categoria: category.categoryId,
      Nombre: category.categoryName,
      ID_Perfil_Precio_Default: category.defaultProfileId || '',
      Def_Requiere_Pax: category.requiresPax,
      Def_Requiere_Cant: category.requiresCant,
      Def_Requiere_Tiempo: category.requiresTime,
      Def_Requiere_Hora: category.requiresHour,
      Def_Duracion_Min: category.durationMin,
      Def_Unidades_Por_Pax: category.unitsPerPax,
      Icono_UI: category.icon,
      Activo: true,
      Updated_At: now
    });
  }

  return rowsByTable;
}

function ensureModel(models, tableName) {
  const model = models[tableName];
  if (!model) {
    throw new Error(`Model not found for table "${tableName}"`);
  }
  return model;
}

export function importCsvIntoModel({ model, filePath, columnMap = {}, transformRow, truncate = false }) {
  const absPath = path.resolve(filePath);
  const raw = fs.readFileSync(absPath, 'utf8');
  const rows = parseCsv(raw);

  if (truncate) {
    model.truncate();
  }

  let imported = 0;
  for (const sourceRow of rows) {
    const mapped = {};
    for (const [sourceColumn, targetColumn] of Object.entries(columnMap)) {
      mapped[targetColumn] = sourceRow[sourceColumn];
    }

    const baseRow = Object.keys(columnMap).length > 0 ? mapped : sourceRow;
    const nextRow = transformRow ? transformRow(baseRow, sourceRow) : baseRow;

    if (!nextRow) {
      continue;
    }

    model.create(nextRow);
    imported += 1;
  }

  return {
    tableName: model.tableName,
    filePath: absPath,
    totalRows: rows.length,
    importedRows: imported
  };
}

export function seedFromCsvConfig({ models, imports = [] }) {
  return imports.map((entry) => {
    const model = ensureModel(models, entry.tableName);
    return importCsvIntoModel({
      model,
      filePath: entry.filePath,
      columnMap: entry.columnMap,
      transformRow: entry.transformRow,
      truncate: entry.truncate
    });
  });
}

export function seedFromV1Csv({ models, dataDir, truncate = true }) {
  const rowsByTable = parseV1CsvToSchemaRows({ dataDir });

  const insertedCounts = {};

  for (const [tableName, rows] of Object.entries(rowsByTable)) {
    const model = models[tableName];
    if (!model) continue;

    if (truncate) {
      model.truncate();
    }

    let inserted = 0;
    for (const row of rows) {
      model.create(row);
      inserted += 1;
    }
    insertedCounts[tableName] = inserted;
  }

  return {
    type: 'v1',
    rowsByTable: insertedCounts,
    clientes: insertedCounts.CLIENTES || 0,
    categorias: insertedCounts.CATEGORIAS || 0,
    perfilesPrecio: insertedCounts.PERFILES_PRECIO || 0,
    items: insertedCounts.ITEM_CATALOGO || 0
  };
}
