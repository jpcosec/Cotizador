# FUTURE: Phase 4 & Beyond Roadmap

**Timeframe:** After Phase 3 completion
**Focus:** Database editing, PDF generation, email delivery, production hardening

---

## Phase 4: Advanced Features (6-8 hours)

### Feature 1: Database Editor (2 hours)

**What:** Allow users to edit catalog while quotation is open, with auto-recalculation

**Why:** Users realize catalog needs updates mid-quotation without restarting

**Components:**
- `Components_DatabaseEditor.html` - Modal with 3 views:
  - Browse catalog (table of items)
  - Modify row (edit fields)
  - Add new row (insert new item)

**State Machine:** Already supports this via `database_management` parallel region
- OPEN_DATABASE → opens editor
- SELECT_ROW_TO_MODIFY → switches to edit view
- SAVE_ROW → persists changes
- CLOSE_DATABASE → auto-recalculates quotation

**Implementation:**
1. Create Components_DatabaseEditor.html (1 hour)
2. Wire to machine events (30 min)
3. Test recalculation on close (30 min)

**Estimate:** 2 hours | **Priority:** Medium

---

### Feature 2: PDF Generation (2 hours)

**What:** Generate professional PDF from saved quotation

**Why:** Users need printable/shareable document

**Implementation:**
- Use jsPDF + html2pdf libraries (or Google Apps Script native support)
- Template: Quotation header, items table, totals, footer
- Trigger: "Descargar PDF" button in completed state

**Estimate:** 2 hours | **Priority:** High (users expect this)

---

### Feature 3: Email Delivery (1.5 hours)

**What:** Send quotation via email to client

**Why:** Users need to share quotations with customers

**Implementation:**
- Use Google Apps Script native GmailApp (on GAS)
- Or use SendGrid API (if self-hosted)
- Template: Professional email with PDF attached
- Trigger: "Enviar por Email" button in completed state

**Estimate:** 1.5 hours | **Priority:** High

---

### Feature 4: Production Hardening (2-3 hours)

**Error Handling:**
- Graceful fallback when backend unavailable
- Retry logic for failed saves
- User-friendly error messages

**Performance:**
- Optimize pricing pipeline (may be slow with large catalogs)
- Cache optimization
- Bundle size verification (~50KB gzipped target)

**Security:**
- Validate input in state machine guards
- Sanitize HTML in templates
- Protect sensitive data (pricing profiles, rules)

**Testing:**
- Load testing (1000 items in catalog)
- Error scenario testing
- GAS quota testing

**Estimate:** 2-3 hours | **Priority:** Critical (before production)

---

## Post-Phase 4: Vision & Enhancements

### Enhanced Features (Future)

**1. Multi-User Support**
- Share quotations between team members
- Collaborative editing
- Audit trail (who changed what)

**2. Advanced Pricing**
- Tiered discounts (volume-based)
- Seasonal pricing adjustments
- Client-specific pricing profiles

**3. Analytics & Reporting**
- Quotation history with trends
- Win/loss analysis
- Revenue forecasting

**4. Integration**
- Sync with external accounting system
- CRM integration (import customers)
- Webhook notifications

---

## Architecture for Future Growth

### Current Foundation (Solid)
- ✅ Pure pricing engine (reusable, testable)
- ✅ Pluggable database layer (swap backends anytime)
- ✅ XState orchestration (handles complex workflows)
- ✅ Alpine.js UI (lightweight, reactive)
- ✅ Zero external dependencies (except xstate + alpinejs)

### Ready to Extend
- Add new pricing rules without touching existing code
- Add new database tables via CONFIG_SCHEMA.js
- Add new states/transitions in state machine
- Add new HTML components without modifying existing ones

### Scaling Considerations
- GAS quotas: Row limit per sheet (~1M), script execution time (6 min)
- Performance: Pricing pipeline scales O(n) with items/rules
- Database: Consider migration to native GAS database or external DB
- Caching: Current strategy works for < 10k items/rules

---

## Release Schedule (Tentative)

| Phase | Target | Features | Status |
|-------|--------|----------|--------|
| **1** | 2026-02-20 | Database abstraction | ✅ Complete |
| **2** | 2026-02-20 | Pricing + Orchestration | ✅ Complete |
| **3** | 2026-02-22 | Frontend integration | ⏳ In progress |
| **4** | 2026-02-27 | PDF + Email + Polish | 📋 Planned |
| **Production** | 2026-03-05 | Full deployment | 🚀 Ready |

---

## Known Limitations & Tradeoffs

### Current
1. **GAS Shim on localhost** - Not perfect, but good enough for dev
2. **Single state machine instance** - No multi-window support (GAS constraint)
3. **In-memory cache** - No persistence across page reloads (GAS spreadsheet stores it)
4. **Manual PDF generation** - Uses jsPDF (could use native GAS instead)

### By Design
1. **Zero external dependencies** - Trade-off: must implement UI framework ourselves (using Alpine.js)
2. **Pure pricing pipeline** - Trade-off: cannot have dynamic pricing queries (must cache data)
3. **Orchestrator-driven data** - Trade-off: requires explicit data loading in states (prevents accidental DB queries)

### Acceptable Constraints
1. **GAS script runtime:** 6-minute execution limit → OK for quotations (< 1 sec typically)
2. **Spreadsheet rows:** ~1M rows limit → OK for catalog (< 100 items typical)
3. **File size:** GAS script limit 50MB → OK for bundle + assets (< 5MB typical)

---

## Decision Log

### Why XState?
- **Deterministic:** All transitions mapped, tested, predictable
- **Parallel regions:** Can handle database editing while quotation open
- **Guards & actions:** Enforce business rules (can't save without validation)
- **Observable:** Snapshots tell us exact state + context anytime

### Why Alpine.js?
- **Lightweight:** 15KB gzipped (vs React 40KB+)
- **Reactive:** Data binding without boilerplate
- **GAS-friendly:** Simple to bundle into IIFE

### Why Pure Pricing?
- **Testable:** 147 tests, 100% coverage
- **Fast:** No I/O, deterministic calculations
- **Reusable:** Can use same code in backend, CLI, etc.

### Why Pluggable Stores?
- **Flexibility:** Swap GAS for Firebase, PostgreSQL, whatever
- **Testable:** InMemoryStore for unit tests (no quota usage)
- **Future-proof:** Not locked into Google Sheets

---

## Success Metrics for v1.0

By production launch:
- [ ] Process 100 quotations without errors
- [ ] < 2 sec response time per action
- [ ] Zero data loss (all saves persistent)
- [ ] No manual workarounds needed
- [ ] User can complete full workflow in < 5 min

---

## Questions & Notes

**Need to research:**
- jsPDF template best practices for professional documents
- SendGrid integration vs Google Apps Script native email
- GAS quota monitoring and alerting
- Multi-window state synchronization (if needed)

**Potential blockers:**
- GAS rate limiting on spreadsheet writes (if catalog large)
- Email delivery reliability (spam filtering)
- PDF generation performance (large quotations)

**Team feedback needed:**
- PDF template design (branding, layout)
- Email template content
- Advanced features priority (which first?)
- User onboarding strategy

