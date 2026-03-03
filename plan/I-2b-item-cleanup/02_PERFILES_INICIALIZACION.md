# Step 2: PERFILES_INICIALIZACION Table

## Intro

The domain layer (`pricing.js`, `quantity.js`) supports 8 initialization paths (PAX/UNITS/TIME × FIXED/CONTEXT_PAX/CONTEXT_TIME), but the DB only has 2 columns for init defaults (`Def_Duracion_Min`, `Def_Unidades_Por_Pax`). The remaining paths (`unidadesPorHora`, `minutosPorUsuario`, fixed pax, fixed cantidad) have no DB backing.

Following the `PERFILES_PRECIO` pattern, we create a reusable initialization profile table.

## Agent Instruction

Create the `PERFILES_INICIALIZACION` table in the schema, generate CSV seed data from existing CATEGORIAS defaults, and update CATEGORIAS + ITEM_CATALOGO to use FK references instead of embedded columns.

## Objective

All 8 initialization paths in `detectInitializationMode()` can be backed by DB data. Init config is separated from UI visibility flags.

## Changes

### 2a. Add table to `packages/database/src/Config_Schema.js`

Insert after `PERFILES_PRECIO`:

```javascript
PERFILES_INICIALIZACION: {
  description: 'Perfil de inicialización de cantidades. Cómo se resuelve la cantidad default según pricing kind.',
  columns: [
    { name: 'ID_Perfil_Init',      type: 'PK',      desc: 'Identificador' },
    { name: 'Nombre',              type: 'TEXT',     desc: 'Nombre legible' },
    { name: 'Duracion_Min',        type: 'INTEGER',  desc: 'Duración default (FIXED_AMOUNT for TIME)' },
    { name: 'Unidades_Por_Pax',    type: 'DECIMAL',  desc: 'Multiplicador und/pax (CONTEXT_PAX for UNITS)' },
    { name: 'Unidades_Por_Hora',   type: 'DECIMAL',  desc: 'Multiplicador und/hora (CONTEXT_TIME for UNITS)' },
    { name: 'Minutos_Por_Usuario', type: 'DECIMAL',  desc: 'Multiplicador min/usuario (CONTEXT_PAX for TIME)' },
    { name: 'Cantidad_Fija',       type: 'DECIMAL',  desc: 'Cantidad fija (FIXED_AMOUNT for UNITS)' },
    { name: 'Pax_Fijo',            type: 'INTEGER',  desc: 'Pax fijo (FIXED_AMOUNT for PAX)' },
    { name: 'Activo',              type: 'BOOLEAN',  desc: 'Vigencia' },
    { name: 'Updated_At',          type: 'DATETIME', desc: 'Última modificación' }
  ]
}
```

Coverage map (every `detectInitializationMode()` path):

| PricingKind | InitMode | Column that triggers it |
|---|---|---|
| PAX | FIXED_AMOUNT | `Pax_Fijo > 0` |
| PAX | CONTEXT_PAX | default (no Pax_Fijo) |
| UNITS | FIXED_AMOUNT | `Cantidad_Fija > 0` |
| UNITS | CONTEXT_PAX | `Unidades_Por_Pax > 0` |
| UNITS | CONTEXT_TIME | `Unidades_Por_Hora > 0` |
| TIME | FIXED_AMOUNT | `Duracion_Min > 0` |
| TIME | CONTEXT_PAX | `Minutos_Por_Usuario > 0` |
| TIME | CONTEXT_TIME | default (event duration) |

### 2b. Update CATEGORIAS in Config_Schema.js

- **Add**: `{ name: 'ID_Perfil_Init_Default', type: 'FK', ref: 'PERFILES_INICIALIZACION', desc: 'Perfil de inicialización por defecto' }`
- **Remove**: `Def_Duracion_Min` column
- **Remove**: `Def_Unidades_Por_Pax` column
- **Keep**: `Def_Requiere_Pax`, `Def_Requiere_Cant`, `Def_Requiere_Tiempo`, `Def_Requiere_Hora` (UI visibility flags)

### 2c. Update ITEM_CATALOGO in Config_Schema.js

- **Add**: `{ name: 'ID_Perfil_Init_Override', type: 'FK', ref: 'PERFILES_INICIALIZACION', desc: 'Override del perfil de inicialización' }`
- **Remove**: `Def_Unidades_Por_Pax_Override` column

### 2d. Create CSV seed: `data/init/PERFILES_INICIALIZACION.csv`

Derive from current CATEGORIAS.csv values. Read the existing CSV first:
- File: `data/init/CATEGORIAS.csv`
- Map each unique (Def_Duracion_Min, Def_Unidades_Por_Pax) combination to a profile

Example profiles to create:
```
PI_SALON_8H        → Duracion_Min=480, rest=0 (for salones)
PI_NONE            → all zeros (for items with no init defaults)
PI_1_PER_PAX       → Unidades_Por_Pax=1 (for teambuilding, lounge)
PI_HALF_PER_PAX    → Unidades_Por_Pax=0.5 (if any cerveza items use 0.5)
PI_THIRD_PER_PAX   → Unidades_Por_Pax=0.33 (if any)
```

### 2e. Update CATEGORIAS.csv and ITEM_CATALOGO.csv

- Add `ID_Perfil_Init_Default` column to CATEGORIAS.csv, populated with the new profile IDs
- Remove `Def_Duracion_Min` and `Def_Unidades_Por_Pax` columns from CATEGORIAS.csv
- Add `ID_Perfil_Init_Override` column to ITEM_CATALOGO.csv
- Remove `Def_Unidades_Por_Pax_Override` column from ITEM_CATALOGO.csv

### 2f. Update `packages/database/src/seed.js`

Update fixture data to match new schema shape. Add `PERFILES_INICIALIZACION` records.

## Key Files

- `packages/database/src/Config_Schema.js` — schema definition
- `data/init/CATEGORIAS.csv` — category seed data
- `data/init/ITEM_CATALOGO.csv` — item seed data
- `data/init/PERFILES_INICIALIZACION.csv` — NEW
- `packages/database/src/seed.js` — test fixtures

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components

# 1. Schema is valid JS
node -e "import('./packages/database/src/Config_Schema.js').then(m => console.log(Object.keys(m.DATA_SCHEMA)))"

# 2. CSV loads without error
node -e "
  import('./packages/database/src/csvSeed.js').then(async m => {
    const seed = await m.loadSeedFromPath('./data/init');
    const tables = seed.map(s => s.table + ': ' + s.records.length);
    console.log(tables.join('\n'));
  })
"

# 3. Tests still pass (some may fail until Steps 3-4 update the consumer code)
npm test
```

Note: Tests that use `seed.js` fixtures may fail after this step until Step 3 updates `resolveItemDefinition` and Step 4 updates `Item.fromDefinition()`.
