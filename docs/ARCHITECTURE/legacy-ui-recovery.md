# Legacy UI Recovery Policy

## Purpose

Define how we recover legacy quotation behavior from `claps_codelab` without reintroducing legacy implementation coupling.

This policy separates:

- backend and service compatibility requirements,
- frontend implementation architecture requirements.

## Core Rule

Legacy parity is contract-level, not implementation-level.

- Backend and integration behavior must remain compatible with proven legacy semantics.
- UI must be implemented with rebuild architecture: Alpine rendering, XState/runtime orchestration, pure domain logic, and adapter boundaries.

## Scope Split

### 1) Backend Compatibility (Migration-First)

These areas are migration-first and must preserve legacy semantics:

- GAS function compatibility and fallback method families.
- Save/load payload and response contracts.
- Persistence table behavior and shape compatibility (`COTIZACIONES`, `LINEA_DETALLE`, related fields).
- Save-first PDF orchestration contract (`save -> generate by quotation ID`).

Goal: same external behavior for persisted quotation workflows.

### 2) Frontend Implementation (Rebuild-Native)

These areas must follow rebuild architecture, not legacy UI implementation style:

- Alpine templates render state and dispatch user intent only.
- Runtime or component APIs own state mutations and transitions.
- Screen/state/event mapping remains explicit and documented.
- No direct storage or GAS transport calls from template logic.
- Component-level interaction contracts are reused across screens.

Goal: modern, testable UI architecture while preserving user-visible behavior.

## Design Principles (Deep Dive)

### 1. Behavior parity over markup parity

We preserve what the app does, not legacy HTML structure or CSS exactness.

### 2. Single mutation boundary

State changes must go through runtime/component methods and machine events, not ad-hoc template mutation.

### 3. Pure domain core

Pricing, quantity resolution, and rules evaluation stay in pure functions. UI and machine layers do not duplicate this logic.

### 4. Adapter-first integrations

Persistence and service I/O go through explicit ports/adapters (`PersistencePort`, GAS/local adapters). UI remains transport-agnostic.

### 5. Component contracts first

Catalog, basket, validation, and completion interactions must compose from component contracts, not page-specific patches.

### 6. Screen-state-event discipline

Every flow interaction should map cleanly to:

- screen (what user sees),
- state (business stage),
- event/action (transition trigger/effect).

### 7. No backend knowledge in templates

Alpine views should not encode persistence routes, sheet names, or GAS method decisions.

### 8. Parity through architecture, not exceptions

If legacy behavior is missing, extend runtime/adapters/contracts. Do not bypass architecture to get quick parity.

## Recovery Checklist

For each legacy capability recovered:

- [ ] Legacy behavior is documented as a contract (inputs, outputs, side effects, errors).
- [ ] Runtime command/event owner is identified.
- [ ] UI interaction is wired to runtime/component APIs only.
- [ ] Adapter boundary is identified for any persistence/service operation.
- [ ] Tests cover unit + integration + critical UI path.

## Conflict Resolution Rule

If legacy behavior and rebuild architecture appear to conflict:

1. Keep the legacy behavior contract.
2. Re-implement with rebuild layering.
3. Extend runtime/adapters if needed.
4. Document rationale in `changelog.md` and architecture docs.

## References

- `docs/ARCHITECTURE/component-architecture.md`
- `docs/ARCHITECTURE/app-flow-state-screen-foundation.md`
- `docs/ARCHITECTURE/app-flow-screen-by-screen-spec.md`
- `plan/README.md`
- `docs/plans/2026-03-04-legacy-functionality-recovery-mapping.md`
