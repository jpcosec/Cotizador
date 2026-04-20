# Step 03 tests

## Unit focus

- quantity initialization precedence (`defaults -> context -> overrides`)
- schedule precedence including `hora`
- profile text + deterministic totals
- override lock behavior under context updates
- rules output shape (`available`, `ruleErrors`, `ruleWarnings`, `appliedRules`)

## Playwright acceptance smoke (step-03b)

Spec file: `tests/e2e/step-03b.acceptance.spec.js`

1. Add DB item to factory and ship it -> appears in both catalog and basket.
2. Create custom item via modal and ship it -> appears in both columns.
3. Change global context -> non-overridden basket entity updates.
4. Set basket override -> context changes do not alter overridden quantity.
5. Clear/reset override -> entity follows global context again.
6. Trigger warning/error rule -> indicator parity in catalog and basket.

Run with:

- `npm run test:e2e`
- `npm run test:e2e:headed`
