# Phase 02 - PersistencePort and LocalPersistenceAdapter

## Context

Phase 01 produced a stable `serializeQuotation()` mapper. This phase builds the interface boundary that adapters implement, and a working local adapter for development and testing.

## Why

Separating persistence behind a port means the same runtime code works with InMemoryStore (local/tests), CSV files, or Google Sheets (GAS) without any changes to the quotation flow.

## How

1. Define `PersistencePort` as an abstract interface.
2. Implement `LocalPersistenceAdapter` using `createDatabase` models.
3. Write tests for save and load round-trips.

## Objectives

- [ ] `PersistencePort` interface defines `save(payload)` and `load(id)`.
- [ ] Both methods return `{ ok, id|data, error }` — never throw.
- [ ] `LocalPersistenceAdapter` constructor receives `{ models }` from `createDatabase()`.
- [ ] `save()` inserts into `COTIZACIONES` and `LINEA_DETALLE` models.
- [ ] `load()` finds cotizacion + matching lineas by `ID_Cotizacion`.
- [ ] Round-trip test: save → load → verify data integrity.
- [ ] Error case: load unknown ID returns `{ ok: false }`.
- [ ] All existing tests remain green.

## Subagent Instructions

### Subagent A - Implementation (general)

Files to create:
- `packages/database/src/persistence/PersistencePort.js`
- `packages/database/src/persistence/LocalPersistenceAdapter.js`
- `packages/database/src/persistence/LocalPersistenceAdapter.test.js`

Reference:
- `packages/database/src/IStore.js` (interface pattern)
- `packages/database/src/stores/InMemoryStore.js` (store operations)
- `packages/database/src/createDatabase.js` (model factory)
- Phase 01 mapper output shape

Write tests first, then implement.

## How To Test

### Automated
```bash
npx vitest run packages/database/src/persistence/LocalPersistenceAdapter.test.js
npm test
```

## Commit

`feat: add PersistencePort and LocalPersistenceAdapter`
