---
id: pill-runtime-unit-hierarchy
type: model
scope: domain
language: en
nature: context
status: active
depends_on: []
---

## What
The redesign is organized around explicit runtime roles: `View -> Container -> Item`, all sharing `GenericUnit` mechanics.

## Why
The current quotation flow already contains these responsibilities implicitly, but they are mixed inside runtime shell code. Making them explicit reduces orchestration drift and gives a stable migration target.

## Where
- `src/components/common/base/runtime/`
- `gas/scripts/QuotationFlowRuntimeView.js`
- `desk/drawers/objective-design/view-runtime-contract.md`
- `desk/drawers/objective-design/view-component.md`

## How
`View` owns stages and orchestration, `Container` owns recursive aggregation and context fan-out, and `Item` owns local pricing/rules state.
