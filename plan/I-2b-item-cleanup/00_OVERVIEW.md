# I-2b: Item Component Cleanup & PERFILES_INICIALIZACION

## Problem Statement

The Item component in `packages/components/item/` accumulated dead code from multiple version merges and has gaps between what the domain functions support and what the DB/UI actually wire up.

**Three concrete problems:**
1. **DB schema gap**: `domain/pricing.js` supports init modes (`unidadesPorHora`, `minutosPorUsuario`, fixed pax/cantidad) that have no DB columns.
2. **Dead code**: `ItemComponent.js/html`, `RulesEditor.html` — remnants of old versions, nothing imports them.
3. **Missing wiring**: Machine has `SET_PROFILE_VALUE`/`SET_DEFAULT_QUANTITY` events but no UI sends them. Context zero-value bug sends string instead of number for 0.

## Steps

| Step | File | Description |
|------|------|-------------|
| 1 | `01_DEAD_CODE_CLEANUP.md` | Remove 3 dead files + 3 orphaned docs |
| 2 | `02_PERFILES_INICIALIZACION.md` | New DB table for all init parameters |
| 3 | `03_RESOLVER_UPDATE.md` | Update resolveItemDefinition 4-way → 5-way join |
| 4 | `04_ITEM_FROM_DEFINITION.md` | Map new perfilInit to Item.defaultQuantities |
| 5 | `05_CONTEXT_FIX.md` | Fix zero-value bug + wire missing machine methods |
| 6 | `06_UI_SEPARATION.md` | Split into production ItemDisplay + sandbox ResolverPanel |

## Execution Order

```
Step 1 ← independent, clean baseline
Step 2 ← schema + CSV seed
Step 3 ← depends on Step 2 (new table exists)
Step 4 ← depends on Step 3 (resolver returns perfilInit)
Step 5 ← independent (can parallel with 2-4)
Step 6 ← depends on Steps 4 + 5
```

## Current File Audit

| File | Status | Reason |
|------|--------|--------|
| `Item.js` | ACTIVE | Main business object |
| `ItemComponent.js` | DEAD | Nothing imports it |
| `ItemComponent.html` | DEAD | Nothing loads it |
| `domain/pricing.js` | ACTIVE | Pure pricing functions |
| `domain/quantity.js` | ACTIVE | Quantity resolution |
| `domain/formatting.js` | ACTIVE | Display text |
| `domain/schedule.js` | ACTIVE | Time/day resolution |
| `domain/time.js` | ACTIVE | Time utilities |
| `domain/index.js` | ACTIVE | Re-exports |
| `domain/rulesEngine/coordinator.js` | ACTIVE | Rules evaluation |
| `domain/rulesEngine/humanize.js` | ACTIVE | Imported by coordinator.js |
| `domain/rulesEngine/json-logic-esm.js` | ACTIVE | JSON-Logic lib |
| `machine/itemMachine.js` | ACTIVE | XState machine |
| `logic/createItemStandaloneComponent.js` | ACTIVE | Sandbox route loader |
| `logic/createItemMultiComponent.js` | ACTIVE | Multi-item grid |
| `ui/ItemStandalone.html` | ACTIVE | Current template (will be split in Step 6) |
| `ui/RulesEditor.html` | DEAD | Nothing loads it |
