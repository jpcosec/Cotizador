# pricing (rebuild)

Shared pricing abstraction layer for rebuilt components.

Current module:

- `src/itemPricingPolicy.js`
  - resolves active pricing kind
  - resolves exclusive initialization mode
  - computes catalog disaggregated expression
  - computes basket aggregated quantity + total
  - exposes UI visibility flags and override semantics

This module is intended to sit between state orchestration and component rendering.
