# FUTURE: Strategic Roadmap (Post-Phase 4)

**Timeframe:** After Phase 4 completion and production launch
**Focus:** Advanced features, scaling, and long-term vision

---

## Strategic Pillars

### 1. Multi-User Collaboration
**Why:** Teams need to work together on quotations
**What:** Share, edit, and track changes across team

- **Shared quotations** — Allow access to team members
- **Collaborative editing** — Real-time updates (with conflict resolution)
- **Audit trail** — See who changed what and when
- **Permission levels** — Viewer, Editor, Admin roles
- **Comments & mentions** — Discuss items inline

**Challenges:**
- GAS API doesn't support true real-time sync
- Need robust conflict resolution strategy
- User identity management (may need auth system)

**Estimate:** 8-12 hours (significant complexity)

---

### 2. Advanced Pricing & Business Rules
**Why:** Power users need sophisticated pricing strategies
**What:** Flexible, tenant-specific pricing configurations

- **Tiered discounts** — Volume-based pricing tiers
- **Seasonal adjustments** — Price changes by date/season
- **Client-specific profiles** — Custom pricing per client
- **Contract pricing** — Lock-in prices for periods
- **Dynamic rule conditions** — More sophisticated rule engine
- **A/B pricing** — Test different pricing strategies

**Implementation:**
- Extend PERFILES_PRECIO with tier/seasonal data
- Extend REGLAS_NEGOCIO with client/date filters
- Add UI for rule condition builder
- Implement rule simulation (before saving)

**Estimate:** 10-15 hours

---

### 3. Analytics & Business Intelligence
**Why:** Management needs insights to make decisions
**What:** Comprehensive reporting and trend analysis

- **Quotation dashboard** — Count, value, conversion rate
- **Revenue trends** — By client, category, salesperson
- **Win/loss analysis** — Track quotation acceptance rate
- **Client metrics** — Lifetime value, frequency, preferences
- **Item popularity** — Which items sell, which don't
- **Forecast** — Revenue projection based on trends

**Data needs:**
- Add quotation status field (quoted, accepted, rejected, invoiced)
- Track client response/conversion dates
- Track salesperson ownership
- Add notes/feedback field

**Estimate:** 12-16 hours

---

### 4. System Integrations
**Why:** Users work with other business systems
**What:** Seamless data flow between systems

#### CRM Integration
- Import/sync clients from CRM
- Auto-create quotations from CRM opportunities
- Update CRM when quotation accepted/rejected

#### Accounting Integration
- Auto-generate invoices from quotations
- Sync to accounting system (QuickBooks, XERO, etc.)
- Tax compliance reporting

#### Email Integration
- Sync sent quotations to Gmail/Office 365
- Track email opens and clicks
- Auto-archive with original email

#### Webhook Support
- Notify external systems when quotation changes
- Trigger automations in Zapier, Make, etc.
- Custom integrations (API gateway)

**Estimate:** 15-20 hours (depends on systems)

---

### 5. Mobile Experience
**Why:** Users want to quote on-the-go
**What:** Responsive design + mobile-first features

- Responsive layout (currently desktop-only)
- Touch-friendly controls
- Offline support (create locally, sync later)
- Mobile-optimized forms
- Barcode scanning for item lookup (future)

**Challenges:**
- GAS doesn't support offline (need local cache)
- Touch gestures differ from desktop
- Small screen constraints

**Estimate:** 8-12 hours

---

### 6. Scaling & Performance
**Why:** Support larger catalogs and more users
**What:** Infrastructure and optimization

- **Database migration** — Move from Sheets to PostgreSQL/Firebase
- **Caching strategy** — Redis or equivalent
- **API gateway** — Separate backend from GAS
- **CDN** — Serve static assets faster
- **Horizontal scaling** — Multiple instances

**Current limits:**
- GAS: 6-minute execution limit
- Sheets: ~1M rows (but slow with large reads)
- Bundle size: Currently 57KB gzipped

**Breaking point:** ~10,000 items in catalog, 100+ concurrent users

**Estimate:** 20-30 hours (major refactor)

---

## Long-Term Vision (2-3 Years)

### From Add-On to Platform
Current: Google Sheets add-on
Target: Standalone web app with Sheets integration

**Benefits:**
- No GAS limitations
- True real-time sync
- Better performance
- Multi-tenant SaaS model
- Native mobile apps

**Architecture:**
- Backend: Node.js / Python (handles pricing engine)
- Frontend: React / Vue (replaces Alpine.js)
- Database: PostgreSQL (replaces Sheets)
- Mobile: React Native / Flutter

**Timeline:** 6-12 months (full rebuild)

---

### Market Expansion
**Vertical solutions:**
- Catering-specific features (dietary requirements, etc.)
- Wedding planning tools (guest lists, seating, etc.)
- Conference management (multiple events, bulk pricing)
- Corporate events (budget management, approvals)

