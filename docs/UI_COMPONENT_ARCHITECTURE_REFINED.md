# UI Component Architecture (Refined with Domain Mixins)

**Status:** Design proposal leveraging existing domain package mixins  
**Date:** 2026-02-24

---

## Problem: Code Duplication

The original implementation plan had repetitive controller patterns:
```javascript
// Repetitive pattern in each controller
const controller = {
  getState() { ... },
  on(event, callback) { ... },
  send(type, payload) { ... }
}
```

**Solution:** Adopt the mixin composition pattern from `claps_codelab/packages/domain/src/mixins`

---

## The Domain Package's Mixin Pattern (Genius!)

### Current Mixins in Domain
1. **Alpineable** — Enforces `toDisplayObject()` contract (required for Alpine sync)
2. **Rulable** — Adds rule evaluation + context receiving
3. **Prizable** — Adds quantity resolution + price calculation  
4. **XStateable** — Connects to XState actor refs
5. **Aggregable** — Aggregates child totals (bottom-up)

### Why This Pattern Works
- **DRY** — Common functionality composed once
- **Testable** — Dependencies injected (not imported)
- **Composable** — Mixins layer in specific order
- **Chainable** — Methods return `this` for fluent API
- **Contracts** — Each mixin enforces an interface

**Key insight:** "Methods return this for chaining" + "Mixins ensure contracts" = Highly reusable, minimal code.

---

## New UI-Specific Mixins (Same Pattern!)

Let's create UI mixins following the exact same pattern:

