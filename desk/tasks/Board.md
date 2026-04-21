# Tasks Board

> Single entry point for active work. Keep this file aligned with the codebase, test state, and current migration path.

## Active (status=open|in_progress)
| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|
| RD-01 | runtime | Consolidate `GenericUnit` runtime kernel | p0 | - | `pill-runtime-unit-hierarchy` |
| RD-02 | quotation | Migrate quotation shell to `runtimeProjection` | p0 | `RD-01` | `pill-runtime-unit-hierarchy`, `pill-projection-first-ui` |
| RD-03 | quotation | Adopt real quotation `Container` and `Item` units | p0 | `RD-01`, `RD-02` | `pill-runtime-unit-hierarchy`, `pill-projection-first-ui` |
| RD-04 | runtime | Unify runtime boundaries and rebuild artifacts | p1 | `RD-02`, `RD-03` | `pill-projection-first-ui` |
| RD-05 | qa | Run full `user_flow.json` suite as final redesign gate | p0 | `RD-04` | `pill-user-flow-final-gate` |

## Blocked (status=blocked)
| ID | Domain | Blocker | Gate |
|----|--------|---------|------|

## Audit Notes
- 2026-04-21: Legacy `A-*`, `R-*`, `U-*`, and `V-*` desk tasks were cleared because they no longer reflect the current runtime-first redesign path.
- 2026-04-21: The active track is now the runtime-first redesign documented in `desk/drawers/objective-design/` and implemented under `src/components/common/base/runtime/`.
- 2026-04-21: `user_flow.json` is the required final gate after rebuild; the redesign is not complete until `tools/userFlowRunner.mjs` passes the full lifecycle.
- Completed work should be derived from git history and changelog; this board only tracks active work and current blockers.
