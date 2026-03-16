# Documentation Index

Technical documentation for the active rebuild worktree.

## Architecture

- `ARCHITECTURE/component-architecture.md` - current component layering and conventions.
- `ARCHITECTURE/design-principles.md` - cross-cutting engineering principles for architecture and delivery.
- `ARCHITECTURE/legacy-ui-recovery.md` - legacy parity scope split (backend contracts vs rebuild-native UI implementation).
- `ARCHITECTURE/item-component.md` - Item-specific behavior and contracts.
- `ARCHITECTURE/rules-engine-integration.md` - rule evaluation model.
- `ARCHITECTURE/app-flow-state-screen-foundation.md` - app flow base taxonomy (screen/state/event).
- `ARCHITECTURE/app-flow-screen-by-screen-spec.md` - screen contracts and transition matrix.
- `ARCHITECTURE/actor-ownership-drift-diagnostics.md` - actor ownership drift analysis.
- `ARCHITECTURE/mixins-style-drift-assessment.md` - mixin strategy drift assessment.
- `ARCHITECTURE/mixin-arch/` - deeper mixin architecture notes.
- `ARCHITECTURE/LEGACY_ARCHITECTURE.md` - legacy reference snapshot.

## Guides

- `GUIDES/creating-a-component.md`
- `GUIDES/testing-components.md`
- `GUIDES/writing-rules.md`

## Package Reference

- `PACKAGES/components.md` - package-level map for `packages/components/**`.

## Deployment

- `DEPLOYMENT/gas-bundling.md` - bundle generation, GAS workspace output, local preview.

## Plans and Design Maps

- `plans/2026-03-11-vistas-design-map.md` - implementation map from `Vistas.md` to rebuild status.
- `plans/2026-03-11-vistas-parallel-design-graph.md` - dependency graph for parallel implementation paths.
- `plans/2026-03-04-quotation-internal-rebuild-plan.md` - quotation internal runtime plan.
- `plans/2026-03-04-legacy-functionality-recovery-mapping.md` - legacy parity and recovery gaps.
- `plans/2026-03-04-legacy-quotation-ui-blueprint.md` - legacy UI layout blueprint.

## Active Implementation Plans (Urgent Track)

- `../plan/README.md` - plan index and dependency graph.
- `../plan/U-1-save/` - save vertical slice (local persistence).
- `../plan/U-2-editor/` - editor basic drag&drop (timeline grid).
- `../plan/U-3-gas/` - GAS persistence (Google Sheets).
- `../plan/U-4-pdf/` - PDF export.
- `../plan/implementation-status.json` - latest phase-by-phase execution status.

## Operational References

- `../changelog.md` - major change history.
- `../plan/legacy/` - archived component-build plans (I-1, I-3, III-1, etc.).

## Quick Commands

```bash
npm test
npm run serve:sandbox
npm run build
npm run dev:gas
```

Last update: 2026-03-15
