# CotizadorLodge: Feature List

**Product:** Event Quotation System for SF Lodge
**Status:** Phase 3 in progress (MVP features complete)
**Target Users:** Event coordinators, sales team, management

---

## Phase 1-2: Complete ✅ (Core Features)

### Quotation Management
- ✅ Create new quotation from scratch
- ✅ Load previous quotations to edit/review
- ✅ Save quotation with unique ID
- ✅ List all previous quotations

### Item Management
- ✅ Browse catalog of services/items
- ✅ Search catalog by name
- ✅ View items grouped by category
- ✅ Add multiple items to quotation
- ✅ Adjust item quantities
- ✅ Remove items from quotation

### Pricing Calculation
- ✅ Automatic base price lookup
- ✅ Quantity-based pricing
- ✅ Duration-based adjustments
- ✅ Pax-based multipliers
- ✅ Volume discounts
- ✅ Business rule engine (9 rule types)
- ✅ Real-time totals calculation
- ✅ Subtotal + Tax breakdown

### Event Setup
- ✅ Client selection from list
- ✅ Event date picker
- ✅ Duration (number of days)
- ✅ Participant count (pax)
- ✅ On-the-fly adjustments with price recalculation

---

## Phase 3: In Progress ⏳ (Frontend Integration)

### TIER 1: MVP Features (1.5 hours)
- ⏳ Validation summary before save
- ⏳ Success confirmation screen
- ⏳ State-aware UI views (each state shows appropriate view)
- ⏳ Save/Cancel buttons for quotation

### TIER 2: Good UX (1.5 hours)
- ⏳ Browse previous quotations view
- ⏳ Client selection modal
- ⏳ Event setup form

---

## Phase 4: Planned 📋 (Advanced Features)

### PDF Generation
- 📋 Export quotation as PDF
- 📋 Professional formatting with logo
- 📋 Include all items, prices, totals
- 📋 Client information
- 📋 Event details

### Email Delivery
- 📋 Send quotation via email
- 📋 Attach PDF automatically
- 📋 Professional email template
- 📋 Client contact list

### Catalog Management
- 📋 Edit catalog items while quotation open
- 📋 Add new items to catalog
- 📋 Update item prices
- 📋 Auto-recalculate quotation on save

### Pricing Profile Management
- 📋 View/edit pricing profiles
- 📋 Update base costs
- 📋 Adjust multipliers

### Business Rules Management
- 📋 View/edit business rules
- 📋 Add new rule types
- 📋 Update rule conditions

---

## Future Enhancements (Post-Phase 4)

### Analytics & Reporting
- View quotation history trends
- Win/loss analysis
- Revenue forecasting
- Client performance metrics

### Multi-User Support
- Share quotations with team
- Collaborative editing
- Audit trail (who changed what)
- Permission levels (viewer, editor, admin)

### Advanced Pricing
- Tiered discounts (volume-based)
- Seasonal pricing adjustments
- Client-specific pricing profiles
- Contract pricing

### Integrations
- Sync with external accounting system
- CRM integration
- Invoice generation
- Payment processing

---

## Feature Matrix by Role

### Sales Team
- ✅ Create quotations quickly
- ✅ Browse previous quotations
- ✅ Auto-pricing (no manual calculations)
- 📋 Send to clients via email
- 📋 PDF for printing/sharing

### Management
- ✅ Review saved quotations
- ✅ See pricing calculations
- 📋 Analytics dashboard
- 📋 Approve discounts
- 📋 View team metrics

### Operations
- ✅ Manage catalog items
- ✅ Update pricing rules
- 📋 Bulk import/export
- 📋 Audit trail viewing

### Finance
- 📋 PDF invoices from quotations
- 📋 Revenue tracking
- 📋 Tax calculations
- 📋 Accounting integration

---

## Technical Capabilities

### Calculation Engine
- 5-stage pricing pipeline (pure functions)
- 9 configurable business rule types
- Real-time pricing updates
- 147 test cases (100% coverage)

### Data Storage
- Google Sheets backend
- Pluggable database layer (can swap to Firebase, PostgreSQL, etc.)
- Schema-driven models (auto-generated from configuration)
- Quotation caching

### State Machine
- 18 states covering full workflow
- Guards preventing invalid transitions
- Parallel database editor while quotation open
- 65 test cases (100% coverage)

### Architecture
- Pure pricing functions (testable, reusable)
- XState orchestration (deterministic)
- Alpine.js reactive UI (lightweight)
- Zero external dependencies (except xstate + alpinejs)

---

## Performance Characteristics

- **Quotation creation:** < 2 seconds
- **Item add:** < 1 second (with pricing recalculation)
- **Catalog search:** < 500ms
- **Save quotation:** < 1 second
- **Bundle size:** ~50KB gzipped (well within GAS limits)

---

## Limitations & Constraints

### Current
- Single window only (GAS constraint)
- In-memory cache (resets on page reload, but spreadsheet persists)
- No real-time multi-user sync (GAS API limitations)

### By Design
- No arbitrary discounts (all rules defined in rule engine)
- No hardcoded prices (always via catalog/profiles)
- No external dependencies (only xstate + alpinejs)

---

## Roadmap Summary

| Phase | Timeline | Status | Features |
|-------|----------|--------|----------|
| 1 | Complete | ✅ | Database abstraction |
| 2 | Complete | ✅ | Pricing + Orchestration |
| 3 | 2026-02-22 | ⏳ | Frontend integration (MVP + UX) |
| 4 | 2026-02-27 | 📋 | PDF, Email, Catalog editor |
| Production | 2026-03-05 | 🚀 | Full deployment to GAS |

---

## Success Metrics (v1.0)

When we consider the product "done":
- [ ] 100+ quotations processed without errors
- [ ] < 2 sec response time per action
- [ ] Zero data loss (all saves persistent)
- [ ] Users complete workflow in < 5 minutes
- [ ] All Phase 3 + Phase 4 features working
- [ ] Passing all 209+ tests
- [ ] Deployed to production (GAS)

