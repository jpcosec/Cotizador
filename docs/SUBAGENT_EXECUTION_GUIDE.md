# Subagent Execution Guide: UI Component Architecture Implementation

**For: Low-context subagents executing the task list independently**  
**Project:** CotizadorLodge - Quotation System UI Components  
**Start Date:** 2026-02-24  
**Total Tasks:** 29  
**Estimated Duration:** 19-27 hours  

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Architecture Primer](#architecture-primer)
4. [Task Execution Pattern](#task-execution-pattern)
5. [File Structure](#file-structure)
6. [Testing Strategy](#testing-strategy)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Definition of Done](#definition-of-done)

---

## Quick Start

### Before You Start
1. Read this entire document (20 minutes)
2. Review `FINAL_COMPONENT_HIERARCHY.md` (understand the 20 components)
3. Review `MIXINS_COMPLETE_INVENTORY.md` (understand the 10 mixins)
4. Ask clarifying questions NOW (before starting)

### Your Job
Execute tasks in order (1 → 2 → 3 → ... → 29):
- Each task is in the task list (use `/tasks` to view)
- Each task has detailed requirements
- Your job: Build the code, run tests, commit

### Getting Help
- **Stuck on a task?** Read the "REFERENCE" section of that task
- **Don't understand mixins?** Re-read Architecture Primer section 2.2
- **Test failing?** Check Troubleshooting section
- **Architecture question?** Check Common Patterns section

---

## Project Overview

### What We're Building
A **quotation system for SF Lodge** (event catering venue) with:
- **Modal Flow:** HomePage → ClientSelector → QuotationInitializer → Quotation
- **Quotation View:** Sidebar (catalog) + Main (basket/editing)
- **Summary:** ValidationSummary → CompletionSuccess

### Tech Stack
- **Alpine.js v3.12+** — Reactive UI binding
- **XState v5** — State machine orchestration
- **Vanilla JavaScript ES2020+** — All code
- **Vitest** — Testing framework
- **No external UI libraries** — Pure HTML/CSS/JS

### Why This Architecture?
- **DRY (Don't Repeat Yourself)** — Mixins eliminate code duplication
- **YAGNI (You Aren't Gonna Need It)** — Only build what's needed
- **TDD (Test-Driven Development)** — Tests first, then code
- **Composability** — Mix and match functionality via mixins

---

## Architecture Primer

### 1. What Are Mixins?

A **mixin** is a function that adds functionality to a class:

```javascript
// Before: Manual implementation
class MyClass {
  on(event, callback) { /* ... */ }
  emit(event, data) { /* ... */ }
  off(event, callback) { /* ... */ }
}

// After: Using Eventable mixin
export function Eventable(Base) {
  return class extends Base {
    on(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
    off(event, callback) { /* ... */ }
  };
}

// Use it:
class MyClass extends Eventable(class {}) { }
```

**Benefits:**
- ✅ Write once, use everywhere
- ✅ Easy to test in isolation
- ✅ Easy to combine
- ✅ No duplicate code

### 2. The Two Mixin Layers

#### Layer 1: Domain Mixins (Business Logic)
```
Prizable    → Item pricing with pax/cantidad/duracion
Aggregable  → Container sums child prices
Rulable     → Rule evaluation + context flow
Storable    → Database persistence
```

#### Layer 2: UI Mixins (Interface Behavior)
```
Modalable   → Modal open/close/loading
Formable    → Form state + validation
Eventable   → Event emission (observer pattern)
Serviceable → Dependency injection
Alpineable  → Alpine.js sync contract
Actorlike   → XState actor communication
```

### 3. Composing Mixins into Base Classes

**Base classes** combine mixins:

```javascript
// Domain base class
const ItemMixin = (Base) => 
  Alpineable(Storable(Rulable(Prizable(Actorlike(Base)))));
class ItemBase extends ItemMixin(class {}) { }

// UI base class
const ModalMixin = (Base) =>
  Alpineable(Eventable(Serviceable(Formable(Modalable(Base)))));
class ModalControllerBase extends ModalMixin(class {}) { }
```

**Each component extends ONE base class:**
```javascript
class HomePage extends ViewBase { }
class ClientSelector extends ModalControllerBase { }
class Basket extends UIContainerBase { }
```

### 4. Method Chaining

All methods return `this` so you can chain:

```javascript
const item = new Item()
  .setUserQuantity('pax', 50)
  .calculatePrice()
  .evaluateRules(evaluator)
  .receiveContext({ fecha: '2026-03-15' });
```

### 5. The Alpine.js Contract

Every component implements `toDisplayObject()`:

```javascript
class HomePage extends ViewBase {
  toDisplayObject() {
    return {
      actions: this.getActions(),
      isVisible: this.isOpen()
    };
  }
}
```

This object is passed to Alpine.js for binding:
```html
<div x-data="myComponent()" x-text="actions[0].label"></div>
```

---

## Task Execution Pattern

### For Every Task, Follow This Exact Sequence

#### Step 1: Read the Task
```bash
# Use the task tool to read the task details
# Look for:
# - Files to create/modify
# - Requirements (what to build)
# - Tests to write
# - Success criteria
# - Reference documentation
```

#### Step 2: Create Test File (TDD)
```bash
# File: packages/components/common/mixins/domain/Prizable.test.js
# Pattern: One test per mixin feature

import { describe, it, expect } from 'vitest';
import { Prizable } from './Prizable.js';

describe('Prizable', () => {
  it('should resolve pax from context', () => {
    const Base = class { _inheritedContext = {}; };
    const TestClass = Prizable(Base);
    const obj = new TestClass();
    
    obj._inheritedContext = { pax: 50 };
    obj.resolveQuantities();
    
    expect(obj.pax).toBe(50);
  });

  // Add more tests...
});
```

#### Step 3: Run Test (Should Fail)
```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm test -- packages/components/common/mixins/domain/Prizable.test.js
# Expected: FAIL (not implemented yet)
```

#### Step 4: Implement Minimal Code
```javascript
// File: packages/components/common/mixins/domain/Prizable.js

export function Prizable(Base) {
  return class extends Base {
    pax = null;
    paxIsUserSet = false;
    // ... other properties ...

    resolveQuantities(containerContext = {}) {
      if (!this.paxIsUserSet) {
        this.pax = containerContext.pax ?? this._defaultPax ?? null;
      }
      return this;
    }

    // ... other methods ...
  };
}
```

**Key:** Make it MINIMAL. Only code to pass the test.

#### Step 5: Run Test (Should Pass)
```bash
npm test -- packages/components/common/mixins/domain/Prizable.test.js
# Expected: PASS
```

#### Step 6: Commit with Conventional Message
```bash
git add packages/components/common/mixins/domain/Prizable.js \
        packages/components/common/mixins/domain/Prizable.test.js

git commit -m "feat: create Prizable mixin for item pricing

- Implement quantity resolution from context
- Support pax/cantidad/duracion with isUserSet flags
- Implement calculatePrice() using injected pricing function
- All methods return this for chaining"
```

**Commit Message Format:**
```
type(scope): short description

Detailed explanation of what was implemented
- Feature 1
- Feature 2
- Feature 3
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`

#### Step 7: Move to Next Task
```bash
# Get the next task number
# Read the task requirements
# Repeat steps 1-6
```

---

## File Structure

### Where Files Go

```
/home/jp/CotizadorLodge/claps_codelab_rebuild_components/

packages/components/
│
├── common/
│   ├── mixins/
│   │   ├── domain/
│   │   │   ├── Prizable.js           ← Task #1
│   │   │   ├── Prizable.test.js
│   │   │   ├── Aggregable.js         ← Task #2
│   │   │   ├── Aggregable.test.js
│   │   │   ├── Rulable.js            ← Task #3
│   │   │   ├── Rulable.test.js
│   │   │   ├── Storable.js           ← Task #4
│   │   │   ├── Storable.test.js
│   │   │   └── index.js
│   │   │
│   │   ├── ui/
│   │   │   ├── Modalable.js          ← Task #5
│   │   │   ├── Modalable.test.js
│   │   │   ├── Formable.js           ← Task #6
│   │   │   ├── Formable.test.js
│   │   │   ├── Eventable.js          ← Task #7
│   │   │   ├── Eventable.test.js
│   │   │   ├── Serviceable.js        ← Task #8
│   │   │   ├── Serviceable.test.js
│   │   │   ├── Alpineable.js         ← Task #9
│   │   │   ├── Alpineable.test.js
│   │   │   ├── Actorlike.js          ← Task #10
│   │   │   ├── Actorlike.test.js
│   │   │   └── index.js
│   │   │
│   │   └── index.js
│   │
│   └── base/
│       ├── domain/
│       │   ├── ItemBase.js           ← Task #11
│       │   ├── ItemBase.test.js
│       │   ├── ContainerBase.js      ← Task #12
│       │   ├── ContainerBase.test.js
│       │   └── index.js
│       │
│       ├── ui/
│       │   ├── ModalControllerBase.js ← Task #13
│       │   ├── ModalControllerBase.test.js
│       │   ├── UIContainerBase.js    ← Task #14
│       │   ├── UIContainerBase.test.js
│       │   ├── ViewBase.js           ← Task #15
│       │   ├── ViewBase.test.js
│       │   └── index.js
│       │
│       └── index.js
│
├── counter-composed/
│   ├── logic/
│   │   ├── createCounterComposedComponent.js (MODIFY - Task #17)
│   │   ├── CounterComposedController.js (NEW - Task #17)
│   │   └── ...
│   └── ...
│
└── quotation/
    ├── modals/
    │   ├── HomePage.js               ← Task #19
    │   ├── HomePage.html
    │   ├── home.test.js
    │   ├── ClientSelector.js         ← Task #20
    │   ├── ClientSelector.html
    │   ├── clientSelector.test.js
    │   ├── QuotationInitializer.js  ← Task #21
    │   ├── QuotationInitializer.html
    │   ├── quotationInitializer.test.js
    │   └── ...
    │
    └── views/
        ├── QuotationView.js          ← Task #24
        ├── QuotationView.html
        ├── quotationView.test.js
        ├── Sidebar.js                ← Task #25
        ├── Sidebar.html
        ├── sidebar.test.js
        └── ...
```

### Creating Directories
```bash
# If directory doesn't exist, create it:
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/common/mixins/domain
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/common/mixins/ui
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/common/base/domain
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/common/base/ui
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/quotation/modals
mkdir -p /home/jp/CotizadorLodge/claps_codelab_rebuild_components/packages/components/quotation/views
```

---

## Testing Strategy

### For Mixins (Phase 0)

Each mixin needs tests for its public methods:

```javascript
describe('Eventable', () => {
  it('should register listener via on()', () => {
    const Base = class {};
    const TestClass = Eventable(Base);
    const obj = new TestClass();
    
    let called = false;
    obj.on('TEST_EVENT', () => { called = true; });
    obj.emit('TEST_EVENT', {});
    
    expect(called).toBe(true);
  });

  it('should unregister listener via off()', () => {
    const Base = class {};
    const TestClass = Eventable(Base);
    const obj = new TestClass();
    
    const callback = () => { };
    obj.on('TEST_EVENT', callback);
    obj.off('TEST_EVENT', callback);
    
    // Should not call callback anymore
    expect(obj._listeners['TEST_EVENT'].length).toBe(0);
  });

  it('should return this for chaining', () => {
    const Base = class {};
    const TestClass = Eventable(Base);
    const obj = new TestClass();
    
    const result = obj.on('event', () => {});
    expect(result).toBe(obj);
  });
});
```

### For Components

Components need tests for:
1. ✅ Initialization
2. ✅ Mixin methods available
3. ✅ Public methods work
4. ✅ Events emitted correctly
5. ✅ Display object format correct

```javascript
describe('HomePage', () => {
  it('should extend ViewBase', () => {
    const home = new HomePage();
    expect(typeof home.on).toBe('function');
    expect(typeof home.emit).toBe('function');
    expect(typeof home.toDisplayObject).toBe('function');
  });

  it('should return actions array', () => {
    const home = new HomePage();
    const actions = home.getActions();
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBe(3);
  });

  it('should emit action event when clicked', () => {
    const home = new HomePage();
    let emitted = false;
    
    home.on('NEW_QUOTATION', () => { emitted = true; });
    home.clickAction('NEW_QUOTATION');
    
    expect(emitted).toBe(true);
  });

  it('should return display object', () => {
    const home = new HomePage();
    const display = home.toDisplayObject();
    
    expect(display).toHaveProperty('actions');
    expect(display).toHaveProperty('isVisible');
    expect(Array.isArray(display.actions)).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- packages/components/common/mixins/domain/Prizable.test.js

# Run with verbose output
npm test -- --reporter=verbose

# Watch mode (rerun on file change)
npm test -- --watch
```

### Expected Test Output
```
✓ Prizable (3 tests)
  ✓ should resolve pax from context
  ✓ should set isUserSet flag
  ✓ should return this for chaining

PASS: packages/components/common/mixins/domain/Prizable.test.js (150ms)
```

---

## Common Patterns

### Pattern 1: Mixin Structure

All mixins follow this pattern:

```javascript
export function MixinName(Base) {
  return class extends Base {
    // Private properties (use _ prefix)
    _privateProperty = null;

    // Public methods
    publicMethod() {
      // Implementation
      return this;  // Always return this for chaining
    }

    // Getter
    get someProperty() {
      return this._privateProperty;
    }
  };
}
```

### Pattern 2: Composing Multiple Mixins

Mixins compose left-to-right (read inside-out):

```javascript
// Pattern: Mixin1(Mixin2(Mixin3(Base)))
// Read as: Apply Mixin3, then Mixin2, then Mixin1

const ModalMixin = (Base) =>
  Alpineable(Eventable(Serviceable(Formable(Modalable(Base)))));

class ModalControllerBase extends ModalMixin(class {}) {}
```

This gives all methods from all mixins:
- From Alpineable: `toDisplayObject()`
- From Eventable: `on()`, `emit()`, `off()`
- From Serviceable: `injectService()`, `getService()`
- From Formable: `setField()`, `getField()`, `validate()`
- From Modalable: `open()`, `close()`, `setLoading()`

### Pattern 3: Test-Driven Development

**Always follow this sequence:**

```
1. Write test (should FAIL)
   ↓
2. Run test to confirm it FAILS
   ↓
3. Write minimal implementation
   ↓
4. Run test to confirm it PASSES
   ↓
5. Commit changes
   ↓
6. Move to next test/task
```

**Never:** Write code then tests. Always write tests first.

### Pattern 4: Method Chaining

Every method that modifies state should return `this`:

```javascript
export function Formable(Base) {
  return class extends Base {
    _formState = {};

    setField(name, value) {
      this._formState[name] = value;
      return this;  // ← Always return this
    }
  };
}

// Usage:
controller
  .setField('pax', 50)
  .setField('fecha', '2026-03-15')
  .submit();
```

### Pattern 5: Contract Enforcement

Mixins that require subclass implementation throw errors:

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

export function Formable(Base) {
  return class extends Base {
    validate() {
      throw new Error(
        `${this.constructor.name} must implement validate()`
      );
    }
  };
}
```

Subclasses override these:

```javascript
class MyForm extends ModalControllerBase {
  validate() {
    // Implementation
    return [];  // Return error array
  }

  toDisplayObject() {
    // Implementation
    return { /* state */ };
  }
}
```

---

## Troubleshooting

### Problem: Test Fails with "Method not defined"

**Cause:** Mixin not composed correctly  
**Solution:** Check mixin composition order in base class
```javascript
// Wrong: Missing Eventable
const BadMixin = (Base) => Alpineable(Formable(Base));

// Correct:
const GoodMixin = (Base) => Alpineable(Eventable(Formable(Base)));
```

### Problem: "this is not defined"

**Cause:** Arrow function used where `this` is needed  
**Solution:** Use regular function, not arrow function
```javascript
// Wrong:
const callback = () => { this.emit(...); };  // ← arrow function

// Correct:
const callback = function() { this.emit(...); };  // ← regular function

// Or use bind:
const callback = () => { this.emit(...); };
obj.on('event', callback.bind(this));
```

### Problem: Infinite Loop in Tests

**Cause:** Test calls method that calls same method  
**Solution:** Check for recursive calls, mock dependencies
```javascript
// Wrong: calculatePrice calls itself
calculatePrice() {
  this.calculatePrice();  // ← Infinite recursion!
}

// Correct: calculatePrice calls other methods
calculatePrice() {
  const result = this._pricingFn(...);  // ← Use injected function
  this._price = result;
}
```

### Problem: "Cannot read property of undefined"

**Cause:** Mixin added property but didn't initialize  
**Solution:** Initialize properties in mixin
```javascript
// Wrong: Property accessed but not initialized
export function MyMixin(Base) {
  return class extends Base {
    doSomething() {
      this._state.value = 10;  // ← _state is undefined!
    }
  };
}

// Correct: Initialize property
export function MyMixin(Base) {
  return class extends Base {
    _state = {};  // ← Initialize

    doSomething() {
      this._state.value = 10;  // ← Now it works
    }
  };
}
```

### Problem: Tests Pass but Code Doesn't Work

**Cause:** Test is incomplete, doesn't cover actual usage  
**Solution:** Write more comprehensive tests
```javascript
// Incomplete test:
it('should work', () => {
  const obj = new MyClass();
  obj.doSomething();
  expect(true).toBe(true);  // ← Doesn't verify anything!
});

// Complete test:
it('should update state when doSomething called', () => {
  const obj = new MyClass();
  obj.doSomething();
  expect(obj._state).toEqual({ changed: true });
  expect(obj.getValue()).toBe(42);
});
```

---

## Definition of Done

### For Each Task, Verify:

- ✅ **Test file created** → See `.test.js` file
- ✅ **Tests written** → Test covers all requirements
- ✅ **Tests fail initially** → Run `npm test`, see red X marks
- ✅ **Implementation complete** → Code written to pass tests
- ✅ **Tests pass** → Run `npm test`, see green checkmarks
- ✅ **Code committed** → `git log` shows commit message
- ✅ **No console errors** → Run `npm test`, no error output
- ✅ **Method chaining works** → All methods return `this`
- ✅ **Documentation clear** → Code is self-explanatory

### Commit Before Moving On

```bash
# Check status
git status

# Add files
git add packages/components/...

# Commit
git commit -m "feat: [TASK#N] description"

# Verify
git log --oneline -5
```

### Success Metrics

By end of Phase 0 (15 tasks):
- ✅ All 10 mixins created (100 lines each)
- ✅ All 5 base classes created (300 lines total)
- ✅ All 60+ tests passing
- ✅ Zero duplicate code
- ✅ All methods chainable

By end of Phase 1 (3 tasks):
- ✅ counter-composed refactored
- ✅ counter-composed tests still pass
- ✅ Code reduced by 70%+

By end of all 29 tasks:
- ✅ 20 components built
- ✅ Modal flow working
- ✅ Quotation view complete
- ✅ All tests passing
- ✅ Zero unresolved TODOs

---

## Commands You'll Use Daily

```bash
# Navigate to project
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components

# Run tests
npm test

# Run specific test
npm test -- packages/components/common/mixins/domain/Prizable.test.js

# Check git status
git status

# Commit
git commit -m "feat: message"

# View recent commits
git log --oneline -10

# See current task details
# (Use the /tasks command to see task list)
```

---

## Quick Reference: Mixin Checklist

### For EACH mixin, verify:

- [ ] File created: `packages/components/common/mixins/[domain|ui]/MixinName.js`
- [ ] Test file created: `packages/components/common/mixins/[domain|ui]/MixinName.test.js`
- [ ] All public methods exported from mixin
- [ ] All methods return `this` for chaining
- [ ] Private properties prefixed with `_`
- [ ] All properties initialized
- [ ] Tests cover all public methods
- [ ] Tests verify chaining works
- [ ] All tests pass (`npm test`)
- [ ] Changes committed with proper message

### For EACH base class, verify:

- [ ] File created: `packages/components/common/base/[domain|ui]/BaseName.js`
- [ ] Test file created: `packages/components/common/base/[domain|ui]/BaseName.test.js`
- [ ] All mixin methods available on class
- [ ] Correct mixins composed
- [ ] All contract methods present (e.g., `toDisplayObject()`)
- [ ] Tests verify all mixin methods work
- [ ] Tests verify composition is correct
- [ ] All tests pass (`npm test`)
- [ ] Changes committed with proper message

---

## Getting Started Now

1. **Read this document completely** (30 minutes)
2. **Review referenced docs:**
   - `FINAL_COMPONENT_HIERARCHY.md`
   - `MIXINS_COMPLETE_INVENTORY.md`
3. **Verify project setup:**
   ```bash
   cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
   npm test  # Should run (might have zero tests)
   ```
4. **Start Task #1:**
   - Read task details
   - Create test file
   - Follow TDD pattern
   - Commit when done
5. **Move to Task #2**

---

## Support Resources

### Documentation in Repo
- `FINAL_COMPONENT_HIERARCHY.md` — Visual component structure
- `MIXINS_COMPLETE_INVENTORY.md` — Detailed mixin descriptions
- `COMPONENTS_INVENTORY_AND_PATTERNS.md` — Pattern analysis

### Code References
- `packages/components/counter-composed/` — Working example
- `claps_codelab/packages/domain/src/mixins/` — Domain mixins (reference)
- `claps_codelab/packages/domain/src/base/ItemBase.js` — Domain base class (reference)

### When Stuck
1. Re-read the "Common Patterns" section above
2. Check the task's REFERENCE section
3. Look at existing implementations in counter-composed
4. Read the relevant documentation file

---

## You're Ready!

This document has given you everything you need:
- ✅ Understanding of architecture
- ✅ Step-by-step execution pattern
- ✅ File structure and paths
- ✅ Testing strategy
- ✅ Common patterns
- ✅ Troubleshooting guide
- ✅ Definition of done

**Start with Task #1. Good luck!**

Questions? Re-read the relevant section above. Most answers are here.

