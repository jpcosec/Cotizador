# Pricing (Current)

## Module

- Path: `packages/pricing`
- Main orchestration entry: `src/Pricing/pipeline.js`
- Rule engine entry: `src/RulesEngine/RulesEngine.js`

## Pipeline Responsibilities

- Resolve line defaults (P/Q/T) from quotation context and catalog/rules.
- Compute base values from pricing profiles.
- Apply line and global rule adjustments.
- Apply taxes and produce final totals/messages/errors.

## Expected I/O

- Typical full recalc input:
  - `fullRecalculateBasket(lineas, quotation, store)`
- Typical output:
  - `{ lineas, totals, messages, errors }`

## Constraints

- Deterministic behavior is required for testability and replay readiness.
- No direct persistence calls inside pricing functions.
- Rule stages must remain explicit and ordered.

## Known Open Item

- Implement `CANTIDAD_DEFAULT` defaults behavior where marked TODO in pipeline.

See `../TODO_ACTIVE_NON_LEGACY.md` for active implementation checklist.
