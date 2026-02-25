# Components Inventory & Pattern Extraction

**Goal:** List all UI components needed, identify common patterns, extract reusable base classes

---

## 📋 Component Inventory (All UI Components Needed)

### Phase 1: Modal Flow Components

**Top-Level Controllers** (manage modal state, global state)
1. **HomePage** — Entry point (3 buttons: New, Load, Database)
2. **AppState/AppController** — Global state machine (which modal open, quotation context, etc.)

**Modal Components** (pop-ups with form/selection logic)
3. **ClientSelector** — Search/select/create client
4. **QuotationInitializer** — Form: pax, fecha, duracion + DB preload trigger
5. **GlobalVariablesForm** — (Reuses QuotationInitializer with different labels)
6. **PreviousQuotationsModal** — List/filter saved quotations
7. **DatabaseViewer** — Table browser/editor (admin tool)

### Phase 2: Main Quotation View Components

**Quotation Container** (main editing area)
8. **Quotation** — Container (manages Catalog + Basket)
9. **QuotationHeader** — Display client, pax, fecha, duracion + buttons
10. **QuotationTotals** — Footer with subtotal/total

**Catalog Component** (sidebar)
11. **Catalog** — Item browser by category
12. **CategoryGroup** — Collapsible category section
13. **CatalogItemCard** — Mini-card with name + price, click to add

**Basket Component** (main area)
14. **Basket** — Container for day tabs + items
15. **DayTabs** — Tab navigation (Día 1, Día 2, etc.)
16. **DayAccordion** — Items accordion for one day
17. **ItemAccordion** — Single item with quantity controls, price breakdown

### Phase 3: Summary & Completion

18. **ValidationSummary** — Review table + confirm button
19. **CompletionSuccess** — Success message + next options

---

## 🔍 Pattern Analysis

Let me analyze what's **common** across all these components:

### Pattern 1: Modal Behavior (Appears in: #3, #4, #5, #6, #7)
```
- open() → _isOpen = true
- close() → _isOpen = false
- isOpen() → return _isOpen
- setLoading(bool)
- addError(message)
- getErrors()
```

### Pattern 2: Form Behavior (Appears in: #3, #4, #5, #14, #16, #17)
```
- setField(name, value)
- getField(name)
- getFormState()
- validate() → errors[]
- setFieldError(name, error)
- hasErrors()
- clearErrors()
```

### Pattern 3: Event Emission (Appears in: ALL)
```
- on(eventName, callback)
- emit(eventName, data)
- off(eventName, callback)
```

### Pattern 4: Alpine.js Sync (Appears in: ALL)
```
- toDisplayObject() → { state, data }
- subscribe() → updates Alpine store
```

### Pattern 5: Service Injection (Appears in: #4, #5, #8, #9)
```
- injectService(name, service)
- getService(name)
- hasService(name)
```

### Pattern 6: Actor Communication (Appears in: #8, #9, #14, #15, #16, #17)
```
- setActorRef(ref)
- sendEvent(type, payload)
- getSnapshot()
- subscribe(callback)
```

### Pattern 7: Child Management (Appears in: #8, #11, #12, #14, #15, #16)
```
- addChild(id, child)
- removeChild(id)
- getChild(id)
- getChildren()
- aggregate() → totals
```

---

## 🎨 Base Classes to Create

### Level 1: Pure Mixins (Composable functions)

```
✅ Modalable         → open, close, isOpen, setLoading, errors
✅ Formable         → setField, getField, validate, errors
✅ Eventable        → on, emit, off (observer pattern)
✅ Serviceable      → injectService, getService, hasService
✅ Alpineable       → toDisplayObject() contract
✅ Actorlike        → setActorRef, sendEvent, getSnapshot, subscribe
✅ Containable      → addChild, removeChild, getChild, aggregate
```

### Level 2: Base Classes (Combining mixins)

