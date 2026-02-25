# Complete Mixins Inventory (Domain + UI Layers)

**Status:** Comprehensive mixin strategy covering domain logic + UI behavior  
**Date:** 2026-02-24

---

## Overview

Mixins exist at two distinct layers:

1. **Domain Mixins** — Business logic (pricing, storage, rules, aggregation)
2. **UI Mixins** — Interface behavior (modals, forms, events, Alpine sync)

Each layer is independent but can be composed together.

---

## Layer 1: Domain Mixins (Business Logic)

These encapsulate the core quotation business domain.

### 1. Prizable (Two Variants)

#### A. Prizable for Leaf Items
**Purpose:** Single item price calculation based on quantities + external context

```javascript
export function Prizable(Base) {
  return class extends Base {
    // ── Quantities (User-settable) ────────────────────
    pax = null;
    paxIsUserSet = false;
    cantidad = null;
    cantidadIsUserSet = false;
    duracion = null;
    duracionIsUserSet = false;

    // ── Pricing ──────────────────────────────────────
    _profile = null;           // Pricing profile from category
    _price = null;             // Calculated total price
    _pricingFn = null;         // Injected: (profile, pax, cantidad, duracion) => number

    // Resolve quantities from context + defaults
    resolveQuantities(containerContext = {}) {
      if (!this.paxIsUserSet) {
        this.pax = containerContext.pax ?? this._defaultPax ?? null;
      }
      if (!this.cantidadIsUserSet) {
        this.cantidad = containerContext.cantidad ?? this._defaultCantidad ?? null;
      }
      if (!this.duracionIsUserSet) {
        this.duracion = containerContext.duracion ?? this._defaultDuracion ?? null;
      }
    }

    // Calculate price using injected pricing function
    calculatePrice() {
      if (!this._profile || !this._pricingFn) {
        this._price = null;
        return;
      }
      this._price = this._pricingFn(this._profile, this.pax, this.cantidad, this.duracion);
    }

    setUserQuantity(field, value) {
      this[field] = value;
      this[`${field}IsUserSet`] = true;
      this.calculatePrice();
      return this;
    }

    // Display price per unit (price / pax)
    get displayPrice() {
      if (this._price == null) return 0;
      const divisor = this.pax || 1;
      return Math.round(this._price / divisor);
    }

    get total() {
      return this._price ?? 0;
    }
  };
}
```

**Used By:** Item (leaf node)  
**Key Responsibility:** Calculate individual item price based on context variables

---

#### B. Prizable for Aggregation (Containers)
**Purpose:** Sum prices from child items/containers

```javascript
export function Aggregable(Base) {
  return class extends Base {
    // ── Child Management ────────────────────────────
    _children = new Map();  // id → child (Item or Container)

    // Aggregate prices bottom-up
    aggregate() {
      const breakdown = [];
      let subtotal = 0;

      for (const child of this._children.values()) {
        let childTotal;
        if (typeof child.aggregate === 'function') {
          // Child is a container
          childTotal = child.aggregate().subtotal;
        } else {
          // Child is a leaf item
          childTotal = child._price ?? child.total ?? 0;
        }
        breakdown.push({
          id: child.ID_Linea || child.ID_Item || child.id,
          nombre: child.Nombre || child.nombre,
          total: childTotal
        });
        subtotal += childTotal;
      }

      return { subtotal, breakdown };
    }

    addChild(id, child) {
      this._children.set(id, child);
      return this;
    }

    removeChild(id) {
      this._children.delete(id);
      return this;
    }

    getChild(id) {
      return this._children.get(id);
    }
  };
}
```

**Used By:** Basket, DayCategory, Catalog  
**Key Responsibility:** Aggregate child prices bottom-up

---

### 2. Rulable (Existing but Critical)
**Purpose:** Evaluate rules + pass context down

