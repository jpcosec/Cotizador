---
id: pill-projection-first-ui
type: pattern
scope: domain
language: en
nature: context
status: active
depends_on:
  - pill-runtime-unit-hierarchy
---

## What
UI surfaces should render from serializable runtime projections, not from ad-hoc duplicated shell state.

## Why
The redesign is only useful if Alpine/GAS shells consume the same explicit runtime truth that playgrounds and tests validate.

## Where
- `gas/scripts/createQuotationFlowComponent.js`
- `gas/scripts/QuotationFlowRuntimeView.js`
- `playground/playground/generic-unit/`

## How
Every migration step should move data ownership into `runtimeProjection` and keep Alpine event handlers as signal dispatchers.
