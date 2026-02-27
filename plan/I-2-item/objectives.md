# I-2 Item — Objectives

## Goal

Rebase the existing `Item` component so it accepts definitions in the real DB field names (from `resolveItemDefinition()`) instead of hardcoded seed shapes. Verify that pricing, rules, defaults, and category-profile inheritance all work correctly with actual schema data.

---

## What this step produces

| Artifact | Location |
|---|---|
| Updated `Item.fromDefinition()` accepting real DB shape | `packages/components/item/Item.js` |
| New tests using real DB definitions | `packages/components/item/tests/Item.test.js` (new describe block) |
| `STATE_CONTRACT.md` documenting external/internal state | `packages/components/item/STATE_CONTRACT.md` |
| Updated playground with DB item selector | `packages/components/item/ui/ItemStandalone.html` |
| Updated mount function loading from real seed | `packages/components/item/logic/createItemStandaloneComponent.js` |

---

## Completion Criteria

- [ ] `Item.fromDefinition(resolveItemDefinition('ITEM_CENA', db))` creates a valid item
- [ ] `toDisplayObject().id` returns `ID_Item` value (`'ITEM_CENA'`)
- [ ] `toDisplayObject().nombre` returns `Nombre` value (`'Cena de Gala'`)
- [ ] `toDisplayObject().categoria` returns joined `categoria.Nombre` (`'Gastronomía'`)
- [ ] Pricing total computed correctly from real `PERFILES_PRECIO` coefficients:
  - `ITEM_CENA` (per-pax profile): `total = Costo_Unitario_Pax × pax`
  - `ITEM_BAR` (time-based override profile): `total = Costo_Base_Fijo + Costo_Unitario_Tiempo × duracionMin`
- [ ] UI visibility flags derived from real category fields:
  - `showPax` = `categoria.Def_Requiere_Pax`
  - `showDuracion` = `categoria.Def_Requiere_Tiempo`
  - `showHora` = `categoria.Def_Requiere_Hora`
- [ ] Category-profile inheritance: item with `ID_Perfil_Precio_Override: null` uses category's profile
- [ ] Item-level override: item with `ID_Perfil_Precio_Override` uses its own profile
- [ ] All **existing** 462 tests still pass (no regressions)
- [ ] `STATE_CONTRACT.md` written before implementation begins
- [ ] Playground updated: item selector shows real seed items, manual sliders removed for pricing

---

## Testing Criteria

**Automated:**
```bash
npm test
# All tests pass including new DB-grounded Item tests
```

**Human (playground):**
- [ ] Item dropdown populates from seed (ITEM_CENA, ITEM_SONIDO, ITEM_BAR)
- [ ] Selecting an item loads its real profile (no manual price sliders)
- [ ] Profile section shows read-only resolved values (Costo_Unitario_Pax, etc.)
- [ ] paxGlobal / hora / duracionMin are still manually adjustable (true external context)
- [ ] Total recalculates when context changes
- [ ] UI shows/hides pax, quantity, duration controls based on category flags
- [ ] Rules evaluate correctly (set pax below 20 → error appears)

---

## Key constraints

- `fromDefinition()` must normalize DB field names to the internal camelCase shape that the existing domain functions expect. All normalization happens in `fromDefinition()` — not in the domain functions themselves.
- Existing `fromSeed()` or old-style factory methods must remain working (backward compat for existing tests).
- Do not rewrite the domain functions (`pricing.js`, `quantity.js`, `formatting.js`) — only update the entry point.