```javascript
// For modal controllers (forms in popups)
ModalControllerBase = Alpineable(Eventable(Formable(Serviceable(Modalable(Base)))))
// Provides: modal lifecycle + form state + event emission + Alpine sync + services

// For main container components (Quotation, Basket, Catalog)
ContainerBase = Alpineable(Eventable(Actorlike(Containable(Base))))
// Provides: child management + actor communication + Alpine sync + event emission

// For simple state components (buttons, displays)
ViewBase = Alpineable(Eventable(Base))
// Provides: Alpine sync + event emission
```

---

## 📊 Component Classification

| Component | Type | Base Class | Key Mixin Needs |
|-----------|------|-----------|-----------------|
| HomePage | View | ViewBase | Eventable, Alpineable |
| ClientSelector | Modal | ModalControllerBase | Modalable, Formable, Eventable, Alpineable |
| QuotationInitializer | Modal | ModalControllerBase | Modalable, Formable, Eventable, Alpineable, Serviceable |
| GlobalVariablesForm | Modal | ModalControllerBase | ↑ Same as above |
| PreviousQuotationsModal | Modal | ModalControllerBase | Modalable, Formable, Eventable, Alpineable |
| DatabaseViewer | Modal | ModalControllerBase | Modalable, Formable, Eventable, Alpineable, Serviceable |
| Quotation | Container | ContainerBase | Containable, Actorlike, Alpineable, Eventable |
| Catalog | Container | ContainerBase | Containable, Actorlike, Alpineable, Eventable |
| Basket | Container | ContainerBase | Containable, Actorlike, Alpineable, Eventable |
| DayTabs | View | ViewBase | Eventable, Alpineable |
| ItemAccordion | View | ViewBase | Eventable, Alpineable |
| ValidationSummary | View | ViewBase | Eventable, Alpineable |
| CompletionSuccess | View | ViewBase | Eventable, Alpineable |

---

## 🧪 Validation Strategy

### Step 1: Create Mixins (Small, Pure, Testable)
- Write tests for each mixin in isolation
- Test mixin composition order
- Verify contracts enforced

### Step 2: Create Base Classes
- Test mixin layering
- Verify all expected methods exist
- Test method chaining

### Step 3: Validate with counter-composed Refactor
- **Goal:** Reimplement counter-composed using new base classes
- **Why:** It's simple enough to validate patterns work
- **Result:** Confidence before building quotation components

#### Counter-composed Refactoring Plan
```javascript
// Current pattern (counter-composed/logic/createCounterComposedComponent.js):
- Manual actor management
- Manual subscription handling
- Manual sync function
- Manual event sending

// Refactored pattern (using ContainerBase):
- Extend ContainerBase
- setActorRef() for each child
- subscribe() called automatically
- sendEvent() helper
- toDisplayObject() provides all state

// Benefit: Less code, same functionality, validated pattern
```

### Step 4: Build Quotation Components
- Use validated base classes
- Follow counter-composed pattern
- Build with confidence

---

## 📝 Implementation Sequence

### Phase 0: Mixins + Base Classes (Foundation)

```
[ ] Create mixins/Modalable.js
[ ] Create mixins/Formable.js
[ ] Create mixins/Eventable.js
[ ] Create mixins/Serviceable.js
[ ] Create mixins/Alpineable.js
[ ] Create mixins/Actorlike.js
[ ] Create mixins/Containable.js
[ ] Create base/ModalControllerBase.js
[ ] Create base/ContainerBase.js
[ ] Create base/ViewBase.js
[ ] Test all mixins in isolation
[ ] Test base classes
```

### Phase 1: Validate with counter-composed

```
[ ] Read counter-composed current implementation
[ ] Refactor counter-composed logic using ContainerBase
[ ] Refactor counter-composed HTML template
[ ] Run counter-composed tests (should pass)
[ ] Verify counter-composed visual/functional behavior
[ ] If passes → Patterns are solid ✅
[ ] If fails → Debug and adjust mixins
```