### 1. **Modalable** — Manages modal visibility & lifecycle

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

    toDisplayObject() {
      throw new Error(`${this.constructor.name} must implement toDisplayObject()`);
    }
  };
}
```

### 2. **Eventable** — Event emission (observer pattern)

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

### 3. **Formable** — Form state management

```javascript
export function Formable(Base) {
  return class extends Base {
    _formState = {};
    _formErrors = {};

    setField(fieldName, value) {
      this._formState[fieldName] = value;
      if (this._formErrors[fieldName]) {
        delete this._formErrors[fieldName];
      }
      return this;
    }

    getField(fieldName) {
      return this._formState[fieldName];
    }

    getFormState() {
      return { ...this._formState };
    }

    // Subclasses override this
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

    clearFormErrors() {
      this._formErrors = {};
      return this;
    }

    hasErrors() {
      return Object.keys(this._formErrors).length > 0;
    }
  };
}
```

### 4. **Servable** — Service injection (database, preloader, etc.)

```javascript
export function Servable(Base) {
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

---

## Refactored UI Components Using Mixins

### Base Controller Class

```javascript
// apps/quotation/base/ControllerBase.js
import { Modalable } from '../mixins/Modalable.js';
import { Eventable } from '../mixins/Eventable.js';
import { Formable } from '../mixins/Formable.js';
import { Servable } from '../mixins/Servable.js';

const ControllerMixin = (Base) =>
  Modalable(Eventable(Formable(Servable(Alpineable(Base)))));

export class ControllerBase extends ControllerMixin(class {}) {
  // Provides combined functionality for all modal controllers
  // Subclasses only override toDisplayObject() + validate()
}
```

### Example: HomePage (Now Tiny!)

```javascript
// apps/quotation/components/HomePage.js
import { ControllerBase } from '../base/ControllerBase.js';

export class HomePage extends ControllerBase {
  getActions() {
    return [
      { id: 'NEW_QUOTATION', label: 'Nueva Cotización', icon: '✨' },
      { id: 'LOAD_PREVIOUS', label: 'Cargar Anterior', icon: '📋' },
      { id: 'VIEW_DATABASE', label: 'Ver Base de Datos', icon: '📊' }
    ];
  }

  clickAction(actionId) {
    this.emit(actionId, { action: actionId });
  }

  toDisplayObject() {
    return {
      actions: this.getActions(),
      isOpen: this.isOpen()
    };
  }
}

export function createHomePage() {
  return new HomePage();
}
```

### Example: QuotationInitializer (Now Simple!)

```javascript
// apps/quotation/components/QuotationInitializer.js
import { ControllerBase } from '../base/ControllerBase.js';

export class QuotationInitializer extends ControllerBase {
  constructor(currentContext = null) {
    super();
    if (currentContext) {
      this.setField('pax', currentContext.pax);
      this.setField('fecha', currentContext.fecha);
      this.setField('duracion', currentContext.duracion);
    }
  }

  validate() {
    const errors = [];
    if (!this.getField('pax') || this.getField('pax') < 1) {
      this.setFieldError('pax', 'Pax es requerido (mínimo 1)');
      errors.push('pax');
    }
    if (!this.getField('fecha')) {
      this.setFieldError('fecha', 'Fecha es requerida');
      errors.push('fecha');
    }
    if (!this.getField('duracion') || this.getField('duracion') < 1) {
      this.setFieldError('duracion', 'Duración es requerida (mínimo 1 día)');
      errors.push('duracion');
    }
    return errors;
  }

  async submit() {
    const errors = this.validate();
    if (errors.length > 0) {
      this.emit('VALIDATION_ERROR', { errors, fields: this.getFormErrors() });
      return;
    }

    // Wait for DB if preloader provided
    const preloader = this.getService('databasePreloader');
    if (preloader) {
      this.setLoading(true);
      try {
        if (!preloader.isReady()) {
          await preloader.load();
        }
      } catch (error) {
        this.setLoading(false);
        this.addError(error.message);
        this.emit('DB_LOAD_ERROR', { error });
        return;
      }
      this.setLoading(false);
    }

    this.emit('FORM_SUBMITTED', this.getFormState());
  }

  cancel() {
    this.emit('FORM_CANCELLED');
  }

  open() {
    super.open();
    const preloader = this.getService('databasePreloader');
    if (preloader) {
      // Start loading in background (don't wait)
      preloader.load().catch(err => {
        this.addError(err.message);
      });
    }
    return this;
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      isLoading: this.isLoading(),
      formData: this.getFormState(),
      formErrors: this.getFormErrors(),
      errors: this.getErrors()
    };
  }
}

export function createQuotationInitializer(currentContext = null) {
  return new QuotationInitializer(currentContext);
}
```

### Example: ClientSelector

```javascript
// apps/quotation/components/ClientSelector.js
import { ControllerBase } from '../base/ControllerBase.js';

export class ClientSelector extends ControllerBase {
  #clients = [];
  #focusedIndex = 0;

  constructor(clients = []) {
    super();
    #clients = clients;
  }

  search(term) {
    this.setField('searchTerm', term.toLowerCase());
  }

  getFilteredClients() {
    const term = this.getField('searchTerm') || '';
    if (term.length < 2) return [];
    return this.#clients.filter(
      c =>
        c.nombre.toLowerCase().includes(term) ||
        c.rut.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
    );
  }

  selectClient(clientId) {
    const client = this.#clients.find(c => c.id === clientId);
    if (client) {
      this.emit('CLIENT_SELECTED', client);
    }
  }

  cancel() {
    this.emit('CANCEL');
  }

  toDisplayObject() {
    return {
      isOpen: this.isOpen(),
      searchTerm: this.getField('searchTerm') || '',
      filteredClients: this.getFilteredClients(),
      focusedIndex: this.#focusedIndex
    };
  }
}

export function createClientSelector(clients = []) {
  return new ClientSelector(clients);
}
```

---

## State Machine Integration (Leverage XStateable!)

```javascript
// apps/quotation/state/AppStateMachine.js
import { Rulable } from 'claps_codelab/packages/domain/src/mixins/index.js';

// State machine can use Rulable for condition evaluation!
export class AppStateMachine extends Rulable(class {}) {
  #state = 'BROWSE';
  #context = {};

  getState() {
    return { value: this.#state, context: this.#context };
  }

  send(event, payload = {}) {
    // Can evaluate rules here for complex transitions
    this.receiveContext(this.#context);
    
    // State transitions...
    if (this.#state === 'BROWSE' && event === 'OPEN_CLIENT_MODAL') {
      this.#state = 'CLIENT_SELECTOR';
    }
    // ...etc
  }
}
```

---

## Architecture Benefits

### Before (Original Plan)
- ❌ Repetitive controller code (on/emit/listeners in every component)
- ❌ No inheritance of common patterns
- ❌ Duplicate form validation logic
- ❌ Manual modal lifecycle management

### After (Mixin-Based)
- ✅ **50% less code** — Mixins provide common behavior
- ✅ **Single responsibility** — Each mixin does one thing
- ✅ **Easy to test** — Mixins are pure, testable functions
- ✅ **Highly reusable** — New components just compose mixins
- ✅ **Consistent patterns** — Same as domain package
- ✅ **Chainable API** — Fluent `.method().method()` style
- ✅ **Dependency injection** — Services injected, not imported

---

## File Structure (Refined)

```
apps/quotation/
├── index.html
├── app.js
│
├── mixins/                        ← NEW: UI-specific mixins
│   ├── Modalable.js
│   ├── Eventable.js
│   ├── Formable.js
│   ├── Servable.js
│   └── index.js
│
├── base/                          ← NEW: Base controller using mixins
│   ├── ControllerBase.js
│   └── index.js
│
├── components/
│   ├── HomePage.js               ← Tiny now (extends ControllerBase)
│   ├── ClientSelector.js
│   ├── QuotationInitializer.js
│   ├── GlobalVariablesForm.js
│   └── *.html templates
│
├── state/
│   ├── AppStateMachine.js         ← Can use Rulable!
│   └── appStateMachine.test.js
│
├── services/
│   ├── DatabasePreloader.js
│   └── DatabasePreloader.test.js
│
└── styles/
    └── app.css
```

---

## Porting Existing Code

The original implementation plan's code can be refactored to use mixins:

### Original HomePage Controller
```javascript
// Before: ~40 lines of boilerplate
export function createHomePageController() {
  let listeners = {};
  const controller = {
    isVisible() { return true; },
    getActions() { /* ... */ },
    clickAction(actionId) { /* ... */ },
    on(eventName, callback) { listeners[eventName] = callback; }
  };
  return controller;
}
```

### Refactored HomePage with Mixins
```javascript
// After: ~12 lines, all logic
export class HomePage extends ControllerBase {
  getActions() { /* ... */ }
  clickAction(actionId) { this.emit(actionId, ...); }
  toDisplayObject() { /* ... */ }
}
```

**Result:** 67% less code, same functionality, better structure.

---

## Implementation Path (Revised)

### Phase 0: Create UI Mixins (Foundation)
- [ ] Create `apps/quotation/mixins/Modalable.js`
- [ ] Create `apps/quotation/mixins/Eventable.js`
- [ ] Create `apps/quotation/mixins/Formable.js`
- [ ] Create `apps/quotation/mixins/Servable.js`
- [ ] Create `apps/quotation/base/ControllerBase.js`

### Phase 1: Build Components Using Mixins
- [ ] HomePage (uses Modalable, Eventable)
- [ ] ClientSelector (uses Formable, Eventable)
- [ ] QuotationInitializer (uses Formable, Modalable, Servable, Eventable)

### Phase 2: State Machine & Integration
- [ ] Update AppStateMachine to use Rulable for conditions
- [ ] Connect components via event emission
- [ ] Implement Alpine sync via toDisplayObject()

---

## Shared DNA with Domain Package

| Pattern | Domain Package | UI Components |
|---------|---|---|
| **Mixins** | Alpineable, Rulable, Prizable, etc. | Modalable, Eventable, Formable, Servable |
| **Composition** | `Alpineable(Rulable(Base))` | `Modalable(Eventable(Formable(Base)))` |
| **Contracts** | `toDisplayObject()` required | `toDisplayObject()` required |
| **Chainable** | `.receiveContext().calculate()` | `.setField().validate().submit()` |
| **Dependency Injection** | Evaluators, pricing functions | Database preloader, services |
| **Event Communication** | XState events | Custom event emitters |

---

## Summary

By adopting the domain package's mixin composition pattern, we:
1. ✅ **Eliminate code duplication** — Common UI patterns become mixins
2. ✅ **Maintain consistency** — Same architecture across codebase
3. ✅ **Improve testability** — Dependencies injected, no imports
4. ✅ **Enable composition** — New components just mix and match
5. ✅ **Reduce cognitive load** — Developers recognize familiar patterns

**This is the "DRY + YAGNI" principle applied to architecture.**

---

## Next Steps

1. **Approve mixin design** — Does this feel right?
2. **Create UI mixins** — Phase 0 implementation
3. **Refactor components** — Use ControllerBase
4. **Update implementation plan** — Use refined approach
5. **Proceed with execution** — Far less boilerplate to write

