# Design Principles

## Purpose

Define the non-negotiable engineering principles for this rebuild.

These principles guide implementation choices across components, runtime flows, persistence integrations, and UI behavior.

## Core Principles

### 1) Clear Layer Boundaries

Architecture is always separated as:

- Alpine.js UI (projection and intent dispatch)
- XState/runtime orchestration (transitions and workflow)
- Domain logic (pure calculations and rules)
- Integration adapters (DB, GAS, PDF, external I/O)

No layer should absorb responsibilities from another layer.

### 2) Behavior Contracts Over Implementation Parity

Legacy behavior is recovered by preserving contracts (inputs, outputs, side effects), not by copying legacy implementation patterns.

- Backend/service behavior: migration-first.
- UI implementation: rebuild-native.

See `docs/ARCHITECTURE/legacy-ui-recovery.md`.

### 3) Single Mutation Boundary

State mutations must happen through runtime/component APIs and machine events.

- Templates do not mutate business objects directly.
- Ad-hoc UI side effects are not valid mutation paths.

### 4) Pure Domain Core

Pricing, quantity, formatting, and rule evaluation remain deterministic and side-effect free.

- No DB access from domain.
- No UI state reads in domain functions.
- No transport concerns in domain outputs.

### 5) Adapter-First External I/O

Persistence and service operations are accessed through interfaces/ports.

- Runtime is storage-agnostic.
- Local and GAS adapters must conform to the same contract.
- UI is unaware of transport/backend specifics.

### 6) Component Contract Consistency

All components follow the standard package structure and behavior contracts:

- class + machine + logic + domain + UI + tests + `STATE_CONTRACT.md`
- public methods are explicit and stable
- `toDisplayObject()` is the UI snapshot boundary

### 7) Screen/State/Event Discipline

Every user flow must map explicitly to:

- screen (what user sees),
- state (business stage),
- event/action (transition trigger or effect).

Ambiguous flow logic in templates is considered drift.

### 8) Testability by Design

Each layer should be testable in isolation:

- domain unit tests,
- runtime/integration tests,
- critical UI path verification.

If behavior cannot be tested cleanly, architecture is likely leaking concerns.

### 9) Documentation Is Part of Delivery

Major behavioral or architectural changes must update:

- relevant architecture/guides docs,
- module-local docs/contracts,
- `changelog.md`.

### 10) Simplicity and Explicitness

Prefer small, clear, self-explanatory functions and explicit contracts over implicit coupling.

- keep code paths obvious,
- avoid hidden magic and cross-layer shortcuts,
- prefer composition through interfaces.

## Decision Rule for Tradeoffs

When two approaches compete, choose the option that:

1. Preserves external behavior contract,
2. Keeps layer boundaries intact,
3. Improves testability,
4. Reduces coupling for future features.

## Related Docs

- `docs/ARCHITECTURE/component-architecture.md`
- `docs/ARCHITECTURE/legacy-ui-recovery.md`
- `docs/ARCHITECTURE/app-flow-state-screen-foundation.md`
- `docs/ARCHITECTURE/app-flow-screen-by-screen-spec.md`
- `plan/README.md`
