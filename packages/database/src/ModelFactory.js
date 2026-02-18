function inferPrimaryKey(columns) {
  const pkColumn = columns.find((column) => String(column.type || '').includes('PK'));
  return pkColumn ? pkColumn.name : '_id';
}

function buildModel({ tableName, schema, store }) {
  const columns = schema.columns || [];
  const primaryKey = inferPrimaryKey(columns);

  return {
    tableName,
    schema,
    primaryKey,

    all() {
      return store.all();
    },

    where(predicate) {
      return store.where(predicate);
    },

    find(predicate) {
      return store.find(predicate);
    },

    findById(id) {
      return store.find((record) => String(record[primaryKey]) === String(id));
    },

    create(data) {
      return store.insert(data);
    },

    update(data) {
      return store.update(data);
    },

    deleteById(id) {
      return store.deleteById(id);
    },

    truncate() {
      return store.truncate();
    },

    getColumns() {
      return store.getColumns();
    }
  };
}

export class ModelFactory {
  static createModels({ schema, storeFactory }) {
    const models = {};

    for (const [tableName, tableSchema] of Object.entries(schema)) {
      const store = storeFactory({
        tableName,
        schema: tableSchema,
        columns: tableSchema.columns || []
      });

      models[tableName] = buildModel({
        tableName,
        schema: tableSchema,
        store
      });
    }

    return models;
  }
}
