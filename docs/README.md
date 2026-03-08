# Documentation Index

Technical documentation for the CotizadorLodge rebuild components worktree.
For roadmap and step-by-step planning, see [`../ROADMAP.md`](../ROADMAP.md).

## Folder Guide

### ARCHITECTURE/
Core technical decisions and design documents for component architecture.

- `component-architecture.md` — Component structure pattern, lifecycle, and state management
- `item-component.md` — Item component design, modes (catalog/basket), and context flow
- `rules-engine-integration.md` — JSON-Logic rules engine architecture and evaluation flow
- `state-machine-pattern.md` — XState integration pattern across components
- `alpine-xstate-bridge.md` — Alpine.js ↔ XState synchronization and component mounting

### PACKAGES/
Per-package technical reference.

- `components.md` — `packages/components/` structure (item, quotation parts, common base/mixins)
- `pricing.md` — `packages/pricing/` logic layer reference
- `xstate.md` — `packages/xstate/` machine definitions and interactions

### GUIDES/
Practical how-tos and tutorials.

- `creating-a-component.md` — Step-by-step guide to create a new component
- `testing-components.md` — Testing patterns, setup, and test structure
- `debugging-components.md` — Common debugging techniques and troubleshooting

### DEPLOYMENT/
Build and deployment flows.

- `gas-bundling.md` — Rollup + GAS workspace generation and clasp deploy steps

### DOMAIN/
Domain model and business logic documentation.

- `item-domain-logic.md` — Item pricing, quantity, formatting, and rule evaluation
- `component-context.md` — How context flows through components and machines

## Key Files

| File | Purpose |
|------|---------|
| `packages/components/item/Item.js` | Core Item class (mode mgmt, lifecycle, calculations) |
| `packages/components/item/machine/itemMachine.js` | XState machine definition for Item |
| `packages/components/item/domain/index.js` | Pure domain logic (pricing, quantity, formatting) |
| `packages/components/item/domain/rulesEngine/coordinator.js` | JSON-Logic rules evaluation engine |
| `packages/components/item/ui/ItemDisplay.html` | Item component HTML template (production view) |
| `packages/components/item/ui/ResolverPanel.html` | Database resolver panel (sandbox debugging) |
| `apps/sandbox/playground/item/mountItemPlayground.js` | Item playground mounting (context wiring) |

## Test Structure

All tests located in `packages/components/item/tests/`:

| File | Tests | Coverage |
|------|-------|----------|
| `Item.test.js` | 88 | Factories, modes, calculations, serialization, user overrides |
| `pricing.test.js` | 82 | Type conversion, kind detection, pricing enums |
| `quantity.test.js` | 80 | Context resolution, override precedence, defaults |
| `formatting.test.js` | 69 | Display strings, all kinds and modes |
| **TOTAL** | **530** | 529 passing + 1 skipped ✅ |

## Architecture Quick View

```
Component (e.g., Item)
├── Machine (XState)          ← State transitions, lifecycle
├── Domain Logic              ← Pure functions (pricing, quantity, format)
├── Rules Engine              ← JSON-Logic evaluation (blocking, warnings)
├── UI (Alpine.js)            ← Reactive HTML, Alpine bindings
└── Tests                     ← Vitest + Puppeteer
```

Each component:
- Has **one XState actor** managing lifecycle and state
- Is mounted by a **playground adapter** under `apps/sandbox/playground/**`
- Uses **pure domain functions** for calculations
- Passes context through **machine actions** to UI
- Evaluates **rules independently** per component instance

## Common Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Start sandbox (serves components)
npm run serve:sandbox

# Run interactive REPL (pricing)
cd packages/pricing && npm run interactive
```

## Quick Navigation

| I want to... | Read this |
|--------------|-----------|
| Understand component structure | `ARCHITECTURE/component-architecture.md` |
| Learn how Item works | `ARCHITECTURE/item-component.md` |
| Add a new rule type | `ARCHITECTURE/rules-engine-integration.md` |
| Create a new component | `GUIDES/creating-a-component.md` |
| Debug a failing test | `GUIDES/debugging-components.md` |
| See rules in action | `packages/components/item/domain/rulesEngine/coordinator.test.js` |

---

**Last Updated:** 2026-02-24
**Total Tests:** 529 passing + 1 skipped ✅
**Status:** Step 3 in progress (Rules & Category Profiles)