**Geographic expansion:**
- Support multiple currencies
- Local tax calculations (VAT, GST, etc.)
- Multi-language UI

---

## Research & Experiments

### High-Impact, Uncertain Outcome
- **AI-powered pricing suggestions** — ML model predicts optimal prices
- **Natural language quotation** — "Create a quotation for 50 people, 2 days, cocktail reception"
- **Computer vision item lookup** — Photograph item, auto-lookup catalog
- **Voice commands** — "Add 3 coffees to the quotation"

### Low-Risk Exploration
- **Template quotations** — Save and reuse configurations
- **Quotation comparison** — Side-by-side view of alternatives
- **What-if analysis** — Adjust inputs, see impact
- **Pricing simulator** — Test rule changes before applying

---

## Metrics to Track

Once Phase 4 is live, monitor:
- **Adoption** — Users, daily active users
- **Reliability** — Uptime, error rates, support tickets
- **Performance** — Load times, calculation speed
- **Quality** — Test coverage, bug reports, NPS
- **Adoption** — Feature usage (which features drive value?)

### Success Indicators
- 100+ organizations using the system
- NPS > 50 (good SaaS benchmark)
- < 0.1% data loss rate
- < 1% error rate on calculations
- < 2 sec average response time

---

## Team & Skills Needed

### Current Team
- 1 Full-stack Engineer (built everything)

### To Scale Phase 4 → Phase 5+
- **Backend Engineer** — Pricing engine optimization, integrations
- **Frontend Engineer** — Mobile, advanced UX
- **DevOps** — Deployment, monitoring, scaling
- **QA** — Test automation, performance testing
- **Product Manager** — Feature prioritization, user research
- **Designer** — UI/UX improvements, mobile design

---

## Decision Framework

### How to Prioritize Post-Phase-4 Work

**Evaluate each feature by:**
1. **Impact** — How many users benefit? How much value?
2. **Effort** — How many hours? What skills needed?
3. **Risk** — Will it destabilize current system?
4. **Strategic fit** — Does it support company vision?
5. **Dependencies** — What needs to happen first?

**Score matrix:**
- High impact + Low effort = DO FIRST
- High impact + High effort = DO SECOND (need planning)
- Low impact + Low effort = DO THIRD (quick wins)
- Low impact + High effort = DON'T DO (unless strategic)

---

## Risks & Mitigation

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| GAS quota exceeded | Medium | High | Migrate to external backend |
| Data loss at scale | Low | Critical | Implement audit logging + backups |
| Performance degradation | Medium | Medium | Implement caching strategy |
| Integration failures | Medium | Low | Build robust error handling |

### Business Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| User adoption plateau | Low | Medium | Invest in marketing/UX |
| Competitor enters market | High | Medium | Focus on differentiation |
| Team turnover | Low | High | Document system well |
| Regulatory changes | Low | Medium | Stay informed, adjust quickly |

---

## Timeline Estimate

| Phase | Timeframe | Status | Hours |
|-------|-----------|--------|-------|
| **1** | Done | ✅ Complete | 20 |
| **2** | Done | ✅ Complete | 30 |
| **3** | Done | ✅ Complete | 25 |
| **Domain Model** | Done | ✅ Complete | 20 |
| **4** | Next | 📋 Next | 9 |
| **5 (Phase 5)** | 2-3 months | 📋 Planned | 40 |
| **6 (Scaling)** | 3-6 months | 📋 Future | 30 |
| **7 (Platform)** | 6-12 months | 📋 Long-term | 200+ |
| **Total to MVP+** | — | — | 144+ |
| **Total to Platform** | — | — | 350+ |

---

## Open Questions

1. **Mobile or web-first?** Mobile would unlock field sales, but adds complexity
2. **Single-tenant or multi-tenant?** Multi-tenant enables SaaS, but requires more security
3. **Export or import?** Users might want to export to Excel, backup to CSV
4. **Approvals workflow?** Managers need to approve discounts before sending
5. **Versioning?** Track quotation revisions and changes?
6. **Sustainability?** How to monetize (SaaS, premium features, services)?

---

## Success Criteria for Product

**v2.0 (Current + Phase 4):**
- ✅ 100+ quotations processed monthly
- ✅ < 2 sec response time
- ✅ 99.9% uptime
- ✅ PDF export working
- ✅ Email delivery reliable

**v3.0 (Scaling + Integrations):**
- ✅ Multi-user collaboration
- ✅ CRM integration
- ✅ Advanced analytics
- ✅ 1000+ users
- ✅ SaaS business model

**v4.0 (Platform):**
- ✅ Native mobile apps
- ✅ 10,000+ users
- ✅ Profitable SaaS
- ✅ Industry-specific verticals
- ✅ AI features

---

## Reference

**Related documents:**
- `PLAN.md` — Current status and immediate priorities
- `debt.md` — Phase 4 technical work (6-9 hours)
- `features.md` — Feature list by role and phase
- `changelog.md` — Version history and completed work

