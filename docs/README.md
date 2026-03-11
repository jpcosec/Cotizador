# Documentation Index

Technical documentation for the active rebuild worktree.

## Architecture

- `ARCHITECTURE/component-architecture.md` - current component layering and conventions.
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
- `plans/2026-03-04-quotation-internal-rebuild-plan.md` - quotation internal runtime plan.
- `plans/2026-03-04-legacy-functionality-recovery-mapping.md` - legacy parity and recovery gaps.
- `plans/2026-03-04-legacy-quotation-ui-blueprint.md` - legacy UI layout blueprint.

## Operational References

- `../plan/implementation-status.json` - latest phase-by-phase execution status.
- `../changelog.md` - major change history.

## Quick Commands

```bash
npm test
npm run serve:sandbox
npm run build
npm run dev:gas
```

Last update: 2026-03-11
