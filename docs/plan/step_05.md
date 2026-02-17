# Step 05: Stage 3 — Defaults Resolution (Q/T/P)

**What:** When a line is added, resolve the three input dimensions using inheritance chain.

**File:** `src/Pipeline/03_defaults.js`

**Function:** `resolveDefaults(linea, ctx, store)` → mutates linea with `_pax`, `_cantidad`, `_duracionMin`

**Inheritance chains:**
- **P (Pax):** `Override_Pax → ctx.paxGlobal` (only if `Def_Requiere_Pax`)
- **Q (Cantidad):** `Override_Cantidad → (Def_Unidades_Por_Pax_Override || Def_Unidades_Por_Pax) × P` (only if `Def_Requiere_Cant`)
- **T (Duración):** `Override_Duracion_Min → Def_Duracion_Min` (only if `Def_Requiere_Tiempo`)
- Dimensions not required → set to 0

**Test file:** `tests/unit/03_defaults.test.js`
- Salon (Requiere_Tiempo=true): _duracionMin=240, _pax=0, _cantidad=0
- Coffee (Requiere_Pax=true): _pax=80, _cantidad=0
- Cerveza (Requiere_Pax+Cant): _pax=80, _cantidad=40 (0.5 × 80)
- Cerveza with Override_Pax=50: _pax=50, _cantidad=25
- Salon with Override_Duracion=360: _duracionMin=360

**Depends on:** Steps 02, 03.
