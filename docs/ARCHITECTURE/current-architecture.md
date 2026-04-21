# Current Architecture

## Purpose

This is the current architecture reference for the active `dev` worktree.

It replaces older docs that described the rebuild in terms of `packages/`, `apps/`, mixin migration drafts, or legacy parity analysis. The current system is organized around a runtime-first quotation architecture that must remain compatible with Google Apps Script deployment.

## Top-Level Structure

```text
src/          source runtime, domain, state, adapters
playground/   isolated runtime and UI experiments
gas/scripts/  build-time GAS generators and shell adapters
gas/          generated GAS deployment workspace
dist/         browser bundle output
tools/        local servers, shims, and dev runners
```

## Architectural Rule

The main design constraint is:

```text
runtime contracts must be explicit, serializable, Alpine-friendly, XState-friendly, and GAS-friendly
```

## Runtime Layers

### UI Layer

The UI is Alpine-based.

Responsibilities:

- render serializable projections
- dispatch user intent as explicit actions or signals
- avoid owning business truth

Main shell entry:

- `gas/scripts/createQuotationFlowComponent.js`

### Runtime and Orchestration Layer

The orchestration layer is XState-friendly and explicit.

Current runtime base lives in:

- `src/components/common/base/runtime/`

Core classes:

- `GenericUnitBase`
- `GenericViewBase`
- `GenericContainerBase`
- `GenericItemBase`
- `signals.js`

Detailed base contract:

- `docs/ARCHITECTURE/generic-unit.md`

These classes provide:

- initialization
- mutation handling
- signal routing
- actor integration
- projection and snapshot boundaries
- explicit external boundary calls

### Domain Layer

Business logic remains deterministic and isolated.

Important locations:

- `src/components/item/`
- `src/pricing/`
- `src/database/src/`

Examples:

- quantity resolution
- pricing formulas
- rule evaluation
- serialization of quotation payloads

### Integration Adapter Layer

External I/O is pushed into adapters and boundaries.

Important locations:

- `src/state/`
- `src/database/src/persistence/`
- `gas/scripts/`
- `tools/`

## Core Runtime Model

The quotation redesign is built around:

```text
View -> Container -> Item
```

### View

`View` coordinates:

- stages
- visible units
- shell-level projection
- boundary-oriented orchestration

Current quotation-specific adapter:

- `gas/scripts/QuotationFlowRuntimeView.js`

### Container

`Container` owns:

- explicit child registration
- recursive aggregation
- context propagation downward
- signal bubbling upward

Current generic implementation:

- `src/components/common/base/runtime/GenericContainerBase.js`

### Item

`Item` owns:

- local context
- quantities
- overrides
- pricing
- rules
- serializable item projection

Current runtime bridge:

- `src/components/common/base/runtime/GenericItemBase.js`

This wraps the existing item runtime and item machine instead of reimplementing pricing and rules logic from scratch.

## Quotation Flow Architecture

### Main App Entry

Main app assembly happens in:

- `gas/scripts/createQuotationFlowComponent.js`

This file creates the Alpine-facing quotation shell and wires:

- sidebar
- timeline
- item list
- modals
- quotation runtime
- runtime projection sync

### Persisted Quotation Runtime

Main state orchestration for save and load flow lives in:

- `src/state/createPersistedQuotationRuntime.js`

It combines:

- quotation internal runtime
- flow machine state (`browse`, `client`, `basket`, `validation`, `completed`, etc.)
- persistence boundary behavior

### Runtime Projection Sync

The shell adapter path is:

```text
quotation runtime snapshot
  -> QuotationFlowRuntimeView
  -> runtimeProjection
  -> Alpine shell fields
```

This is the migration seam that made the runtime-first redesign usable without rewriting the whole shell in one shot.

## Persistence Architecture

There are two persistence environments.

### Local Development

- `tools/serve-local.mjs`
- `tools/localPersistenceStore.js`
- `data/db.json`

### Real GAS

- generated `gas/Code.gs`
- Apps Script HTML service
- Google Sheets backend
- script property `COTIZADOR_SHEET_ID`

The same app-level behavior must survive both modes.

## Generated Artifact Architecture

Source code is not deployed directly.

The deployment pipeline is:

```text
src/ + gas/scripts/
  -> rollup bundle in dist/
  -> generated gas/*.html + gas/Code.gs
  -> clasp push
```

## Testing Architecture

The project validates behavior at three levels.

### Unit and integration tests

- `npm test`

### Playground validation

Important example:

- `playground/routes/generic-unit/index.html`

### Full local GAS E2E flow

- `user_flow.json`
- `tools/userFlowRunner.mjs`

This is the final local integrated validation gate.

## Current Stable Truths

- runtime logic lives in `src/`, not in generated `gas/`
- `gas/` is generated deployment output
- Alpine renders projections and should not own business truth
- XState and runtime layers own transitions and orchestration
- pricing and rules stay item-local and deterministic
- persistence and external I/O remain explicit boundaries
- GAS compatibility is a design constraint, not an afterthought

## Key Files To Read Together

- `src/components/common/base/runtime/`
- `src/state/createPersistedQuotationRuntime.js`
- `gas/scripts/QuotationFlowRuntimeView.js`
- `gas/scripts/createQuotationFlowComponent.js`
- `docs/DEPLOYMENT/Gas_workflow.md`
- `docs/ARCHITECTURE/quotation-runtime-bridge.md`
- `docs/ARCHITECTURE/runtime-signals.md`
- `docs/ARCHITECTURE/persistence-boundary.md`
- `desk/drawers/objective-design/`
