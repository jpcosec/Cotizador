# UI Island Pattern: Item Micro-State-Machines

## What This Is

A UI architecture pattern where each item in the basket timeline is an **isolated Alpine
component** with its own local state — rather than a "dumb row" driven entirely by the parent
component. The parent container owns shared state (paxGlobal, basket lines, totals); each item
owns UI state (expanded/collapsed, editing mode, saving indicator).

This was validated via a working prototype: `experiment/micro_state_machine.html`.

---

## The Problem It Solves

In the current `Components_Timeline.html`, every accordion row is part of one giant
`cotizadorApp()` component. This means:

- Expanding item #2 touches the same Alpine scope that manages paxGlobal, client selection,
  and every other piece of app state — any reactive update can collapse expanded rows
- "Editing" state (draft pax input before commit) has nowhere to live except in the parent,
  which pollutes a global component with per-row concerns
- A per-item saving spinner is impossible without adding `savingLineId` tracking to the parent
- Re-rendering the list can reset local UI state (collapsed, in-progress edits)

---

## The Pattern

### Three communication channels

```
┌─────────────────────────────────────────────────────────┐
│  Container (cotizadorApp / basket store)                │
│  owns: paxGlobal, lines[], totals                       │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │ ItemComponent │  │ ItemComponent │  │ ItemComp.  │  │
│  │ owns:         │  │ owns:         │  │ owns:      │  │
│  │  expanded     │  │  expanded     │  │  expanded  │  │
│  │  editing      │  │  editing      │  │  editing   │  │
│  │  saving       │  │  saving       │  │  saving    │  │
│  └───────────────┘  └───────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

| Direction | Mechanism | Example |
|-----------|-----------|---------|
| Container → Items | `document.dispatchEvent(CustomEvent)` | `basket:pax-changed` |
| Item → Container | `Alpine.store('basket').method()` | `store.updatePax(lineId, 3)` |
| Item local state | `x-data="itemComponent(lineId)"` | `expanded`, `editing`, `saving` |

### Template structure

```html
<!-- Container: owns paxGlobal input and the line list -->
<div x-data="{ get basket() { return $store.basket } }">

  <input :value="$store.basket.paxGlobal"
         @change="$store.basket.setGlobalPax($event.target.value)">

  <template x-for="line in $store.basket.lines" :key="line.lineId">

    <!-- Each item is its OWN Alpine component -->
    <div x-data="itemComponent(line.lineId)" @destroy="destroy()">

      <div @click="toggle()">
        <span x-text="line.name"></span>
        <span class="badge" x-show="hasOverride">override: <span x-text="line.Override_Pax"></span></span>
        <span x-show="editing">editando</span>
        <span x-show="saving">guardando...</span>
      </div>

      <div x-show="expanded">
        <input :value="displayPax" @blur="commitPax()" @input="localPaxInput = $event.target.value">
        <button x-show="hasOverride" @click="clearOverride()">↺ global</button>
      </div>

    </div>
  </template>

