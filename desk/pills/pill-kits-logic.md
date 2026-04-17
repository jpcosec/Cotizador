---
id: pill-kits-logic
type: model
scope: domain
language: es
nature: context
status: active
depends_on: []
---

## What
Define how "kits" (packs/groups) are modeled and handled in the quotation system. A kit is a parent item in `ITEM_CATALOGO` that has children defined in `COMPOSICION_KIT`.

## Why
Kits represent commercial bundles that must move together in time/day and often have specific pricing rules (e.g., individual items included in a pack price).

## Where
- `packages/database/src/resolveItemDefinition.js`: To include child items in the resolved definition.
- `packages/components/item/Item.js`: To handle child items if present.
- `packages/components/basket-day/machine/basketDayMachine.js`: To ensure groups are treated as atomic units for some operations.
- `apps/quotation/state/createQuotationInternalRuntime.js`: To support adding/moving groups.

## How (Constraints & Logic)
1. **Recursion:** The `COMPOSICION_KIT` table allows recursion, but the MVP should support at least 1-level depth (Parent -> Children).
2. **Pricing (Tipo_Precio):**
   - `ABSORBIDO`: The child's cost is $0 for the quotation (included in parent).
   - `SUMAR`: The child's cost is added to the parent's cost.
3. **Atomicity:**
   - If a Parent is moved in time, all Children must follow.
   - If a Parent is removed, all Children must be removed.
   - Children *can* have their own overrides if the UI allows, but they are bound to the parent's lifecycle.
4. **Identification:**
   - `groupId` or `kitId` should link items in the basket that belong to the same kit instance.
   - A `parentId` field in the basket entry identifies the root of the group.
5. **Quantity Propagation:** Usually, `Parent.cantidad * Child.cantidad_en_composicion = Child.resolved_cantidad`.
