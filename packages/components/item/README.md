# item (Step 03)

Standalone item component with no database dependency.

Behavior contract:

- `LOGIC.md` defines pricing kind, initialization modes, catalog vs basket semantics, and override rules.

Architecture:

- Business logic class: `packages/pricing/src/ItemLogic.js`
- XState interaction adapter: `packages/xstate/src/interactions/ItemXStateInteraction.js`
- Item machine delegates reduction/projection to the interaction adapter.

External context modeled here:

- schedule: `dia`, `hora`, `duracionMin`
- quotation/global: `paxGlobal`
- definition: `name`, `category`, `description`, `pricingProfile`, `rules`, `defaultQuantities`

Quantity precedence:

1. item defaults
2. external context
3. explicit user overrides
