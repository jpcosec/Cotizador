# item (Step 03)

Standalone item component with no database dependency.

External context modeled here:

- schedule: `dia`, `hora`, `duracionMin`
- quotation/global: `paxGlobal`
- definition: `name`, `category`, `description`, `pricingProfile`, `rules`, `defaultQuantities`

Quantity precedence:

1. item defaults
2. external context
3. explicit user overrides
