---
id: A-01-3
name: "[Logic] Refactor Item Orchestrator"
domain: item
status: open
priority: p1
depends_on: [A-01-2]
pills:
  - pill-srp-file-80-lines
  - pill-actor-bridge-pattern
  - pill-decision-rule-filtering
---

## Goal
Thin down `Item.js` into a lightweight orchestrator/factory.

## Context
- Monster: `src/components/item/Item.js`

## Requirements
1. Use `ItemState` and `ItemProjections` via composition.
2. Keep factory methods (`fromDefinition`, `fromSeed`) in `Item.js` or move to `ItemFactory.js` if too large.
3. Delegate all complex calls to the state/projection atoms.
4. Ensure the public interface of `Item` remains identical for backward compatibility.

## Validation
- `Item.js` is < 80 lines.
- All existing `Item.test.js` pass without modification.
