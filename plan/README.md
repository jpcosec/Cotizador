# Plan Index

Active implementation plan for urgent parity work.

## Urgent Track (U-series)

Priority-ordered. Hard dependency chain: U-1 → U-3 → U-4. U-2 runs in parallel with U-1.

| ID | Name | Goal | Status |
|---|---|---|---|
| U-1 | Save vertical slice | Confirm button saves quotation locally (CSV-simulated) | pending |
| U-2 | Editor basic drag&drop | Timeline drag/move/resize mapped to existing runtime events | pending |
| U-3 | GAS persistence | Same save working on real Google Sheets via Apps Script | pending |
| U-4 | PDF export | Generate PDF from saved quotation ID | pending |

## Dependency Graph

```
U-1 (save local) ──────────► U-3 (save GAS) ──────► U-4 (PDF)
       │
       │ (parallel)
       │
U-2 (editor drag&drop) ────► merges into U-3 (hora/duracion persist)
```

## Execution Order

1. Start U-1 and U-2 simultaneously (no dependency between them).
2. U-3 starts after U-1 is complete (needs SavePayload contract).
3. U-4 starts after U-3 is complete (needs `ID_Cotizacion` from real save).

## Phase Structure Per Plan

Each `U-*` folder contains:

- `objectives.md` — goal, artifacts produced, completion criteria, testing criteria
- `agent_guideline.md` — step-by-step implementation guide with subagent delegation
- `phases/README.md` — ordered phase index with go/no-go gates
- `phases/01_*.md` ... — individual phase specs

## Legacy Plans

Previous component-build plans (I-1, I-2, I-3, III-1, 0-cleanup) are archived in `plan/legacy/`.
They remain as reference for the structure and conventions used in this planning system.
