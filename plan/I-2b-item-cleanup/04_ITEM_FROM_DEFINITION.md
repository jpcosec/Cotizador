# Step 4: Update Item.fromDefinition() Mapping

## Intro

`Item.fromDefinition()` (lines 77-110 of `Item.js`) currently builds `defaultQuantities` from scattered sources — some from `categoria`, some from the item record, with an awkward `??` cascade. With `perfilInit` now available from the resolver (Step 3), this mapping becomes clean: all init values from one object.

## Agent Instruction

Update `Item.fromDefinition()` to map `perfilInit` fields to `defaultQuantities`. The domain functions (`detectInitializationMode`, `resolveBasketQuantity`, etc.) require NO changes — they already accept all these field names. Update tests.

## Objective

`Item.fromDefinition()` maps all 6 init values from `perfilInit` and all 4 visibility flags from `categoria`. All 8 initialization paths work end-to-end from DB → resolver → Item → calculation.

## Changes

### 4a. `packages/components/item/Item.js` — `fromDefinition()`

Replace the current `defaultQuantities` construction (lines 91-98):

```javascript
// BEFORE (scattered sources, incomplete):
defaultQuantities: {
  duracionMin:        resolvedDef.categoria?.Def_Duracion_Min ?? 0,
  unidadesPorUsuario: resolvedDef.Def_Unidades_Por_Pax_Override
                   ?? resolvedDef.categoria?.Def_Unidades_Por_Pax ?? 0,
  requierePax:    resolvedDef.categoria?.Def_Requiere_Pax    ?? false,
  requiereCant:   resolvedDef.categoria?.Def_Requiere_Cant   ?? false,
  requiereTiempo: resolvedDef.categoria?.Def_Requiere_Tiempo ?? false,
  requiereHora:   resolvedDef.categoria?.Def_Requiere_Hora   ?? false,
}

// AFTER (clean, single source for init values):
defaultQuantities: {
  // From PERFILES_INICIALIZACION (all init values from one place)
  duracionMin:        resolvedDef.perfilInit?.Duracion_Min        ?? 0,
  unidadesPorUsuario: resolvedDef.perfilInit?.Unidades_Por_Pax    ?? 0,
  unidadesPorHora:    resolvedDef.perfilInit?.Unidades_Por_Hora   ?? 0,
  minutosPorUsuario:  resolvedDef.perfilInit?.Minutos_Por_Usuario ?? 0,
  cantidad:           resolvedDef.perfilInit?.Cantidad_Fija       ?? 0,
  pax:                resolvedDef.perfilInit?.Pax_Fijo            ?? 0,
  // UI visibility flags — still from CATEGORIAS
  requierePax:    resolvedDef.categoria?.Def_Requiere_Pax    ?? false,
  requiereCant:   resolvedDef.categoria?.Def_Requiere_Cant   ?? false,
  requiereTiempo: resolvedDef.categoria?.Def_Requiere_Tiempo ?? false,
  requiereHora:   resolvedDef.categoria?.Def_Requiere_Hora   ?? false,
}
```

Also add `perfilInit` to the definition object for display in resolver panel:
```javascript
const definition = {
  // ... existing fields ...
  perfilInit: resolvedDef.perfilInit ?? null,  // ADD this line
  // ... existing perfil, categoria ...
};
```

### 4b. `packages/components/item/tests/Item.test.js`

Update `fromDefinition()` tests:
- Tests that pass `resolvedDef` must include `perfilInit` object
- Add tests for each init mode path (UNITS + CONTEXT_TIME via `Unidades_Por_Hora`, TIME + CONTEXT_PAX via `Minutos_Por_Usuario`, etc.)
- Verify `toDisplayObject()` includes `perfilInit` in raw objects section

### 4c. Domain functions — NO CHANGES

Verify that `domain/pricing.js` and `domain/quantity.js` already handle:
- `defaults.unidadesPorHora` → used in `resolveContextQuantity()` line 69
- `defaults.minutosPorUsuario` → used in `resolveContextQuantity()` line 65
- `defaults.cantidad` → used in `fixedAmountForKind()` line 141
- `defaults.pax` → used in `fixedAmountForKind()` line 140

These functions were written to support all paths but the DB never provided the data. Now it does.

## Key Files

- `packages/components/item/Item.js` — `fromDefinition()` mapping
- `packages/components/item/tests/Item.test.js` — test updates
- `packages/components/item/domain/pricing.js` — READ ONLY (verify, no changes)
- `packages/components/item/domain/quantity.js` — READ ONLY (verify, no changes)

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components

# Item tests specifically
npx vitest --run packages/components/item/tests/Item.test.js

# All domain tests (should still pass — no domain function changes)
npx vitest --run packages/components/item/tests/pricing.test.js
npx vitest --run packages/components/item/tests/quantity.test.js

# Full suite
npm test
```

Expected: All tests pass. The 3 pre-existing `lineRateLabel` formatting failures are unrelated.
