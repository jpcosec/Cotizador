# Tasks Board

> Single entry point for active work. Keep this file aligned with the codebase, test state, and current migration path.

## Active (status=open|in_progress)
| ID | Domain | Task | Priority | Depends On | Pills |
|----|--------|------|----------|------------|-------|

## Blocked (status=blocked)
| ID | Domain | Blocker | Gate |
|----|--------|---------|------|

## Audit Notes
- 2026-04-20: Architecture docs imply the intended split is by runtime responsibility: `src/` for source/business logic, `playground/` for isolated component testing, `gas/` for build/deployment, and `tools/` for dev CLI. `desk/drawers/PROPOSED_STRUCTURE_V0.1.md` was rejected because it was an intermediate draft, not the final folder map.
- 2026-04-20: `A-03-*` implementation is now split into a fetched playground layout (`playground/playground/item/ui/ItemPlayground.html`), a dedicated controller (`playground/playground/item/ItemPlaygroundController.js`), and a thin mount entrypoint (`playground/playground/item/mountItemPlayground.js`).
- 2026-04-20: `V-08` local implementation now uses current `src/` imports in `playground/routes/pack-editor.html`, and `user_flow.json` includes `edit_pack_db` coverage.
- 2026-04-20: `npm test` is green again after fixing GAS runtime import paths and timeline display fallback behavior.
- 2026-04-20: Desk task artifacts have been normalized to current `src/`, `playground/`, and `gas/` paths; the legacy `apps/` / `packages/` drift in `desk/tasks/` is cleared.
- Completed work should be derived from git history and changelog; this board only tracks active work and current blockers.
