---
id: pill-timeline-component-boundary
type: decision
scope: component
language: en
nature: context
status: active
depends_on: [pill-modular-composition]
---

## What
Define the boundary for the Timeline component.

## Why
The timeline is a complex UI unit that should be independent of the main quotation flow.

## Where
- **Template:** `packages/components/quotation/ui/Timeline.html`
- **Logic:** `packages/components/quotation/views/Timeline.js`
- **Machine:** `packages/components/quotation/machine/timelineMachine.js`

## Constraints
1. **Isolation:** The timeline must receive its data (entries) via props/context and emit events (MOVE, RESIZE) without knowing about the global basket state.
2. **Reusability:** It should be mountable in any view that needs a vertical time-based grid.
