---
id: U-3
name: GAS Persistence
domain: persistence
status: pending
priority: p1
depends_on:
  - U-1
pills:
  - pill-gas-persistence-contract
  - pill-legacy-gas-integration
commit_messages:
  - feat: add GAS server functions for save/load
  - feat: implement GasSheetAdapter for PersistencePort
  - test: add GAS adapter integration tests
---

# U-3: GAS Persistence

## Goal

Port save/load behavior to real Google Sheets in Apps Script using the U-1 persistence boundary.

## Legacy Decisions

1. Router functions exposed via `google.script.run`
2. Service orchestration separated from model/store access
3. Sheet persistence through dedicated abstraction

## What This Produces

| Artifact | Location |
|----------|----------|
| GAS save/load server | `gas/Code.gs` |
| GAS adapter | `packages/database/src/persistence/GasSheetAdapter.js` |
| Local shim | `apps/gas/Local_GAS_Shim.html` |
| Runtime wiring | `bundling/createQuotationRuntime.js` |

---

## Phase 01: GAS Server

**Commit:** `feat: add GAS server functions for save/load`

### Objectives

- [ ] `guardarCotizacion` server function
- [ ] `cargarCotizacion` server function
- [ ] Legacy-compatible naming + aliases
- [ ] Sheet persistence logic

### Status: ⏳ Pending

---

## Phase 02: GAS Adapter

**Commit:** `feat: implement GasSheetAdapter for PersistencePort`

### Objectives

- [ ] `GasSheetAdapter` conforming to `PersistencePort`
- [ ] `google.script.run` integration
- [ ] Response normalization at boundary
- [ ] Local shim parity

### Status: ⏳ Pending

---

## Phase 03: Integration

**Commit:** `test: add GAS adapter integration tests`

### Objectives

- [ ] Real GAS deployment round-trip succeeds
- [ ] Smoke test protocol documented
- [ ] Concurrency and write safety documented
- [ ] All tests pass

### Status: ⏳ Pending

---

## Completion Criteria

- [ ] Server functions save and load quotation header + detail rows
- [ ] Function contract compatible with `google.script.run`
- [ ] `GasSheetAdapter` conforms to `PersistencePort`
- [ ] Local shim reproduces same contract
- [ ] Real GAS deployment round-trip succeeds
- [ ] Concurrency risks documented and mitigated
