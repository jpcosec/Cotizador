# pricing (rebuild)

Shared pricing abstraction layer for rebuilt components.

Current module:

- `src/ItemLogic.js` (`class ItemLogic`)
  - resolves active pricing kind
  - resolves exclusive initialization mode
  - computes catalog disaggregated expression
  - computes basket aggregated quantity + total
  - exposes UI visibility flags and override semantics
  - owns item front-state lifecycle methods (`initialize`, `modifyQuantities` / `modify_quantities`)
  - returns render-ready projections (`toCatalogCard`, `toBasketLine`, `toMachineContext`)

This module is intended to sit between state orchestration and component rendering.
