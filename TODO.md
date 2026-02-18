# Remaining Work - Quotation Engine & UI Design

**Last Updated:** 2026-02-18
**Status:** Core engine complete and tested. Ready for UI phase.

---

## ✅ COMPLETED WORK

### Phase 1: State Machine & Testing (DONE)
- ✅ State machine blueprint with explicit state IDs
- ✅ All 17 action handlers implemented (`src/Orchestration/adapters/actions.js`)
- ✅ All guards implemented with logic (`src/Orchestration/adapters/guards.js`)
- ✅ 59 tests passing (27 transitions + 16 parallel regions + 16 guard tests)
- ✅ Full documentation of determinism requirements

### Phase 2: File-Based Persistence (DONE)
- ✅ FileStore for quotation persistence (`src/DataStore/FileStore.js`)
- ✅ QuotationService high-level API (`src/QuotationService.js`)
- ✅ Working end-to-end example (`examples/create-quotation.js`)
- ✅ Documentation for usage (`docs/QUICKSTART_CREATING_QUOTATIONS.md`)

### Phase 3: Documentation (DONE)
- ✅ `docs/SYSTEM_READY_FOR_UI.md` - Architecture for UI developers
- ✅ `docs/TESTING_SUMMARY.md` - Test inventory and coverage
- ✅ `docs/future/EVENT_SOURCING_AND_REPLAY.md` - Determinism design (deferred impl)
- ✅ `docs/QUICKSTART_CREATING_QUOTATIONS.md` - Usage guide
- ✅ State shape documentation with examples

---

## 🎯 CURRENT PHASE: UI DESIGN

### Ready to Use
- **Entry point:** `src/QuotationService.js`
- **State shape:** Well-defined and documented
- **Persistence:** File-based JSON in `data/quotations/`
- **Example:** `npm run example` shows full workflow
- **All tests:** `npm test` (59/59 passing)

### Example Usage
```javascript
const service = new QuotationService();
const actor = service.startNew('CLI_CORP', 25, { fechaEvento: '2025-06-15' });
service.addItem('ITEM_CHINOOK');
service.validateAndSave();  // Saves to file automatically
```

---

## 🔴 HIGH PRIORITY - UI PHASE

### 1. **UI State Mapping**
Map XState states to UI views:
- `browse` → Quotation selection screen
- `quotation.basket` → Item list with add/remove/update
- `quotation.validation` → Review screen with confirm button
- `quotation.completed` → Success message + download

**Reference:** `docs/SYSTEM_READY_FOR_UI.md` (lines 153-162)

### 2. **UI Component Structure**
Create components for:
- Quotation header (client, date, pax)
- Item list (add, update, remove buttons)
- Price summary (subtotal + taxes)
- Action buttons (validate, save, cancel)
- Error display (blocking vs warnings)

### 3. **State Subscriptions**
Use XState actor.onSnapshot() to:
- Update UI when state changes
- Re-render when context updates
- Display errors from context.errors
- Show messages from context.messages

---

## 🟡 MEDIUM PRIORITY - BACKEND EXTENSIONS

### 4. **Clock Abstraction** (Determinism Prep)
Inject Clock & IdGenerator before event sourcing:
- Make Date.now() mockable in tests
- Generate reproducible quotation IDs
- Documented in `EVENT_SOURCING_AND_REPLAY.md` (Determinism Foundations section)

**Effort:** 2-3 hours
**Blocking:** Event sourcing implementation

### 5. **REST API Endpoints** (Optional)
Wrap QuotationService with REST routes:
- `POST /quotations` - startNew()
- `POST /quotations/{id}/items` - addItem()
- `PATCH /quotations/{id}/items/{lineId}` - updateItem()
- `POST /quotations/{id}/validate` - validateAndSave()
- `GET /quotations` - listSavedQuotations()
- `GET /quotations/{id}` - loadFromFile()

**Framework:** Express or equivalent

### 6. **Database Persistence** (Upgrade Path)
Replace FileStore with database:
- Maintain InMemoryStore interface
- Implement with SQLite/PostgreSQL
- Documented in `docs/SYSTEM_READY_FOR_UI.md` (lines 194-198)