```javascript
export function Rulable(Base) {
  return class extends Base {
    _rules = [];              // Rule definitions
    _appliedRules = [];       // Results of evaluation
    _inheritedContext = {};   // Context from parent
    _evaluator = null;        // Injected rule evaluator

    // Receive context from parent
    receiveContext(ctx) {
      this._inheritedContext = { ...this._inheritedContext, ...ctx };
      return this;
    }

    // Evaluate rules against current state
    evaluateRules(evaluator) {
      this._appliedRules = [];
      for (const rule of this._rules) {
        if (!rule.Activo) continue;
        const result = evaluator(rule, this._buildRuleContext());
        if (result) {
          this._appliedRules.push({ ruleId: rule.ID_Regla, ...result });
          if (!rule.Acumulable) break;  // Stop after first match if not accumula
ble
        }
      }
      return this._appliedRules;
    }

    // Subclasses override this to build context for rule evaluation
    _buildRuleContext() {
      return { ...this._inheritedContext };
    }

    // Push context to children
    propagateContext(ruleOutputs = {}) {
      const ctx = {
        ...this._inheritedContext,
        ...ruleOutputs
      };
      for (const child of this._children?.values?.() || []) {
        if (typeof child.receiveContext === 'function') {
          child.receiveContext(ctx);
        }
      }
      return this;
    }
  };
}
```

**Used By:** Item, Basket, DayCategory, Catalog  
**Key Responsibility:** Evaluate rules + flow context down to children

---

### 3. Storable
**Purpose:** Persist and restore from database

```javascript
export function Storable(Base) {
  return class extends Base {
    // ── Storage Identity ────────────────────────────
    ID_Linea = null;           // For items in basket
    ID_Item = null;            // For catalog items
    ID_Categoria = null;       // For categories
    ID_Cotizacion = null;      // For quotations

    // Convert to storage format (for DB write)
    toStorageObject() {
      throw new Error(
        `${this.constructor.name} must implement toStorageObject()`
      );
    }

    // Restore from storage format (static/class method)
    // static fromStorageObject(data) { ... }  -- subclasses implement

    // Mark as modified (for dirty checking)
    _isDirty = false;
    
    markDirty() {
      this._isDirty = true;
      return this;
    }

    isSaved() {
      return !this._isDirty && this.ID_Linea != null;
    }
  };
}
```

**Used By:** Item, Basket, DayCategory, Quotation  
**Key Responsibility:** Handle database persistence

---

## Layer 2: UI Mixins (Interface Behavior)

These encapsulate UI-specific behaviors independent of domain logic.

### 4. Modalable
**Purpose:** Modal lifecycle (open/close/loading/errors)

```javascript
export function Modalable(Base) {
  return class extends Base {
    _isOpen = false;
    _isLoading = false;
    _errors = [];

    open() {
      this._isOpen = true;
      return this;
    }

    close() {
      this._isOpen = false;
      return this;
    }

    isOpen() {
      return this._isOpen;
    }

    setLoading(value) {
      this._isLoading = value;
      return this;
    }

    isLoading() {
      return this._isLoading;
    }

    addError(message) {
      this._errors.push(message);
      return this;
    }

    getErrors() {
      return [...this._errors];
    }

    clearErrors() {
      this._errors = [];
      return this;
    }
  };
}
```

**Used By:** ClientSelector, QuotationInitializer, GlobalVariablesForm, etc.  
**Key Responsibility:** Manage modal UI state

---

### 5. Formable
**Purpose:** Form state + validation

```javascript
export function Formable(Base) {
  return class extends Base {
    _formState = {};
    _formErrors = {};

    setField(fieldName, value) {
      this._formState[fieldName] = value;
      if (this._formErrors[fieldName]) {
        delete this._formErrors[fieldName];  // Clear error on change
      }
      return this;
    }

    getField(fieldName) {
      return this._formState[fieldName];
    }

    getFormState() {
      return { ...this._formState };
    }

    validate() {
      throw new Error(`${this.constructor.name} must implement validate()`);
    }

    setFieldError(fieldName, error) {
      this._formErrors[fieldName] = error;
      return this;
    }

    getFieldError(fieldName) {
      return this._formErrors[fieldName];
    }

    getFormErrors() {
      return { ...this._formErrors };
    }

    hasErrors() {
      return Object.keys(this._formErrors).length > 0;
    }

    clearFormErrors() {
      this._formErrors = {};
      return this;
    }
  };
}
```

**Used By:** ClientSelector, QuotationInitializer, GlobalVariablesForm, etc.  
**Key Responsibility:** Manage form state + validation

---

### 6. Eventable
**Purpose:** Event emission (observer pattern)

