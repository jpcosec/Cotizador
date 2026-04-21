# Documentation Index

Technical documentation for the active rebuild worktree.

## Architecture

- `ARCHITECTURE/current-architecture.md` - current runtime-first architecture, source layout, and quotation flow wiring.
- `ARCHITECTURE/generic-unit.md` - base runtime contract shared by view, container, and item units.
- `ARCHITECTURE/quotation-runtime-bridge.md` - bridge from persisted quotation runtime into `GenericViewBase` projections.
- `ARCHITECTURE/runtime-signals.md` - canonical runtime signal vocabulary and usage.
- `ARCHITECTURE/persistence-boundary.md` - local vs GAS persistence contract and adapter model.
- `ARCHITECTURE/design-principles.md` - cross-cutting engineering principles for architecture and delivery.

## Guides

- `GUIDES/creating-a-component.md`
- `GUIDES/testing-components.md`
- `GUIDES/writing-rules.md`

## Deployment

- `DEPLOYMENT/Gas_workflow.md` - GAS build pipeline, local preview server, deployment, and validation workflow.
- `DEPLOYMENT/deploy-checklist.md` - final pre-push and live deploy checklist.

## Validation Guides

- `GUIDES/user-flow-runner.md` - how to use `user_flow.json` and `tools/userFlowRunner.mjs`.

## Operational References

- `../changelog.md` - major change history.

## Quick Commands

```bash
npm test
npm run serve:sandbox
npm run build
npm run dev:gas
```

Last update: 2026-04-21