### Phase 2: Build Modal Flow

```
[ ] HomePage (ViewBase) → emit NEW_QUOTATION
[ ] ClientSelector (ModalControllerBase) → emit CLIENT_SELECTED
[ ] QuotationInitializer (ModalControllerBase) → emit FORM_SUBMITTED
[ ] GlobalVariablesForm (reuse QuotationInitializer logic)
[ ] PreviousQuotationsModal (ModalControllerBase)
[ ] DatabaseViewer (ModalControllerBase)
```

### Phase 3: Build Main Quotation

```
[ ] Quotation (ContainerBase)
[ ] Catalog (ContainerBase)
[ ] Basket (ContainerBase)
[ ] DayTabs (ViewBase)
[ ] ItemAccordion (ViewBase)
[ ] QuotationHeader (ViewBase)
[ ] QuotationTotals (ViewBase)
```

### Phase 4: Build Summary

```
[ ] ValidationSummary (ViewBase)
[ ] CompletionSuccess (ViewBase)
```

### Phase 5: Integration

```
[ ] AppState machine
[ ] Modal chaining
[ ] Event wiring
[ ] Alpine.js binding
[ ] End-to-end testing
```

---

## 🏗️ File Structure

```
packages/components/
├── common/
│   ├── mixins/
│   │   ├── Modalable.js          ← New
│   │   ├── Formable.js           ← New
│   │   ├── Eventable.js          ← New
│   │   ├── Serviceable.js        ← New
│   │   ├── Alpineable.js         ← New
│   │   ├── Actorlike.js          ← New
│   │   ├── Containable.js        ← New
│   │   └── index.js
│   │
│   ├── base/
│   │   ├── ModalControllerBase.js ← New
│   │   ├── ContainerBase.js      ← New
│   │   ├── ViewBase.js           ← New
│   │   └── index.js
│   │
│   └── styles/
│       └── claps-global.css      (existing)
│
├── counter-composed/             (REFACTORED)
│   ├── logic/
│   │   └── createCounterComposedComponent.js (uses ContainerBase)
│   ├── ui/
│   │   └── CounterComposed.html
│   ├── machine/
│   │   └── composedCounterMachine.js
│   └── tests/
│
├── counter-basic/                (existing, no changes needed)
│
├── item/                          (existing, no changes needed)
│
└── quotation/                     (NEW - main quotation flow)
    ├── modals/
    │   ├── HomePage.js
    │   ├── ClientSelector.js
    │   ├── QuotationInitializer.js
    │   ├── GlobalVariablesForm.js
    │   ├── PreviousQuotationsModal.js
    │   └── DatabaseViewer.js
    │
    ├── quotation/
    │   ├── QuotationView.js
    │   ├── Catalog.js
    │   ├── Basket.js
    │   ├── DayTabs.js
    │   └── ItemAccordion.js
    │
    ├── summary/
    │   ├── ValidationSummary.js
    │   └── CompletionSuccess.js
    │
    ├── machine/
    │   └── quotationMachine.js
    │
    └── tests/
        └── integration.test.js
```

---

## ✨ Why This Approach Works

1. **Small steps** — One mixin at a time
2. **Validation** — Test counter-composed before quotation
3. **Reusable** — Mixins apply to any component
4. **DRY** — No code duplication across 19 components
5. **Testable** — Each mixin testable in isolation
6. **Chainable** — Methods return `this` for fluency
7. **Composition** — New components just mix and match

---

## Next Step: User Approval

**Do these components + patterns feel complete?**

Any missing components? Any patterns we should add/remove?

Once approved, we'll:
1. ✅ Create the 7 mixins
2. ✅ Create the 3 base classes
3. ✅ Refactor counter-composed (validation)
4. ✅ Build quotation modals
5. ✅ Build quotation views
6. ✅ Integrate everything