```javascript
export function Eventable(Base) {
  return class extends Base {
    _listeners = {};

    on(eventName, callback) {
      if (!this._listeners[eventName]) {
        this._listeners[eventName] = [];
      }
      this._listeners[eventName].push(callback);
      return this;
    }

    emit(eventName, data) {
      if (this._listeners[eventName]) {
        this._listeners[eventName].forEach(cb => cb(data));
      }
      return this;
    }

    off(eventName, callback) {
      if (this._listeners[eventName]) {
        this._listeners[eventName] = this._listeners[eventName].filter(
          cb => cb !== callback
        );
      }
      return this;
    }
  };
}
```

**Used By:** ALL components  
**Key Responsibility:** Event communication

---

### 7. Serviceable
**Purpose:** Service/dependency injection

```javascript
export function Serviceable(Base) {
  return class extends Base {
    _services = {};

    injectService(serviceName, service) {
      this._services[serviceName] = service;
      return this;
    }

    getService(serviceName) {
      return this._services[serviceName];
    }

    hasService(serviceName) {
      return serviceName in this._services;
    }
  };
}
```

**Used By:** QuotationInitializer, DatabaseViewer, Quotation  
**Key Responsibility:** Access to external services (DB, preloader, etc.)

---

### 8. Alpineable
**Purpose:** Alpine.js reactivity contract

```javascript
export function Alpineable(Base) {
  return class extends Base {
    toDisplayObject() {
      throw new Error(
        `${this.constructor.name} must implement toDisplayObject()`
      );
    }
  };
}
```

**Used By:** ALL components  
**Key Responsibility:** Sync to Alpine store

---

### 9. Actorlike
**Purpose:** XState actor communication

```javascript
export function Actorlike(Base) {
  return class extends Base {
    _actorRef = null;

    setActorRef(ref) {
      this._actorRef = ref;
      return this;
    }

    sendEvent(type, payload = {}) {
      if (this._actorRef && typeof this._actorRef.send === 'function') {
        this._actorRef.send({ type, ...payload });
      }
      return this;
    }

    getSnapshot() {
      return this._actorRef?.getSnapshot?.();
    }

    subscribe(callback) {
      return this._actorRef?.subscribe?.(callback);
    }

    get hasActorRef() {
      return this._actorRef !== null;
    }
  };
}
```

**Used By:** Quotation, Basket, DayCategory, Item  
**Key Responsibility:** Connect to XState actors

---

## Mixin Composition Patterns

### Pattern A: Domain Items (Leaf)
```javascript
const ItemMixin = (Base) => 
  Alpineable(Storable(Rulable(Prizable(Actorlike(Base)))));

class Item extends ItemMixin(class {}) { ... }
```

**Result:** Item can:
- Calculate own price (Prizable)
- Receive context + evaluate rules (Rulable)
- Be stored/restored (Storable)
- Communicate with XState (Actorlike)
- Sync to Alpine (Alpineable)

---

### Pattern B: Domain Containers
```javascript
const ContainerMixin = (Base) =>
  Alpineable(Storable(Rulable(Aggregable(Actorlike(Base)))));

class Basket extends ContainerMixin(class {}) { ... }
```

**Result:** Container can:
- Aggregate child prices (Aggregable)
- Receive/propagate context + evaluate rules (Rulable)
- Be stored/restored (Storable)
- Communicate with XState (Actorlike)
- Sync to Alpine (Alpineable)

---

### Pattern C: UI Modal Controllers
```javascript
const ModalControllerMixin = (Base) =>
  Alpineable(Eventable(Serviceable(Formable(Modalable(Base)))));

class ClientSelector extends ModalControllerMixin(class {}) { ... }
```

**Result:** Modal can:
- Manage modal UI state (Modalable)
- Manage form state (Formable)
- Access services (Serviceable)
- Emit events (Eventable)
- Sync to Alpine (Alpineable)

---

### Pattern D: UI Containers (Main Views)
```javascript
const UIContainerMixin = (Base) =>
  Alpineable(Eventable(Actorlike(Base)));

class QuotationView extends UIContainerMixin(class {}) { ... }
```

**Result:** UI Container can:
- Communicate with XState (Actorlike)
- Emit events (Eventable)
- Sync to Alpine (Alpineable)

---

## Complete Mixin Inventory

