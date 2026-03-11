# Components Package Reference

Location: `packages/components/`

## Purpose

Contains reusable component runtimes (machines, UI sections, tests) used by sandbox routes and GAS quotation flow assembly.

## Current Component Packages

- `item/` - core item runtime (`catalog` and `basket` modes), pricing/quantity/rules projections.
- `category/` - category-level runtime over item actors.
- `catalog/` - multi-category orchestration runtime.
- `basket-day/` - single-day basket runtime with entry-level operations.
- `basket/` - multi-day basket orchestration runtime.
- `quotation/` - modal/view classes used in quotation app composition.
- `common/` - shared base classes, mixins, and style tokens.

Legacy demo packages retained for historical reference:

- `counter-basic/`
- `counter-composed/`

## Integration Boundary

- Reusable runtime logic stays in `packages/components/**`.
- App-level mounting, route wiring, and sandbox setup live in:
  - `apps/sandbox/playground/**`
  - `apps/quotation/playground/**`

## Core Runtime Composition

The active quotation flow composes these contracts:

1. `createCatalogActor()` from `catalog/machine/catalogMachine.js`
2. `createBasketActor()` from `basket/machine/basketMachine.js`
3. Shared item UI sections from `item/ui/playgroundItemSections.js`

## Testing

Run package-level and integration tests from repo root:

```bash
npm test
```

Run selected suites:

```bash
npx vitest run packages/components/item/tests/Item.test.js
npx vitest run packages/components/basket/tests/basketMachine.test.js
npx vitest run packages/components/catalog/tests/catalogMachine.test.js
```

Last update: 2026-03-11
