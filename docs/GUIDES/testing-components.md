# Testing Components

Practical testing guide for the rebuild worktree.

## Stack

- Unit/integration: `Vitest`
- Browser E2E: `Playwright`

## Test Levels

1. **Domain unit tests**
   - Pure functions (pricing, quantity, formatting, rules helpers).
   - Fast and deterministic.
2. **Runtime integration tests**
   - Component + machine + projection contracts.
   - Examples: `basketMachine`, `catalogMachine`, `categoryMachine`.
3. **E2E flow tests**
   - Browser behavior against sandbox or GAS preview routes.

## Commands

```bash
# Full suite
npm test

# Watch mode
npm run test:watch

# E2E
npm run test:e2e
npm run test:e2e:headed
```

## Targeted Examples

```bash
npx vitest run packages/components/item/tests/Item.test.js
npx vitest run packages/components/basket/tests/basketMachine.test.js
npx vitest run packages/database/src/resolveItemDefinition.test.js
```

## E2E Notes

- Playwright specs live in `tests/e2e/**`.
- Keep unit assertions out of E2E tests; focus on user flows and integration behavior.
- Prefer stable selectors (roles, labels, text contracts) over brittle CSS chains.

## Recommended Coverage Priorities

1. pricing/rules correctness,
2. entry identity and mutation boundaries (`entryId` semantics),
3. day operations (copy/move/duplicate/remove),
4. stage transitions (`browse -> basket -> validation`),
5. persistence/export adapters when they are introduced.

Last update: 2026-03-11
