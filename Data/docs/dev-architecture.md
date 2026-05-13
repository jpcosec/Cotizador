# Dev Architecture Docs

These documents live in the `dev` worktree under `legacy/docs/` and have not yet been promoted to `dev/docs/ARCHITECTURE/`. They are authoritative for the current runtime design.

## Architecture

- [`../../dev/legacy/docs/generic-unit.md`](../../dev/legacy/docs/generic-unit.md) — `GenericUnitBase` contract: lifecycle, mutation model, signal model, actor integration, boundary calls, projection vs snapshot.
- [`../../dev/legacy/docs/quotation-runtime-bridge.md`](../../dev/legacy/docs/quotation-runtime-bridge.md) — `QuotationFlowRuntimeView`: how the persisted quotation runtime is adapted into the `GenericViewBase` projection model.
- [`../../dev/legacy/docs/runtime-signals.md`](../../dev/legacy/docs/runtime-signals.md) — canonical signal vocabulary (`APPLY_MUTATION`, `ENTER_STAGE`, `REQUEST_SAVE`, `BOUNDARY_DONE`, etc.) and routing rules.
- [`../../dev/legacy/docs/persistence-boundary.md`](../../dev/legacy/docs/persistence-boundary.md) — local vs GAS persistence adapter contract, response shape, and integration with the persisted quotation runtime.

## Deployment

- [`../../dev/legacy/docs/deploy-checklist.md`](../../dev/legacy/docs/deploy-checklist.md) — pre-push validation steps, `clasp push` workflow, and live smoke test checklist.

## Active Dev Docs

The docs that are already in the right place:

- [`../../dev/docs/ARCHITECTURE/current-architecture.md`](../../dev/docs/ARCHITECTURE/current-architecture.md) — full runtime-first architecture reference.
- [`../../dev/docs/ARCHITECTURE/design-principles.md`](../../dev/docs/ARCHITECTURE/design-principles.md) — 10 engineering principles and coding standards.
- [`../../dev/docs/DEPLOYMENT/Gas_workflow.md`](../../dev/docs/DEPLOYMENT/Gas_workflow.md) — GAS build pipeline and local preview workflow.
- [`../../dev/docs/GUIDES/`](../../dev/docs/GUIDES/) — component authoring, testing, rules, and user-flow runner guides.
