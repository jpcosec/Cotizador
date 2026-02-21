# XState Orchestration Architecture

## Role in System

XState is the middleware layer:

- Receives events from frontend.
- Uses loaded reference data in machine context.
- Calls pricing pipeline with context data.
- Persists through injected store/services (database-owned adapters).

## Core Machine

- Definition: `packages/xstate/src/Orchestration/quotationMachineBlueprint.js`
- Factory: `packages/xstate/src/Orchestration/quotationMachine.xstate.js`
- Adapters: `packages/xstate/src/Orchestration/adapters/*`

## Context Expectations

Machine context is expected to hold at least:

### Phase B Integration (Domain Model)
- `catalog` — Loaded `Catalog` instance (contains categories, items, profiles, rules)
- `basket` — Active `Basket` instance (manages selected items, day grouping, price calculation)

### Backward-Compat Flat Fields
- `quotation` — header and metadata
- `lineas` — flat array of line items (synced from basket.toSnapshot())
- `totals` — aggregate calculations (synced from basket)
- error/messages

### Reference Data & Dependencies
- loaded reference tables (now encapsulated in `catalog` object)
- injected `store`/service dependencies for persistence

## Data Flow (Phase B+)

1. **Initialization** — XState loads catalog at INIT via `initCatalog` action
2. **Basket Creation** — When quotation starts, `initializeEmptyBasket` creates `context.basket`
3. **Item Operations** — ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM delegate to `basket.add/update/remove()`
4. **Dual-Write** — Basket methods update domain objects + sync `context.lineas` and `context.totals` for backward compat
5. **Frontend Sync** — AlpineXStateBridge reads `basket.toDisplayObject()` when available

## Boundary Rules

- Frontend sends events and renders snapshots; no direct pricing/database logic.
- Domain basket owns item lifecycle and pricing delegation.
- Pricing stays pure (called by domain layer, not directly by XState actions).
- Database package owns persistence/store implementations.

## Test Snapshot

- Current: `79/79` xstate tests passing (includes Phase B domain integration).

Run:

```bash
cd /home/jp/CotizadorLodge/claps_codelab/packages/xstate
npm test
```
