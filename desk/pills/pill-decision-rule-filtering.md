---
id: pill-decision-rule-filtering
type: decision
scope: component
language: en
nature: context
status: active
depends_on: []
---

## What
Business rules (REGLAS_NEGOCIO) are filtered by ID_Item at the coordinator level, not evaluated within the rule condition.

## Why
1. **Performance:** Avoids evaluating thousands of irrelevant rules against every item change.
2. **Reusability:** The same rule condition (e.g., "pax > 10") can be reused across different items or categories without hardcoding IDs in the logic.
3. **Simplicity:** The rule execution engine stays pure and doesn't need to know about the item's identity.

## Where
- `packages/components/item/domain/rulesEngine/coordinator.js`
- `packages/components/item/Item.js` (filtering logic in constructor/factory)

## How
The filtering happens during Item instantiation:
```javascript
const itemRules = allRules.filter(r => r.Scope === 'ITEM' && r.ID_Item === itemId);
```
