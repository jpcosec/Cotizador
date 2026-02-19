# Step 02: InMemoryStore

**What:** Lightweight in-memory data store that mimics table-based lookups. Replaces Google Sheets during development.

**File:** `src/DataStore/InMemoryStore.js`

**API:**
- `seed(tableName, rows[])` — bulk load a table
- `insert(tableName, row)` — add single row
- `findById(tableName, pkField, id)` — lookup by primary key
- `findAll(tableName, filters?)` — filter by field equality
- `findByFK(tableName, fkField, value)` — foreign key lookup
- `all(tableName)` — return all rows

**Depends on:** Nothing.

**Test file:** `tests/unit/data_store.test.js`
- seed 3 rows → all() returns 3
- findById with valid ID → returns row
- findById with invalid ID → returns null
- findAll with filter → returns matching subset
- findByFK → returns all rows with matching FK
- insert → row retrievable immediately
