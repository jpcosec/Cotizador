---
id: pill-actor-bridge-pattern
type: pattern
scope: global
language: en
nature: context
status: active
depends_on: [pill-modular-composition]
---

## What
The communication contract between modular components and the App Orchestrator.

## Why
Ensures that components remain "dumb" and reusable while allowing the orchestrator to maintain global state authority.

## Pattern
1. **Inputs (Down):** Components receive a reference to the `runtime` or a `snapshot` via their constructor/factory. They must use `toDisplayObject()` to project exactly what the UI needs.
2. **Events (Up):** Components must NOT modify global state directly. They emit semantic events (e.g., `this.emit('ITEM_ADDED', { id })`) or call runtime methods (e.g., `runtime.shipItem(id)`).
3. **Reactivity:** Components use `x-effect` or `runtime.subscribe()` to trigger UI updates when the underlying machine state changes.
