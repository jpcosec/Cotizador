# DEBT: Near-Term Technical Work (Phase 4)

**Timeframe:** Next 6-8 hours of development
**Focus:** Production hardening, PDF/Email, and GAS deployment

---

## 🔴 BLOCKING ISSUE: Kit Item Pricing Architecture

**Status:** MUST FIX BEFORE PHASE 4 STARTS

**Business Rule:** Parent items in `COMPOSICION_KIT` must ALWAYS have zero cost. All pricing must be managed on child items only.

**Current Problem:**
- Schema allows parent items to have `Costo_Base_Fijo > 0` and unit costs
- Pricing pipeline may double-count if both parent and children have costs
- No validation enforcement

**Required Fixes:**
1. [ ] Add validation in `Catalog.load()`: if item has COMPOSICION_KIT children, enforce `Costo_Base_Fijo = 0` and all unit costs = 0
2. [ ] Update `expand()` stage: validate parent cost = 0 during expansion, throw error if violated
3. [ ] Add tests: verify parent kits are always cost-zero in all scenarios
4. [ ] Update pricing documentation to clarify parent = $0 invariant
5. [ ] Add migration script: scan production sheets and zero-out any parent item costs

**Estimate:** 1-2 hours (validation + tests)
**Impact:** Without this, kit-based quotations will calculate prices incorrectly

---

## Priority 1: Production Hardening (2-3 hours)

### Error Handling
- [ ] Graceful fallback when backend unavailable
- [ ] Retry logic for failed saves (exponential backoff)
- [ ] User-friendly error messages (replace console errors)
- [ ] Validation feedback on invalid inputs
- [ ] Handle GAS quota exceeded scenarios

### Performance Optimization
- [ ] Profile pricing pipeline with large catalogs (1000+ items)
- [ ] Optimize cache invalidation strategy
- [ ] Monitor bundle size (~57KB gzipped, acceptable)
- [ ] Test with slow network (throttle to 3G in DevTools)
- [ ] Implement loading states for async operations

### Security
- [ ] Input validation in state machine guards
- [ ] Sanitize HTML in dynamic templates
- [ ] Protect pricing profile data access
- [ ] Validate quotation ownership (multi-user prep)
- [ ] Audit logging for sensitive operations

### Testing
- [ ] Load test with 1000 items in catalog
- [ ] Error scenario tests (network failure, invalid data, quota)
- [ ] GAS quota monitoring and tracking
- [ ] Test on slow connections and mobile devices
- [ ] Stress test pricing calculations (complex rules)

---

## Priority 2: PDF Generation (2 hours)

### Implementation
- [ ] Design PDF template (logo, layout, branding)
- [ ] Implement PDF generation using jsPDF or native GAS
- [ ] Include quotation header (client, date, event info)
- [ ] Include items table (name, qty, unit price, total)
- [ ] Include totals section (subtotal, taxes, total)
- [ ] Add footer with company info

### Features
- [ ] "Download PDF" button in completed state
- [ ] Professional formatting and styling
- [ ] Multi-page support for large quotations
- [ ] Filename with quotation ID and date
- [ ] Footer with quote validity period

### Testing
- [ ] PDF renders correctly on different zoom levels
- [ ] Works with different printer settings
- [ ] Large quotations don't break layout
- [ ] Edge cases: very long item names, many items

---

## Priority 3: Email Delivery (1.5 hours)

### Implementation
- [ ] Use Google Apps Script native GmailApp
- [ ] Professional email template
- [ ] Auto-attach PDF to email
- [ ] Email sent from user's account
- [ ] Confirmation message after send

### Features
- [ ] "Send by Email" button in completed state
- [ ] Client email auto-populated from selection
- [ ] Customizable email message
- [ ] Email log/history of sent quotations
- [ ] Resend option for previous quotations

### Testing
- [ ] Email deliverability testing
- [ ] Spam filtering and compliance
- [ ] Large PDF attachment handling
- [ ] Multiple recipient support (optional)

---

## Priority 4: Catalog Editor (2 hours)

### Implementation
- [ ] Modal with three views:
  - Browse items (table, searchable, sortable)
  - Edit row (form with all fields)
  - Add new row (form with validation)
- [ ] Wire to database_management parallel region
- [ ] Auto-recalculation when database closes

### Features
- [ ] Add new catalog items without reloading
- [ ] Edit item prices and properties
- [ ] Delete items (with confirmation)
- [ ] Search and filter items
- [ ] Bulk operations (future: import/export)

### Testing
- [ ] Changes reflect in quotation immediately
- [ ] Recalculation works correctly with new prices
- [ ] Validation prevents invalid data entry
- [ ] No data loss on close/cancel

---

## Priority 5: GAS Deployment Verification (1 hour)

### Pre-Deployment
- [ ] Full end-to-end workflow test in GAS
- [ ] Verify Code.gs functions work
- [ ] Check that sheets initialize correctly
- [ ] Test data persistence across sessions
- [ ] Verify no console errors in GAS editor

### Deployment Steps
- [ ] Run `clasp push` to deploy
- [ ] Run `initializeSheetDb()` in GAS console
- [ ] Verify all 6 sheets created
- [ ] Verify seed data populated
- [ ] Test quotation create → save → load flow

### Post-Deployment
- [ ] Monitor execution logs for errors
- [ ] Check quota usage (row reads/writes)
- [ ] Test with real data
- [ ] Verify calculations match local version

---

## Known Issues to Address

### Current Bugs/Limitations
1. **State persistence** — Reloading page resets machine state (expected, GAS constraint)
2. **Multi-window sync** — Opening app in two tabs causes conflicts (GAS single-instance limit)
3. **Large catalogs** — Performance may degrade with 1000+ items (needs profiling)
4. **Error recovery** — Failed saves need manual retry (should be automatic)

### Deferred Decisions
- PDF generation approach: jsPDF vs native GAS (research both)
- Email integration: SendGrid vs GmailApp (test deliverability)
- Catalog editor: Inline editing vs modal form (UX research)
- Audit logging: Spreadsheet vs separate log sheet (schema design)

---

## Definition of Done

Each feature is "done" when:
- ✅ Implementation complete (code written)
- ✅ Tests added and passing
- ✅ Documentation updated
- ✅ No console errors
- ✅ Tested in both local and GAS environments
- ✅ Performance acceptable (< 2 sec per action)
- ✅ User can complete workflow without workarounds

---

## Effort Estimates

| Task | Hours | Priority | Status |
|------|-------|----------|--------|
| Production Hardening | 2-3 | Critical | Not started |
| PDF Generation | 2 | High | Not started |
| Email Delivery | 1.5 | High | Not started |
| Catalog Editor | 2 | Medium | Not started |
| GAS Deployment | 1 | High | Ready |
| **Total** | **8.5-9.5** | — | — |

---

## Implementation Order

1. **Production Hardening** (first, blocks others)
2. **GAS Deployment** (verify base works)
3. **PDF Generation** (users expect this)
4. **Email Delivery** (completes user story)
5. **Catalog Editor** (nice-to-have, secondary)

---

## Success Criteria

✅ When Phase 4 is complete:
- All 832+ tests still passing
- No breaking changes to existing features
- PDF generation works for all quotation types
- Email delivery reliable and tested
- Catalog editor doesn't break quotations
- Production deployment successful
- No manual workarounds needed
- Response times < 2 sec per action

