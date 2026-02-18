# Recommendations

## Goal
Integrate the pricing engine and state-machine/event-driven workflow without duplicating business logic.

## Current Direction (pricing workspace)
This workspace (`~/claps_codelab_pricing`) already contains:
- Pricing/domain modules in `src/Pricing/`
- Event-driven scenario + events in `src/Scenarios/`, `src/Core/`, `src/Events/`
- Pipeline modules in `src/Pipeline/`
- Rules engine in `src/RulesEngine/` (and a second implementation in `src/Pipeline/rules_engine.js`)

## Main Recommendations
1. Keep the state machine as orchestration only.
   - Step transitions, event permissions, history, and command routing live in scenario/event layers.
   - Avoid putting pricing formulas or business math inside event handlers.

2. Keep pricing as a pure deterministic domain engine.
   - `src/Pricing/*.js` should be the single source of truth for calculations.
   - Inputs in, outputs out, minimal side effects.

3. Eliminate duplicated orchestration logic.
   - There is overlap between `src/Pipeline/pipeline.js` and `src/Events/quotation/basket/Recalculate.js`.
   - There is overlap between `src/RulesEngine/RulesEngine.js` and `src/Pipeline/rules_engine.js`.
   - Consolidate to one recalc path and one rules-engine implementation.

4. Introduce one integration boundary (recommended: `PricingService`).
   - Example API:
     - `PricingService.addItem(state, itemId, overrides, store)`
     - `PricingService.recalculate(state, store)`
     - `PricingService.removeItem(state, lineId, store)`
   - Event handlers call this service.
   - Pipeline scripts/tests call the same service.

## Testing Recommendations
Use a layered test strategy:
1. Domain tests: `tests/unit/pricing`, `tests/unit/rules_engine`
2. Integration tests: `tests/integration/full_pipeline.test.js`, `tests/integration/event_driven.test.js`
3. Scenario smoke checks: `npm run demo`
4. Manual exploratory checks: `npm run interactive`

## Cross-Workspace Coordination
Important: keep explicit alignment with `~/claps_codelab_xstate`.

Suggested split:
- `~/claps_codelab_pricing`
  - Owns pricing math, rule actions, totals/tax behavior, deterministic calculation contract.
- `~/claps_codelab_xstate`
  - Owns statechart modeling, workflow transitions, guards, side-effect orchestration, UI/app flow integration.

Recommended contract between both workspaces:
1. Define a stable engine I/O contract (input context, line inputs, output snapshot, messages/errors).
2. Have `~/claps_codelab_xstate` call the pricing service as a black box.
3. Share scenario fixtures between both repos to validate parity.
4. Add parity tests so the same scenario produces the same totals/messages in both environments.

## Next Refactor (proposed)
1. Create `src/Application/PricingService.js` (or similar) in this repo.
2. Move recalc orchestration there using current `src/Pricing/*` modules.
3. Update event handlers and pipeline wrappers to delegate to that service.
4. Remove deprecated duplicate rule/pipeline paths once tests pass.