**Migration strategy:** Implement DatabaseStore that extends FileStore logic

### 7. **PDF Generation**
Implement `generateQuotationPDF()` action:
- Use `pdfkit` or equivalent
- Template from saved quotation data
- Stub location: `src/Orchestration/adapters/actions.js` line ~270

### 8. **Event Sourcing** (Deferred)
Implement after Clock abstraction:
- Replay quotation creation from events
- Deterministic recalculation
- Documented design ready in `EVENT_SOURCING_AND_REPLAY.md`

---

## 🟢 LOW PRIORITY - POLISH

### 9. **Browse/Load UI**
Implement database_management states:
- Browse saved quotations with filters
- Load previous quotation to edit
- Delete quotations with confirmation
- State machine already supports this, adapters stubbed

### 10. **Composition Re-check**
Detect when composition structure changes:
- Compare current expanded items vs stored composition
- Alert user if underlying items changed prices
- Optional: auto-recalculate or prompt

### 11. **Performance Optimization**
- Benchmark LEVEL 1 vs LEVEL 2 recalc
- Profile rule evaluation
- Cache non-deterministic calculations where safe

### 12. **Error Recovery UI**
- Show soft-deleted items with recovery option
- Undo recent changes
- Compensation actions on validation failure

---

## 📋 Implementation Checklist

| Task | Phase | Effort | Status |
|------|-------|--------|--------|
| UI State Mapping | UI | 2h | 🔄 Next |
| Components | UI | 6-8h | 🔄 Next |
| State Subscriptions | UI | 2h | 🔄 Next |
| Clock Abstraction | Backend | 2-3h | ⏱️ Queue |
| REST API | Backend | 3-4h | ⏱️ Queue |
| Database Upgrade | Backend | 4-5h | ⏱️ Queue |
| PDF Generation | Backend | 2-3h | ⏱️ Queue |
| Event Sourcing | Backend | TBD | ⏱️ Deferred |

---

## 📚 Documentation References

| File | Purpose |
|------|---------|
| `docs/SYSTEM_READY_FOR_UI.md` | **Start here** - Architecture for UI devs |
| `docs/QUICKSTART_CREATING_QUOTATIONS.md` | Usage examples with code |
| `src/QuotationService.js` | Full API documentation in JSDoc |
| `docs/TESTING_SUMMARY.md` | Test coverage breakdown |
| `docs/future/EVENT_SOURCING_AND_REPLAY.md` | Future roadmap + Clock design |

---

## Test Commands

```bash
npm test                    # Run all 59 tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm run example             # End-to-end example
```

---

## Architecture Decision Records

1. **Two-worktree design** → Keeps pricing library independent
2. **File-based persistence** → MVP-ready, database upgrade path documented
3. **Soft deletes** → Keeps history for reproducibility
4. **LEVEL 1 & 2 recalculation** → Efficiency + correctness trade-off
5. **XState parallel regions** → Independent quote + database workflows

---

## Known Limitations

| Limitation | Impact | Upgrade Path |
|-----------|--------|--------------|
| File-based only | Single-machine MVP | Switch to DatabaseStore |
| In-memory catalog | Reloads per session | Cache master data in DB |
| No concurrency | Single quotation per instance | Use message queue/service |
| No event sourcing | Can't replay changes | Implement after Clock abstraction |
| No PDF yet | Manual download setup | Add pdfkit integration |

---

## Next Steps (Recommended Order)

1. **Build UI** with `QuotationService` as backend
2. Test state transitions from UI interactions
3. Handle errors and messages gracefully
4. Implement Clock abstraction for determinism
5. Add REST API wrapper
6. Plan database migration
7. Implement event sourcing

---

## Contact Points for Integration

- **Service initialization:** `new QuotationService()` singleton or per-session
- **State subscription:** `actor.onSnapshot(snap => { /* update UI */ })`
- **Event sending:** `service.addItem()`, `service.updateItem()`, etc.
- **Current state:** `service.getSnapshot()` or `service.inspect()`
- **Saved data:** `service.loadFromFile(id)` returns full quotation
- **Error handling:** Check `snap.context.errors` array for blocking issues
