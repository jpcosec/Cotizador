# Step 3: Update resolveItemDefinition (5-way join)

## Intro

`resolveItemDefinition()` currently does a 4-way join: ITEM_CATALOGO + CATEGORIAS + PERFILES_PRECIO + REGLAS_NEGOCIO. With the new `PERFILES_INICIALIZACION` table (Step 2), it must become a 5-way join that resolves the init profile using the same override-cascade pattern as pricing profiles.

## Agent Instruction

Update `resolveItemDefinition()` to resolve the init profile. Follow the existing `perfil` resolution pattern: item override wins, falls back to category default. Update the loader in `createItemStandaloneComponent.js` to include the new table. Update tests.

## Objective

`resolveItemDefinition()` returns a `perfilInit` object alongside `perfil`, `categoria`, and `reglas`. The init profile resolution follows the same cascade: `item.ID_Perfil_Init_Override ?? categoria.ID_Perfil_Init_Default`.

## Changes

### 3a. `packages/database/src/resolveItemDefinition.js`

Add after the pricing profile resolution (current step 3):

```javascript
// ── 5. Perfil Init — item override wins, falls back to category default
const perfilInitId = item.ID_Perfil_Init_Override ?? categoria.ID_Perfil_Init_Default;
const perfilInit = perfilInitId
  ? db.perfilesInit.find(r => r.ID_Perfil_Init === perfilInitId)
  : null;
// perfilInit can be null (NONE-kind items may not need one)
```

Update the return object:
- **Remove** top-level `Def_Unidades_Por_Pax_Override` (moved to init profile)
- **Add** `ID_Perfil_Init_Override: item.ID_Perfil_Init_Override ?? null`
- **Update** `categoria` object: remove `Def_Duracion_Min`, `Def_Unidades_Por_Pax`, add `ID_Perfil_Init_Default`
- **Add** `perfilInit` nested object:
```javascript
perfilInit: perfilInit ? {
  ID_Perfil_Init:      perfilInit.ID_Perfil_Init,
  Nombre:              perfilInit.Nombre,
  Duracion_Min:        perfilInit.Duracion_Min ?? 0,
  Unidades_Por_Pax:    perfilInit.Unidades_Por_Pax ?? 0,
  Unidades_Por_Hora:   perfilInit.Unidades_Por_Hora ?? 0,
  Minutos_Por_Usuario: perfilInit.Minutos_Por_Usuario ?? 0,
  Cantidad_Fija:       perfilInit.Cantidad_Fija ?? 0,
  Pax_Fijo:            perfilInit.Pax_Fijo ?? 0,
  Activo:              perfilInit.Activo,
} : null,
```

### 3b. `packages/components/item/logic/createItemStandaloneComponent.js`

Update the `db` object construction (around line 18-23):
```javascript
const db = {
  items:        seedMap.ITEM_CATALOGO,
  categorias:   seedMap.CATEGORIAS,
  perfiles:     seedMap.PERFILES_PRECIO,
  perfilesInit: seedMap.PERFILES_INICIALIZACION ?? [],  // NEW
  reglas:       seedMap.REGLAS_NEGOCIO,
};
```

### 3c. `packages/database/src/resolveItemDefinition.test.js`

Add tests:
- Resolves `perfilInit` from category default FK
- Resolves `perfilInit` from item override FK (override wins)
- `perfilInit` is null when no FK is set
- Output shape has all required fields
- `categoria` no longer has `Def_Duracion_Min` or `Def_Unidades_Por_Pax`
- Top-level no longer has `Def_Unidades_Por_Pax_Override`

Update test fixtures (`seed.js` or inline) to include PERFILES_INICIALIZACION records.

## Key Files

- `packages/database/src/resolveItemDefinition.js` — main change
- `packages/database/src/resolveItemDefinition.test.js` — test updates
- `packages/components/item/logic/createItemStandaloneComponent.js` — loader update
- `packages/database/src/seed.js` — fixture data (if not updated in Step 2)

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components

# Run resolver tests specifically
npx vitest --run packages/database/src/resolveItemDefinition.test.js

# Full test suite (Item tests may still fail until Step 4)
npm test
```
