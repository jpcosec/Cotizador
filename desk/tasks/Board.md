# Tasks Board

> Single entry point for active work. Keep this file aligned with the codebase, test state, and current migration path.

## Active (status=open|in_progress)
| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|

## Blocked (status=blocked)
| ID | Domain | Blocker | Gate |
|----|--------|---------|------|

## Audit Notes
- 2026-04-21: Legacy `A-*`, `R-*`, `U-*`, and `V-*` desk tasks were cleared because they no longer reflect the current runtime-first redesign path.
- 2026-04-21: The runtime-first redesign was completed through `src/components/common/base/runtime/`, `gas/scripts/QuotationFlowRuntimeView.js`, and quotation shell synchronization in `gas/scripts/createQuotationFlowComponent.js`.
- 2026-04-21: Final validation passed: `npm test`, `npm run build`, and the full `user_flow.json` suite via `tools/userFlowRunner.mjs` completed successfully.
- 2026-04-21: Runtime redesign task files and pills were removed after knowledge flowed into code, docs, generated artifacts, and the `auto_user_test/` evidence set.
- Completed work should be derived from git history and changelog; this board only tracks active work and current blockers.
