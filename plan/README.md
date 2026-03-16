# Plan Index

Active implementation plan for urgent parity work.

## Planning Rule (Critical)

U-series plans are migration-first for backend and service contracts, not greenfield.

Before creating new backend behavior, each track must port and align existing persistence and integration semantics from `claps_codelab/`.

UI implementation is rebuild-native and must follow component architecture:

- Alpine templates for projection and user intent,
- XState/runtime orchestration for transitions,
- pure domain logic for calculations/rules,
- adapter boundaries for DB and external services.

Legacy UI is a behavior reference, not an implementation template.

Primary legacy references:

- `claps_codelab/Codigo.js` (GAS router functions)
- `claps_codelab/Controller_Cotizacion.js` (save/load/pdf services)
- `claps_codelab/Models.js` + `claps_codelab/SheetDB.js` (data and persistence behavior)
- `claps_codelab/Stores_App.html` + `claps_codelab/Components_Timeline.html` (behavior reference for UI flow and interaction semantics)

Architecture policy reference:

- `docs/ARCHITECTURE/legacy-ui-recovery.md`

## Urgent Track (U-series)

Priority-ordered. Hard dependency chain: U-1 -> U-3 -> U-4. U-2 runs in parallel with U-1.

| ID | Name | Goal | Status |
|---|---|---|---|
| U-1 | Save vertical slice | Confirm saves quotation with legacy-compatible semantics | pending |
| U-2 | Editor basic | Preserve current editor semantics, then add drag/move/resize | pending |
| U-3 | GAS persistence | Run save/load against real Google Sheets (Apps Script) | pending |
| U-4 | PDF export | Generate PDF from saved quotation ID (save-first flow) | pending |

## Dependency Graph

```
U-1 (save contract + local adapter) -> U-3 (GAS save/load) -> U-4 (PDF)
                 |
                 +---- parallel ----> U-2 (editor UX)
```

## Execution Order

1. Start U-1 and U-2 simultaneously.
2. Start U-3 after U-1 phase 02 is complete (port boundary stable).
3. Start U-4 after U-3 phase 03 is complete (real saved IDs available).

## Phase Structure Per Plan

Each `U-*` folder contains:

- `objectives.md` - goal, artifacts produced, completion criteria, testing criteria.
- `agent_guideline.md` - implementation guidance with strict migration references.
- `phases/README.md` - ordered phase index with go/no-go gates.
- `phases/01_*.md`, `02_*.md`, `03_*.md` - individual phase specs.

## Legacy Plans

Previous component-build plans are archived in `plan/legacy/`.
They remain reference material for structure and implementation history.