| Mixin | Layer | Purpose | Key Methods | Used By |
|-------|-------|---------|-------------|---------|
| **Prizable** | Domain | Item price calculation | resolveQuantities(), calculatePrice(), total | Item |
| **Aggregable** | Domain | Container aggregation | aggregate(), addChild(), removeChild() | Basket, DayCategory, Catalog |
| **Rulable** | Domain | Rule evaluation + context | evaluateRules(), receiveContext(), propagateContext() | Item, Basket, DayCategory |
| **Storable** | Domain | Database persistence | toStorageObject(), fromStorageObject(), isSaved() | Item, Basket, Quotation |
| **Modalable** | UI | Modal lifecycle | open(), close(), isOpen(), setLoading() | ClientSelector, Initializer, etc. |
| **Formable** | UI | Form state + validation | setField(), validate(), hasErrors() | All modals |
| **Eventable** | UI | Event emission | on(), emit(), off() | ALL components |
| **Serviceable** | UI | Service injection | injectService(), getService() | Modals, Quotation |
| **Alpineable** | UI | Alpine.js sync | toDisplayObject() | ALL components |
| **Actorlike** | UI | XState communication | setActorRef(), sendEvent(), subscribe() | Quotation, Basket, Item |

---

## Complete File Structure

```
packages/components/common/
│
├── mixins/                      ← ALL MIXINS
│   ├── domain/
│   │   ├── Prizable.js         ← Item pricing
│   │   ├── Aggregable.js       ← Container aggregation
│   │   ├── Rulable.js          ← Rule evaluation
│   │   ├── Storable.js         ← Database persistence
│   │   └── index.js
│   │
│   ├── ui/
│   │   ├── Modalable.js        ← Modal lifecycle
│   │   ├── Formable.js         ← Form state
│   │   ├── Eventable.js        ← Event emission
│   │   ├── Serviceable.js      ← Service injection
│   │   ├── Alpineable.js       ← Alpine.js sync
│   │   ├── Actorlike.js        ← XState communication
│   │   └── index.js
│   │
│   └── index.js                ← Export all
│
├── base/                        ← BASE CLASSES
│   ├── domain/
│   │   ├── ItemBase.js         ← Uses: Prizable, Rulable, Storable, Alpineable, Actorlike
│   │   ├── ContainerBase.js    ← Uses: Aggregable, Rulable, Storable, Alpineable, Actorlike
│   │   └── index.js
│   │
│   ├── ui/
│   │   ├── ModalControllerBase.js ← Uses: Modalable, Formable, Eventable, Serviceable, Alpineable
│   │   ├── UIContainerBase.js     ← Uses: Eventable, Alpineable, Actorlike
│   │   ├── ViewBase.js            ← Uses: Eventable, Alpineable
│   │   └── index.js
│   │
│   └── index.js                ← Export all
│
└── styles/
    └── claps-global.css
```

---

## Summary: 10 Mixins Total

### Domain Mixins (4)
1. **Prizable** — Item pricing
2. **Aggregable** — Container aggregation
3. **Rulable** — Rule evaluation
4. **Storable** — Database persistence

### UI Mixins (6)
5. **Modalable** — Modal lifecycle
6. **Formable** — Form state
7. **Eventable** — Event emission
8. **Serviceable** — Service injection
9. **Alpineable** — Alpine.js sync
10. **Actorlike** — XState communication

### Composition into Base Classes
- **ItemBase** — 5 mixins (Prizable, Rulable, Storable, Alpineable, Actorlike)
- **ContainerBase** — 5 mixins (Aggregable, Rulable, Storable, Alpineable, Actorlike)
- **ModalControllerBase** — 5 mixins (Modalable, Formable, Eventable, Serviceable, Alpineable)
- **UIContainerBase** — 3 mixins (Eventable, Alpineable, Actorlike)
- **ViewBase** — 2 mixins (Eventable, Alpineable)

---

## Benefits

✅ **DRY** — Each behavior implemented once, composed multiple times  
✅ **Focused** — Each mixin does one thing  
✅ **Testable** — Mixins pure, testable, no global state  
✅ **Composable** — New classes just mix and match  
✅ **Chainable** — All methods return `this` for fluency  
✅ **Reusable** — Works for any domain, any UI framework  
✅ **Consistent** — Same pattern used everywhere  

---

## Next Step: User Approval

**Does this complete inventory feel right?**

Are the 4 domain mixins sufficient for the quotation domain? Should we add/remove any?

Once approved, we'll:
1. ✅ Create 10 mixins (4 domain + 6 UI)
2. ✅ Create 5 base classes
3. ✅ Refactor counter-composed (validation)
4. ✅ Build quotation components with confidence

