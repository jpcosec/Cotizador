---
id: pill-build-markers-contract
type: guardrail
scope: global
language: en
nature: context
status: active
depends_on: [pill-modular-composition]
---

## What
Immutable list of allowed build-time injection markers.

## Why
Prevents build failures caused by agents inventing new markers or deleting old ones.

## Allowed Markers
- `<!-- CATALOG_RUNTIME -->`: Injects the catalog search/list HTML.
- `<!-- BASKET_RUNTIME -->`: Injects the modular basket entries list.
- `<!-- SIDEBAR_UI -->`: Injects the global sidebar.
- `<!-- TIMELINE_UI -->`: Injects the vertical time grid.
- `<!-- MODALS_UI -->`: Injects all modal overlays.
- `<!-- THEME_STYLES -->`: Injects the global CSS theme.

## Constraint
The build script (`reset_gas_workspace.mjs`) must be updated to support these markers BEFORE they are used in templates.
