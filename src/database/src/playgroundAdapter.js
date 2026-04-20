import { DATA_SCHEMA } from './Config_Schema.js';

function toSeedMap(seed = []) {
  return Object.fromEntries((seed || []).map(({ table, records }) => [table, records]));
}

export function seedToResolverDb(seed = []) {
  const seedMap = toSeedMap(seed);
  return {
    items: seedMap.ITEM_CATALOGO || [],
    categorias: seedMap.CATEGORIAS || [],
    perfiles: seedMap.PERFILES_PRECIO || [],
    perfilesInit: seedMap.PERFILES_INICIALIZACION || [],
    reglas: seedMap.REGLAS_NEGOCIO || [],
  };
}

export function getPrimaryKeyForTable(tableName, schema = DATA_SCHEMA) {
  const tableSchema = schema[tableName];
  if (!tableSchema) return '_id';
  const pk = (tableSchema.columns || []).find(
    (column) => column.type === 'PK' || column.type === 'PK/FK'
  );
  return pk ? pk.name : '_id';
}