</div>
```

### Item component factory

```javascript
window.itemComponent = function(lineId) {
  return {
    lineId,

    // ── Local UI state (isolated, not in parent) ──────────────
    expanded:      false,
    editing:       false,
    saving:        false,
    localPaxInput: null,    // draft while user is typing

    // ── Read from store ───────────────────────────────────────
    get line()        { return Alpine.store('basket').lines.find(l => l.lineId === this.lineId) },
    get hasOverride() { return this.line?.Override_Pax !== null },
    get displayPax()  { return this.line?.Override_Pax ?? Alpine.store('basket').paxGlobal },
    get total()       { return Alpine.store('basket').linePrice(this.line) },

    // ── Lifecycle ─────────────────────────────────────────────
    init() {
      this._paxHandler = (e) => this._onGlobalPaxChanged(e.detail.paxGlobal)
      document.addEventListener('basket:pax-changed', this._paxHandler)
    },
    destroy() {
      document.removeEventListener('basket:pax-changed', this._paxHandler)
    },

    // ── React to global pax push ──────────────────────────────
    // Items with no override: nothing to do — displayPax computed value auto-updates
    // Items with override: they are now "diverged" — show indicator, optionally prompt
    _onGlobalPaxChanged(newPax) {
      if (!this.hasOverride) return
      // Future: prompt user "reset to global?" or show divergence warning
    },

    // ── Local actions ─────────────────────────────────────────
    toggle()      { this.expanded = !this.expanded },
    startEditing(){ this.editing = true; this.localPaxInput = this.displayPax },

    commitPax() {
      this.saving = true
      // In real app: bridge.send('UPDATE_ITEM', { lineId, overrides: { Override_Pax: ... } })
      // The async response from XState will update the store, which updates this item's display
      Alpine.store('basket').updatePax(this.lineId, this.localPaxInput)
      this.editing = false
      this.saving  = false
    },

    clearOverride() {
      Alpine.store('basket').updatePax(this.lineId, null)
      this.editing = false
    },

    remove() { Alpine.store('basket').removeLine(this.lineId) },
  }
}
```

---

## Key Findings from the Experiment

### 1. Re-renders don't reset item state ✅
When the store changes (item added, pax updated), Alpine re-evaluates the `x-for` but does **not**
re-initialize existing `x-data` components. An expanded item stays expanded; a draft pax input
stays in progress. This is the core property that makes the pattern viable.

### 2. Per-item override tracking is natural ✅
Each item knows independently whether it has an override (`Override_Pax !== null`).
When global pax changes, items without overrides auto-update via computed property (no event
needed). Items with overrides receive the event and decide their own reaction — the right place
for the "ask user to reset?" prompt in Phase B.

### 3. No XState actors per item needed ✅
Alpine's `x-data` isolation is sufficient for all item-level UI state. XState stays as the
basket-level orchestrator. The only async concern per item is the `UPDATE_ITEM` event round-trip;
a simple `saving: true/false` flag handles the UX without spawning actors.

### 4. Container stays clean ✅
The parent component no longer tracks `expandedLineId`, `editingLineId`, `savingLineId`, or
draft input values. It owns exactly what it should: the line list and global settings.

---

## Integration with XState (Production)

In the current app, `Alpine.store('basket')` would be replaced by the `AlpineXStateBridge`.
The item component calls `bridge.send()` instead of mutating the store directly:

```javascript
commitPax() {
  this.saving = true
  // Send to XState — bridge.syncToAlpine() will push the updated line back
  window.__bridge.send('UPDATE_ITEM', {
    lineId: this.lineId,
    overrides: { Override_Pax: Number(this.localPaxInput) }
  })
  // saving = false set when bridge syncs (watch for lineId in carrito)
},
```

The `saving` flag clears when the bridge's next `syncToAlpine()` fires and the updated total
appears. This gives correct optimistic UI without any race conditions.

---

## Files

| File | Purpose |
|------|---------|
| `experiment/micro_state_machine.html` | Standalone working prototype (Alpine CDN, no build) |
| `docs/ARCHITECTURE/ui-island-pattern.md` | This document |
| `packages/frontend/Components_Timeline.html` | Current timeline — candidate for refactor |

---

## Migration Path

When `Components_Timeline.html` is refactored:

1. Extract `itemComponent(lineId)` factory into `packages/frontend/Components_ItemComponent.html`
2. Replace the current `x-data="{ expanded: false }"` inline object on each accordion item
   with `x-data="itemComponent(line.lineId)"`
3. Move `actualizarCantidad`, `actualizarHora`, `eliminarItem`, etc. from `Stores_App.html`
   into the item component — they become `commitPax()`, `commitHora()`, `remove()`
4. Remove `carrito.indexOf(item)` index-based addressing — item components address by `lineId`
