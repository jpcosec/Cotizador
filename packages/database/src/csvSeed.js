import fs from 'node:fs';
import path from 'node:path';

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
  const clientesModel = ensureModel(models, 'CLIENTES');
  const categoriasModel = ensureModel(models, 'CATEGORIAS');
  const itemsModel = ensureModel(models, 'ITEM_CATALOGO');

  if (truncate) {
    clientesModel.truncate();
    categoriasModel.truncate();
    itemsModel.truncate();
  }

  const clientesPath = path.resolve(dataDir, 'Cotizador - CLIENTES.csv');
  const itemsPath = path.resolve(dataDir, 'Cotizador - Items.csv');

  const clientesResult = importCsvIntoModel({
    model: clientesModel,
    filePath: clientesPath,
    columnMap: {
      ID_Cliente: 'ID_Cliente',
      Nombre_Empresa: 'Nombre_Empresa',
      RUT: 'RUT',
      Email: 'Email',
      Telefono: 'Telefono'
    },
    transformRow: (mappedRow) => ({
      ...mappedRow,
      Updated_At: toIsoNow()
    })
  });

  const rawItems = parseCsv(fs.readFileSync(itemsPath, 'utf8'));
  const categoriesByName = new Map();
  const itemNameCounter = new Map();

  for (const row of rawItems) {
    const categoryName = String(row.Categoria || '').trim();
    if (!categoryName) continue;

    if (!categoriesByName.has(categoryName)) {
      const baseId = `CAT_${slugify(categoryName, 'GEN')}`;
      let candidate = baseId;
      let suffix = 2;
      while (categoriasModel.findById(candidate)) {
        candidate = `${baseId}_${suffix++}`;
      }

      categoriesByName.set(categoryName, candidate);
      categoriasModel.create({
        ID_Categoria: candidate,
        Nombre: categoryName,
        Activo: true,
        Updated_At: toIsoNow()
      });
    }

    const itemName = String(row.Item || '').trim();
    if (!itemName) continue;

    const normalizedName = itemName.toUpperCase();
    const seen = itemNameCounter.get(normalizedName) || 0;
    itemNameCounter.set(normalizedName, seen + 1);

    const suffix = seen > 0 ? `_${seen + 1}` : '';
    const itemId = `ITEM_${slugify(itemName, 'SIN_NOMBRE')}${suffix}`;

    itemsModel.create({
      ID_Item: itemId,
      Nombre: itemName,
      ID_Categoria: categoriesByName.get(categoryName),
      Activo: true,
      Updated_At: toIsoNow()
    });
  }

  return {
    clientes: clientesResult,
    categorias: categoriasModel.all().length,
    items: itemsModel.all().length
  };
}
