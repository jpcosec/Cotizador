# U-1 Save Vertical Slice - Agent Guideline

## Context

This track must start from legacy behavior already implemented in `claps_codelab`.
Do not design save/load as a blank slate.

Baseline to review first:

- `claps_codelab/Codigo.js` (router endpoints)
- `claps_codelab/Controller_Cotizacion.js` (service orchestration)
- `claps_codelab/Models.js` + `claps_codelab/SheetDB.js` (persistence behavior)
- `claps_codelab/Stores_App.html` (UI trigger sequence)

Run `npm test` after each step.

---

## Step 1 - Legacy extraction (mandatory)

Document what is already solved in legacy:

1. Save input semantics.
2. Save return semantics.
3. Load reconstruction semantics.
4. Save-before-PDF dependency.

Please priorotize copy/pasting then editing rather than reconstructing.

Output file:

- `packages/database/src/persistence/SavePayload.md` (first section: legacy behavior).

---

## Step 2 - Rebuild contract mapping

In the same contract document, add rebuild mapping:

1. Map runtime snapshot fields to `Config_Schema.js` transactional tables.
2. Define normalized response contract for `PersistencePort`.
3. Define ID strategy as pluggable policy (not hard-coded runtime rule).

---

## Step 3 - Implement pure serializer

Create serializer from runtime snapshot to transactional payload.

Rules:

- pure function,
- no store calls,
- deterministic mapping.

Add tests for:

- multi-day entries,
- overrides,
- empty/edge cases,
- ID policy injection.

---

## Step 4 - Implement PersistencePort and local adapter

Create/adjust:

- `PersistencePort` interface,
- `LocalPersistenceAdapter` implementation.

Rules:

- runtime never sees physical database details,
- adapter normalizes output to the port contract,
- save and load are both covered by tests.

---

## Step 5 - Runtime and UI wiring

Wire:

- `confirmSave()`
- `loadQuotation(id)`

in runtime and flow component, using only `PersistencePort`.

UI behavior:

- `Confirm & Save` active in validation,
- quotation ID visible in completed stage,
- error path visible when save fails.

---

## Step 6 - Validation

Validate in both:

1. sandbox route,
2. GAS preview route.

Checklist:

- save works,
- ID returned,
- load round-trip shape correct,
- no runtime dependency on adapter internals.

---

## What NOT to do

- Do not bypass `PersistencePort` from UI/runtime.
- Do not copy legacy DB schema directly into rebuild runtime.
- Do not lock ID format in runtime code.
- Do not postpone legacy extraction until after implementation.
