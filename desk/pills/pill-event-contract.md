---
id: pill-event-contract
type: pattern
scope: global
language: en
nature: context
status: active
depends_on: [pill-actor-bridge-pattern]
---

## What
Standardized event interface for all components.

## Why
Ensures that the App Orchestrator can listen to any component using a predictable pattern.

## Pattern
1. **Emitter:** Components must extend `UIContainerBase` and use `this.emit(EVENT_NAME, payload)`.
2. **Standard Events:**
   - `UI_MOUNTED`: Emitted when the template is injected.
   - `ACTION_REQUESTED`: When a user clicks a primary action button.
   - `STATE_CHANGED`: When internal component state (non-machine) updates.
3. **Listener:** The Orchestrator uses `component.on(EVENT_NAME, handler)` to respond to these triggers.
