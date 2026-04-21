# Quotation Runtime Bridge

## Purpose

`QuotationFlowRuntimeView` is the migration bridge between the persisted quotation runtime and the new generic runtime model.

It exists so the current quotation shell can consume a `GenericViewBase`-style projection without requiring a full rewrite of the shell and all child views at once.

## Location

- `gas/scripts/QuotationFlowRuntimeView.js`

Main consumer:

- `gas/scripts/createQuotationFlowComponent.js`

## Why This Bridge Exists

The real quotation runtime already existed and already knew how to:

- manage quotation state
- move across stages
- build catalog, basket, and validation snapshots
- save and load quotations

But the redesign introduced a new runtime contract based on:

```text
GenericUnit -> GenericView -> projection-first shell sync
```

`QuotationFlowRuntimeView` lets the system keep the proven quotation runtime while exposing it through the new generic projection model.

## What It Does

`QuotationFlowRuntimeView` extends `GenericViewBase` and adapts an existing quotation runtime instance.

It is responsible for:

- subscribing to `runtime.getSnapshot()` updates
- mapping quotation runtime stages into `GenericViewBase` stages
- transforming quotation runtime data into a generic `runtimeProjection`
- exposing shell-friendly projection data under `projection.shell`

It is not responsible for:

- persistence implementation
- quotation calculations
- catalog or basket business logic
- direct DOM rendering

## Stage Model

The bridge normalizes the quotation flow into these stages:

```text
browse -> client -> basket -> validation
```

This keeps the generic runtime vocabulary aligned with the shell’s practical flow.

## Runtime Snapshot Mapping

The central method is:

- `receiveRuntimeSnapshot(snapshot)`

For each quotation runtime snapshot, it:

1. sends `ENTER_STAGE`
2. sends `APPLY_MUTATION`
3. patches generic context with:
   - `selectedClient`
   - `settings`
4. writes shell-facing derived data under `derived.shell`
5. updates `ui.title` and `ui.subtitle`
6. marks view status as `error` when persistence has an error

## Shell Projection Contract

The bridge adds a shell-specific projection shape:

```js
projection.shell = {
  selectedClient,
  settings,
  clientModalOpen,
  clients,
  catalogSummary,
  basketSummary,
  validationTotals,
  persistence,
}
```

This is what the Alpine quotation shell uses as compatibility glue while migration continues.

## Consumption Path

The current shell flow is:

```text
createPersistedQuotationRuntime()
  -> QuotationFlowRuntimeView
  -> runtimeProjection
  -> Alpine-facing shell state
```

Inside `createQuotationFlowComponent.js`, runtime updates are synchronized by:

- feeding snapshots into `runtimeView.receiveRuntimeSnapshot(snapshot)`
- reading `runtimeView.getProjection()`
- copying selected projection fields into the shell surface

This is what made it possible to migrate incrementally instead of replacing the quotation shell in a single step.

## Why It Matters Architecturally

Without this bridge, the new generic runtime layer would remain isolated in playgrounds.

With it, the real quotation shell can:

- stay operational
- adopt projection-first runtime behavior
- move closer to the `View -> Container -> Item` model
- preserve local and GAS behavior during migration

## Limits

`QuotationFlowRuntimeView` is a bridge, not the final ideal architecture.

It still reflects a hybrid state where:

- existing quotation runtime logic remains authoritative
- shell compatibility fields still exist
- runtime projection is partially adapted into legacy shell fields

That is acceptable because its purpose is controlled migration, not theoretical purity.

## Working Rule

If a new shell-facing quotation concern is needed during migration:

- prefer mapping it into `runtimeProjection.shell`
- avoid inventing new ad-hoc shell-only state when the runtime already owns the truth

## Related Docs

- `docs/ARCHITECTURE/current-architecture.md`
- `docs/ARCHITECTURE/generic-unit.md`
- `src/state/createPersistedQuotationRuntime.js`
