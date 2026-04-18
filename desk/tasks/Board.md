# Tasks Board

> Single entry point for all active work. Read this before starting any task.

## Execution Order

### Phase 1: Debt Reduction (Monsters)
*Priority: Immediate. Do not add logic to Monsters.*
- **A-01-x**: Atomize Item Component (667 lines)
- **A-02-x**: Atomize Item Logic (825 lines)

### Phase 2: Structural Modularization
*Priority: High. Prepare the ground for components.*
- **A-04-x**: Reorganize Views Folder (Geography)
- **R-0x-x**: Extract & Implement Component Controllers (Sidebar, Timeline, ItemList, Modals)

### Phase 3: Orchestration & Cleanup
- **R-05**: Refactor App Orchestrator (Monolithic GAS source)
- **A-03-x**: Refactor Playground Orchestrator (861 lines)

### Phase 4: Feature Expansion
- **V-04**: Groups / Packs Logic (Kits)
- **U-4**: PDF Export
- **V-06**: Excel Export
- **V-08**: Pack Editor UI

---

## Active Tasks

| ID | Domain | Task | Phase | Depends On | Pills |
|----|--------|------|-------|------------|-------|
| **A-03-1** | item | [UI] Extract Playground Templates | P3 | [A-00] | pill-srp-file-80-lines, pill-folder-structure-srp |
| **A-03-2** | item | [Logic] Extract Playground Controller | P3 | [A-03-1] | pill-srp-file-80-lines, pill-mandatory-docstrings |
| **A-03-3** | item | [Logic] Refactor Playground Orchestrator | P3 | [A-03-2] | pill-srp-file-80-lines, pill-mandatory-docstrings |
| **V-08** | database | Pack Editor UI | P4 | [V-04] | pill-pack-editor-ui |

## Completed

| ID | Domain | Task | Date |
|----|--------|------|------|
| A-00 | quality | Linter Enforcement Setup | 2026-04-17 |
| A-01-1 | item | [UI] Extract Item Templates | 2026-04-18 |
| A-01-2 | item | [Logic] Extract Item State & Projections | 2026-04-18 |
| A-01-3 | item | [Logic] Refactor Item Orchestrator | 2026-04-18 |
| A-02-1 | pricing | [Logic] Extract Pricing Enums & Helpers | 2026-04-18 |
| A-02-2 | pricing | [Logic] Refactor Pricing Detection | 2026-04-18 |
| A-02-3 | pricing | [Logic] Refactor Quantity Resolution | 2026-04-18 |
| A-02-4 | pricing | [Logic] Refactor Pricing Formulas | 2026-04-18 |
| A-04-1 | quotation | [Geography] Reorganize Timeline View | 2026-04-18 |
| A-04-2 | quotation | [Geography] Reorganize Basket View | 2026-04-18 |
| A-04-3 | quotation | [Geography] Reorganize Sidebar View | 2026-04-18 |
| R-01-1 | quotation | [UI] Finalize Sidebar Template | 2026-04-17 |
| R-01-2 | quotation | [Logic] Implement Sidebar Controller | 2026-04-17 |
| R-01-3 | quotation | [Integration] Sidebar Modularization | 2026-04-18 |
| R-02-1 | quotation | [UI] Extract Timeline Template | 2026-04-17 |
| R-02-2 | quotation | [Logic] Implement Timeline Controller | 2026-04-18 |
| R-02-3 | quotation | [Integration] Timeline Modularization | 2026-04-18 |
| R-03-1 | quotation | [UI] Extract Item List Template | 2026-04-17 |
| R-03-2 | quotation | [Logic] Implement Item List Controller | 2026-04-18 |
| R-03-3 | quotation | [Integration] Item List Modularization | 2026-04-18 |
| R-04-1 | quotation | [UI] Extract Modals Template | 2026-04-17 |
| R-04-2 | quotation | [Logic] Implement Modals Controller | 2026-04-18 |
| R-04-3 | quotation | [Integration] Modals Modularization | 2026-04-18 |
| R-05 | quotation | Refactor App Orchestrator | 2026-04-18 |
| U-1 | persistence | Save Vertical Slice | 2026-04-17 |
| V-04 | quotation | Groups / Packs Logic | 2026-04-18 |
| U-4 | quotation | PDF Export | 2026-04-18 |
| V-06 | quotation | Excel Export | 2026-04-18 |
