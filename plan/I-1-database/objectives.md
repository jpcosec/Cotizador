# I-1 Database — Objectives

## Goal

Establish the real database schema as the single source of truth for all component data. Produce a verified seed fixture and a `resolveItemDefinition()` adapter so every subsequent component receives data in the correct DB-native field names — no assumptions, no invented camelCase field aliases.

---

## What this step produces

| Artifact | Location |
|---|---|
| Verified seed fixtures (real field names) | `packages/database/src/seed.js` |
| Seed schema conformance tests | `packages/database/src/seed.test.js` |
| `resolveItemDefinition()` adapter | `packages/database/src/resolveItemDefinition.js` |
| Adapter tests | `packages/database/src/resolveItemDefinition.test.js` |
| Field contract document | `plan/I-1-database/field_contracts.md` |
| Interactive DB browser playground | `apps/sandbox/routes/step-I1-database/index.html` |

---

## Completion Criteria

- [ ] `seed.js` uses exact field names from `Config_Schema.js` for all four tables: `PERFILES_PRECIO`, `CATEGORIAS`, `ITEM_CATALOGO`, `REGLAS_NEGOCIO`
- [ ] `seed.test.js` passes and verifies field names match schema column names
- [ ] `resolveItemDefinition(itemId, db)` returns a fully joined item: the item row, its category row, its resolved pricing profile (item override wins over category default), and its rules filtered to `Scope='ITEM'` and `Etapa='RESTRICCION_UI'`
- [ ] `resolveItemDefinition` tests cover: no-override case, override case, missing item throws, FK integrity
- [ ] `field_contracts.md` documents the exact shape of the resolved definition (the contract every later component depends on)
- [ ] Playground is accessible at `http://localhost:8090/step-I1-database/`

---

## Testing Criteria

**Automated:**
```bash
npm test
# All tests pass, including the new seed and resolveItemDefinition tests
```

**Human (playground):**
- [ ] Can browse each table (PERFILES_PRECIO, CATEGORIAS, ITEM_CATALOGO, REGLAS_NEGOCIO) and see all seed rows with correct field names
- [ ] Selecting an item from the dropdown shows the fully resolved definition (joined category + profile + rules)
- [ ] The resolved shape visually matches `field_contracts.md`

---

## Key constraint

`resolveItemDefinition()` is a **pure function** — no side effects, no async, no state. It takes raw seed arrays and returns a plain object. This keeps it testable without a running server.
