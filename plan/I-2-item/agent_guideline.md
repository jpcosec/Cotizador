# I-2 Item — Agent Guideline

## Context

You are rebasing the existing Item component to accept real DB-shaped definitions. The component logic (pricing, quantities, rules, formatting) is already correct — you are only updating the entry point (`fromDefinition()`) and the playground. Do not touch domain functions unless a test forces you to.

Prerequisites: Task I-1 must be complete. `resolveItemDefinition()` and the seed must exist and have passing tests.

Reference: `plan/I-2-item/STATE_CONTRACT.md` (write this first), `plan/III-1-resolver/field_contracts.md` (resolved shape)

Run `npm test` after every step. Do not proceed if tests fail.

---

## Step 1 — Write STATE_CONTRACT.md first

File: `packages/components/item/STATE_CONTRACT.md`

Document:
1. **External state** — the `definition` (from `resolveItemDefinition()`) and `externalContext` (paxGlobal, dia, hora, duracionMin) that come from outside
2. **Internal state** — mode, quantities, userSetFields, overrides
3. **Output shape** — what `toDisplayObject()` returns, including the new `showPax`, `showDuracion`, `showHora` flags

See `plan/I-2-item/minimal_js_pseudo_code.md` for the exact shapes.

Commit: `docs: add Item component state contract`

---

## Step 2 — Write failing tests for DB-grounded Item

File: `packages/components/item/tests/Item.test.js` — add a new `describe` block at the bottom:

```js
describe('Item with real DB definition (I-2 rebase)', () => {
  // Import resolveItemDefinition and seed at the top of the file
  // Create an item from a resolved definition
  // Test: id, nombre, categoria come from correct DB fields
  // Test: total computed from Costo_Unitario_Pax
  // Test: item with override uses its own profile
  // Test: showPax, showDuracion derived from categoria flags
})
```

Run tests. These must fail (fromDefinition doesn't accept DB shape yet).

---

## Step 3 — Update Item.fromDefinition() to normalize DB fields

File: `packages/components/item/Item.js`

`fromDefinition()` receives the shape from `resolveItemDefinition()`. It must normalize to the internal shape:

```
DB field                              → internal field
──────────────────────────────────────────────────────
ID_Item                               → definition.id
Nombre                                → definition.name
Default_Glosa                         → definition.description
categoria.Nombre                      → definition.category
categoria.Icono_UI                    → definition.categoriaIcono
perfil.Costo_Base_Fijo               → profile.baseFijo
perfil.Costo_Unitario_Pax            → profile.porPersona
perfil.Costo_Unitario_Tiempo         → profile.porMinuto
perfil.Costo_Unitario_Item           → profile.porUnidad
categoria.Def_Requiere_Pax           → definition.defaults.requierePax
categoria.Def_Requiere_Cant          → definition.defaults.requiereCant
categoria.Def_Requiere_Tiempo        → definition.defaults.requiereTiempo
categoria.Def_Requiere_Hora          → definition.defaults.requiereHora
categoria.Def_Duracion_Min           → definition.defaults.duracionMin
categoria.Def_Unidades_Por_Pax       → definition.defaults.unidadesPorPax
  (item override wins if Def_Unidades_Por_Pax_Override is not null)
reglas[]                              → definition.rules[] (kept as-is, pre-filtered by resolveItemDefinition)
```

All normalization happens in `fromDefinition()`. The domain functions below it are not changed.

---

## Step 4 — Expose UI flags in toDisplayObject()

In `toDisplayObject()`, add:
```js
showPax:      this.#definition.defaults?.requierePax    ?? false,
showCantidad: this.#definition.defaults?.requiereCant   ?? false,
showDuracion: this.#definition.defaults?.requiereTiempo ?? false,
showHora:     this.#definition.defaults?.requiereHora   ?? false,
```

---

## Step 5 — Run full test suite

```bash
npm test
```

New tests must pass. All 462 existing tests must still pass. If any existing test breaks, you introduced a regression — fix it before proceeding.

Commit: `feat: rebase Item.fromDefinition() to accept real DB field names`

---

## Step 6 — Update the Item playground

Files:
- `packages/components/item/logic/createItemStandaloneComponent.js`
- `packages/components/item/ui/ItemStandalone.html`

Changes:
1. Import `resolveItemDefinition` and the seed exports from `packages/database/src/`
2. In the mount function, pass `resolveItemDefinition(selectedItemId, db)` to `Item.fromDefinition()`
3. In `ItemStandalone.html`:
   - **Add** an item selector dropdown (from seed's `SEED_ITEM_CATALOGO`) to the External State Panel
   - **Remove** the manual pricing profile sliders (baseFijo, porPersona, etc.) — pricing now comes from DB
   - **Add** a read-only "Resolved Profile" section showing the profile that was loaded
   - Keep paxGlobal, hora, duracionMin sliders — those are true external context inputs

See `plan/I-2-item/html_playground_draft.html` for the updated structural wireframe.

Manual test:
```bash
npm run serve:sandbox
# Open http://localhost:8090/step-03-item/
```
Verify checklist in `objectives.md` under "Human (playground)".

Commit: `feat: update Item playground to load from real DB seed`

---

## What NOT to do

- Do not rewrite `pricing.js`, `quantity.js`, or `formatting.js` — they work correctly
- Do not change the XState machine — that is Phase II work
- Do not add new public methods to `Item` that aren't needed for these tests
- Do not change `toSeed()` or `fromSeed()` — they serve existing tests
