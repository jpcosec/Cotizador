# Rebuild Roadmap

From-scratch sequence agreed for the new worktree.

## Current Status

| Step | Task | Status | Tests |
|------|------|--------|-------|
| 1 | `counter-basic` standalone (XState + Alpine) | ✅ Done | - |
| 2 | `counter-composed` (global + 2 local counters) | ✅ Done | - |
| 3.1 | Item UI layout (catalog card + basket line) | ✅ Done | - |
| 3.2 | User override protection (`isUserSet` tracking) | ✅ Done | 363 |
| 3.3 | JSON-Logic rules engine (RulesCoordinator + integration) | ✅ Done | 391 |
| 3b | Multi-item demo in sandbox (`/step-03b/`) | ✅ Done | - |
| 3.4 | Category profile inheritance | ⏳ Planned | - |
| 4/5 | `packages/database` + quotation flow DB integration | ✅ Done | 462 |
| 6 | `category` container component | 📋 Future | - |
| 7 | `catalog` component | 📋 Future | - |
| 8 | `basket` component | 📋 Future | - |
| 9 | `environment + item` | 📋 Future | - |
| 10 | `environment + all` | 📋 Future | - |

**Total tests passing:** 462 (as of 2026-02-26)

---

## Next Focus: DB Integration (Steps 4–5)

### Step 4: `db-viewer` Standalone

Port the production-ready database module from `claps_codelab/packages/database` into the component architecture.

**Goal:** A self-contained component that provides queryable DB access to all other components.

**Key design:**
- `packages/database/` — copy IStore interface + InMemoryStore + FileStore adapters
- `packages/database/src/Config_Schema.js` — 11-table schema (single source of truth)
- `packages/database/src/ModelFactory.js` — auto-generates models from schema
- `packages/database/src/createDatabase.js` — factory that wires adapter + models
- `apps/sandbox/routes/step-04/` — sandbox viewer for exploring DB contents

**Architecture decision (from DATABASE_VIEWER_COMPONENT_ANALYSIS.md):**
- Keep the DB module as a **plain JS factory** (not an XState actor)
- XState actors that need data call `db.ITEMS.all()`, `db.CATEGORIES.find(...)`, etc.
- The `db-viewer` sandbox wraps the factory in a minimal Alpine + XState UI for exploration

### Step 5: `item + db` Integration

Connect Item component to real DB definitions instead of hardcoded seeds.

**What changes in Item.js (per CODE_REVIEW_FINDINGS.md Critical issues):**
1. Replace hardcoded `'ITEM_DEMO'` / `'LIN_DEMO_001'` with `definition.id`
2. Pass `definition.id` to `RulesCoordinator` constructor
3. Replace CDN XState import in `itemMachine.js` with local npm import

**Data flow:**
```
DB.ITEM_CATALOGO.all() → Item.fromDefinition(row) → actor
DB.CATEGORIAS.find(...)  → item.receiveContext({ categoryDefaults })
DB.REGLAS_NEGOCIO.where(r => r.ID_Item === id) → passed as definition.rules
```

---

## Known Issues (from Code Review 2026-02-26)

See `CODE_REVIEW_FINDINGS.md` for full details.

### ✅ Fixed (2026-02-26)
- CDN import in `itemMachine.js` → replaced with local npm `xstate` import
- Hardcoded `'ITEM_DEMO'` IDs → now use `definition.id ?? 'ITEM_UNKNOWN'`
- `RulesCoordinator` now receives `definition.id` as `componentId`

### Should fix
- `RulesCoordinator` public properties → private fields
- Code duplication between `createItemStandaloneComponent.js` and `createItemMultiComponent.js`
- Humanization logic duplicated in 3 places
- No tests for `itemMachine.js`, mounting logic, or `ItemComponent.js`
- Clarify / document `ItemBase` status (orphaned mixin composition)

---

## Architecture Contracts (Stable)

These are established and should not change:

1. `receiveContext(patch)` — container pushes context down to items
2. `toDisplayObject()` — projection contract for Alpine
3. `SET_CONTEXT` event — container→item communication channel
4. `catalogCard` / `basketLine` getters — projection shapes for UI
5. `isUserSet` per quantity — override protection
6. `toSeed()` / `fromSeed()` — serialization round-trip

---

## Reference Docs

| File | Purpose |
|------|---------|
| `CODE_REVIEW_FINDINGS.md` | Architectural review findings (2026-02-26) |
| `DATABASE_VIEWER_COMPONENT_ANALYSIS.md` | DB module port design (Step 4) |
| `archive/PLAN_ITEM_REFACTOR.md` | Original Step 3 plan (completed) |
| `archive/SANDBOX_RULES_TESTING_PROPOSAL.md` | Step 3.3 design (implemented) |
| `archive/PLAN_NEXT_STEPS.md` | Pre-Step-3.3 next steps doc |
| `archive/LEGACY_VS_REBUILD_COMPARISON.md` | Package-by-package legacy comparison |
