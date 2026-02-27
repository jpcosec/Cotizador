# Codebase Reorder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the SF Lodge quotation system component by component, each one grounded in the real database schema and human-testable in isolation, culminating in a complete quotation app assembled from verified pieces.

**Architecture:** Two phases — Phase I builds data-grounded domain components (database → item → category), Phase II composes them into UI and the full app. Every step produces domain logic + tests + an interactive playground before the next step begins. Preceded by a structural cleanup that removes legacy wrapper files and clarifies the apps/ vs packages/ boundary.

**Tech Stack:** Alpine.js v3.14, XState v5.28, json-logic-js, vitest (tests), Node.js serve-sandbox.mjs (dev server). No build step — native ES modules via import maps.

**Test commands:**
- Run all tests: `cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components && npm test`
- Run single file: `npx vitest run packages/components/item/tests/Item.test.js`
- Dev server: `npm run serve:sandbox` → http://localhost:8090

---

## Part 0: Structural Cleanup

> **Goal:** `packages/` contains only individually verified components. `apps/` contains sandbox routes + the quotation flow reference draft. No thin wrappers anywhere.

---

### Task 1: Delete the three thin wrapper JS files in apps/quotation

**Files:**
- Delete: `apps/quotation/state/AppStateMachine.js`
- Delete: `apps/quotation/components/HomePage.js`
- Delete: `apps/quotation/components/ClientSelector.js`

**Step 1: Delete the files**

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
rm apps/quotation/state/AppStateMachine.js
rm apps/quotation/components/HomePage.js
rm apps/quotation/components/ClientSelector.js
```

**Step 2: Verify deletion**

```bash
ls apps/quotation/state/ apps/quotation/components/
```
Expected: only test files and HTML files remain (no JS wrappers).

**Step 3: Commit**

```bash
git add -u
git commit -m "refactor: delete thin wrapper files in apps/quotation"
```

---

### Task 2: Redirect the three test files to import from packages directly

**Files:**
- Modify: `apps/quotation/state/appStateMachine.test.js`
- Modify: `apps/quotation/components/home.test.js`
- Modify: `apps/quotation/components/clientSelector.test.js`

**Step 1: Update AppStateMachine test import**

In `apps/quotation/state/appStateMachine.test.js`, change:
```js
// FROM:
import { createAppStateMachine } from './AppStateMachine.js';

// TO:
import { createAppState as createAppStateMachine } from '../../../packages/components/quotation/modals/AppState.js';
```

**Step 2: Update HomePage test import**

In `apps/quotation/components/home.test.js`, change:
```js
// FROM:
import { createHomePageController } from './HomePage.js';

// TO:
import { createHomePage as createHomePageController } from '../../../packages/components/quotation/modals/HomePage.js';
```

> Note: `createHomePage()` returns a `HomePage` instance. The test calls `getActions()`, `clickAction()`, `on()`, `off()` — all present on the class. The `isVisible()` wrapper behavior (always returning true) was a no-op since `HomePage.isVisible()` already returns true.

**Step 3: Update ClientSelector test import**

In `apps/quotation/components/clientSelector.test.js`, change:
```js
// FROM:
import { createClientSelectorController } from './ClientSelector.js';

// TO:
import { createClientSelector as createClientSelectorController } from '../../../packages/components/quotation/modals/ClientSelector.js';
```

> Note: The wrapper added client field normalization (`ID_Cliente → id`, `Nombre_Empresa → nombre`) and a `getAllClients()` method. The test uses pre-normalized objects (`{ id, nombre }`) so the normalization is not tested — all tests will pass against the package directly. The `getAllClients()` test must be removed or updated since it's not on `ClientSelector`.

**Step 4: Remove the getAllClients test** (it tests wrapper-only logic)

In `apps/quotation/components/clientSelector.test.js`, delete the test:
```js
// DELETE this entire block:
it('should get all original clients', () => {
  ...
});
```

**Step 5: Run the tests**

```bash
npm test 2>&1 | tail -20
```
Expected: all tests pass, count unchanged from before (minus 1 deleted test).

**Step 6: Commit**

```bash
git add apps/quotation/state/appStateMachine.test.js \
        apps/quotation/components/home.test.js \
        apps/quotation/components/clientSelector.test.js
git commit -m "refactor: redirect app wrapper tests to import from packages directly"
```

---

### Task 3: Promote the rich ClientSelector.html from apps to packages

The `apps/quotation/components/ClientSelector.html` is a rich, production-quality Alpine template (full modal with keyboard nav, two-column layout, client creation form). The `packages/components/quotation/modals/ClientSelector.html` is a 10-line stub. Swap them.

**Files:**
- Modify: `packages/components/quotation/modals/ClientSelector.html` (replace stub with rich template)
- Delete: `apps/quotation/components/ClientSelector.html`

**Step 1: Copy the rich template into packages**

```bash
cp apps/quotation/components/ClientSelector.html \
   packages/components/quotation/modals/ClientSelector.html
```

**Step 2: Delete the apps copy**

```bash
rm apps/quotation/components/ClientSelector.html
```

**Step 3: Verify no other file imports or references the apps HTML path**

```bash
grep -r "apps/quotation/components/ClientSelector.html" .
```
Expected: no results.

**Step 4: Commit**

```bash
git add packages/components/quotation/modals/ClientSelector.html
git add -u apps/quotation/components/ClientSelector.html
git commit -m "refactor: promote rich ClientSelector.html from apps to packages"
```

---

### Task 4: Move packages/components/quotation → apps/quotation

The entire quotation flow (modals, views, logic, AppState) is app-level assembly code, not a standalone reusable component. Move it to apps where it belongs until its constituent components are individually verified.

**Files:**
- Move: `packages/components/quotation/` → `apps/quotation/pkg/`
- Update: any imports that reference `packages/components/quotation/` from apps files

**Step 1: Move the directory**

```bash
mkdir -p apps/quotation/pkg
cp -r packages/components/quotation/. apps/quotation/pkg/
rm -rf packages/components/quotation
```

**Step 2: Find all imports referencing the old path**

```bash
grep -r "packages/components/quotation" apps/ --include="*.js" --include="*.html" -l
```

**Step 3: Update each import path**

For each file found, update:
```
FROM: ../../../packages/components/quotation/
TO:   ../pkg/               (adjust depth based on file location)
```

Also check sandbox routes:
```bash
grep -r "packages/components/quotation" apps/sandbox/ --include="*.html" -l
```

**Step 4: Run the tests**

```bash
npm test 2>&1 | tail -20
```
Expected: all tests pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move premature quotation flow from packages to apps/quotation/pkg"
```

---

## Phase I — Basics (Data-Grounded)

> **Rule:** No component is built until its internal/external state contract is written and agreed. No step begins until the previous step's tests pass.

---

### Task 5: Database — audit the real schema and document field contracts

**Goal:** Produce a written field-contract document that every subsequent component references. No code changes yet.

**Files:**
- Read: `packages/database/src/Config_Schema.js`
- Read: `packages/database/src/seed.js` (the fixture data if present)
- Create: `docs/plans/database-field-contracts.md`

**Step 1: Read Config_Schema.js in full and identify Phase I tables**

The four tables needed for Phase I components:

| Table | Purpose |
|---|---|
| `ITEM_CATALOGO` | Item definitions (ID_Item, Nombre, ID_Categoria, ID_Perfil_Precio_Override, Def_Unidades_Por_Pax_Override, Default_Glosa, Activo) |
| `CATEGORIAS` | Category definitions with pricing dimension flags and defaults (ID_Categoria, Nombre, ID_Perfil_Precio_Default, Def_Requiere_Pax/Cant/Tiempo/Hora, Def_Duracion_Min, Def_Unidades_Por_Pax) |
| `PERFILES_PRECIO` | Pricing profiles (ID_Perfil_Precio, Nombre, Costo_Base_Fijo, Costo_Unitario_Pax, Costo_Unitario_Tiempo, Costo_Unitario_Item) |
| `REGLAS_NEGOCIO` | Business rules (ID_Regla, Nombre, Etapa, Scope, Tipo_Accion, Condicion_JSON, Payload_JSON, Prioridad, Activo) |

**Step 2: Write the field contracts document**

Create `docs/plans/database-field-contracts.md` with:

```markdown
# Database Field Contracts

## What an Item receives from the DB

A fully-resolved item definition (after DB joins) looks like:

```js
{
  // From ITEM_CATALOGO
  ID_Item: 'ITEM_001',
  Nombre: 'Cena de Gala',
  Activo: true,
  Default_Glosa: 'Menú de tres tiempos...',

  // From CATEGORIAS (joined via ID_Categoria)
  categoria: {
    ID_Categoria: 'CAT_GASTRONOMIA',
    Nombre: 'Gastronomía',
    Def_Requiere_Pax: true,
    Def_Requiere_Cant: false,
    Def_Requiere_Tiempo: false,
    Def_Requiere_Hora: false,
    Def_Duracion_Min: 0,
    Def_Unidades_Por_Pax: 1,
    Icono_UI: 'utensils'
  },

  // From PERFILES_PRECIO (item override, or category default if null)
  perfil: {
    ID_Perfil_Precio: 'PERF_GALA',
    Nombre: 'Cena Gala',
    Costo_Base_Fijo: 0,
    Costo_Unitario_Pax: 85000,
    Costo_Unitario_Tiempo: 0,
    Costo_Unitario_Item: 0
  },

  // From REGLAS_NEGOCIO (filtered by Scope = 'ITEM' and ID_Item match)
  reglas: [
    {
      ID_Regla: 'REGLA_001',
      Nombre: 'Mínimo 50 pax',
      Etapa: 'RESTRICCION_UI',
      Scope: 'ITEM',
      Tipo_Accion: 'ERROR',
      Condicion_JSON: { "<": [{ "var": "pax" }, 50] },
      Payload_JSON: { message: 'Se requieren al menos 50 personas' },
      Prioridad: 1,
      Activo: true
    }
  ]
}
```

## Current Item.js assumptions vs real field names

| Item.js uses | Real DB field | Location |
|---|---|---|
| `definition.name` | `Nombre` | ITEM_CATALOGO |
| `definition.category` | `categoria.Nombre` | CATEGORIAS (joined) |
| `profile.baseFijo` | `perfil.Costo_Base_Fijo` | PERFILES_PRECIO |
| `profile.porPersona` | `perfil.Costo_Unitario_Pax` | PERFILES_PRECIO |
| `profile.porUnidad` | `perfil.Costo_Unitario_Item` | PERFILES_PRECIO |
| `profile.porMinuto` | `perfil.Costo_Unitario_Tiempo` | PERFILES_PRECIO |
| `externalContext.unidadesPorUsuario` | `categoria.Def_Unidades_Por_Pax` (or item override) | CATEGORIAS / ITEM_CATALOGO |
| `externalContext.unidadesPorHora` | (derived from Def_Requiere_Tiempo) | CATEGORIAS |
| `definition.rules[]` | `reglas[]` with full REGLAS_NEGOCIO shape | REGLAS_NEGOCIO |
```

**Step 3: Commit**

```bash
git add docs/plans/database-field-contracts.md
git commit -m "docs: add database field contracts for Phase I components"
```

---

### Task 6: Database — write seed fixtures with real schema field names

**Files:**
- Modify: `packages/database/src/seed.js`

The seed file must use real DB field names so every component test can load realistic data without mocking.

**Step 1: Read the existing seed.js**

```bash
cat packages/database/src/seed.js
```

**Step 2: Rewrite seed with real field names**

The seed must include at minimum:
- 2 pricing profiles (one per-pax, one time-based)
- 2 categories (one requiring pax, one requiring time)
- 3 items (2 normal, 1 with profile override)
- 2 rules (1 ERROR, 1 WARNING, both Scope=ITEM)

The key shape (field names must match Config_Schema exactly):

```js
export const SEED_PERFILES_PRECIO = [
  {
    ID_Perfil_Precio: 'PERF_PAX',
    Nombre: 'Por Persona',
    Costo_Base_Fijo: 0,
    Costo_Unitario_Pax: 50000,
    Costo_Unitario_Tiempo: 0,
    Costo_Unitario_Item: 0,
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  },
  {
    ID_Perfil_Precio: 'PERF_TIEMPO',
    Nombre: 'Por Hora',
    Costo_Base_Fijo: 200000,
    Costo_Unitario_Pax: 0,
    Costo_Unitario_Tiempo: 5000,
    Costo_Unitario_Item: 0,
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  }
];

export const SEED_CATEGORIAS = [
  {
    ID_Categoria: 'CAT_GASTRO',
    Nombre: 'Gastronomía',
    ID_Perfil_Precio_Default: 'PERF_PAX',
    Def_Requiere_Pax: true,
    Def_Requiere_Cant: false,
    Def_Requiere_Tiempo: false,
    Def_Requiere_Hora: false,
    Def_Duracion_Min: 0,
    Def_Unidades_Por_Pax: 1,
    Icono_UI: 'utensils',
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  },
  {
    ID_Categoria: 'CAT_AUDIO',
    Nombre: 'Audio/Video',
    ID_Perfil_Precio_Default: 'PERF_TIEMPO',
    Def_Requiere_Pax: false,
    Def_Requiere_Cant: false,
    Def_Requiere_Tiempo: true,
    Def_Requiere_Hora: true,
    Def_Duracion_Min: 120,
    Def_Unidades_Por_Pax: 0,
    Icono_UI: 'music',
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  }
];

export const SEED_ITEM_CATALOGO = [
  {
    ID_Item: 'ITEM_CENA',
    Nombre: 'Cena de Gala',
    ID_Categoria: 'CAT_GASTRO',
    ID_Perfil_Precio_Override: null,   // inherits from category
    Def_Unidades_Por_Pax_Override: null,
    Default_Glosa: 'Menú de tres tiempos',
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  },
  {
    ID_Item: 'ITEM_SONIDO',
    Nombre: 'Sistema de Sonido',
    ID_Categoria: 'CAT_AUDIO',
    ID_Perfil_Precio_Override: null,
    Def_Unidades_Por_Pax_Override: null,
    Default_Glosa: 'Equipo de sonido profesional',
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  },
  {
    ID_Item: 'ITEM_BAR',
    Nombre: 'Servicio de Bar',
    ID_Categoria: 'CAT_GASTRO',
    ID_Perfil_Precio_Override: 'PERF_TIEMPO', // overrides category profile
    Def_Unidades_Por_Pax_Override: null,
    Default_Glosa: 'Bar abierto completo',
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  }
];

export const SEED_REGLAS_NEGOCIO = [
  {
    ID_Regla: 'REGLA_MIN_PAX',
    Nombre: 'Mínimo 20 personas',
    Etapa: 'RESTRICCION_UI',
    Scope: 'ITEM',
    Tipo_Accion: 'ERROR',
    Hook: null,
    Condicion_JSON: { '<': [{ var: 'pax' }, 20] },
    Payload_JSON: { message: 'Se requieren al menos 20 personas' },
    Prioridad: 1,
    Acumulable: false,
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  },
  {
    ID_Regla: 'REGLA_MAX_PAX',
    Nombre: 'Máximo 200 personas (advertencia)',
    Etapa: 'RESTRICCION_UI',
    Scope: 'ITEM',
    Tipo_Accion: 'WARNING',
    Hook: null,
    Condicion_JSON: { '>': [{ var: 'pax' }, 200] },
    Payload_JSON: { message: 'Más de 200 personas requiere aprobación especial' },
    Prioridad: 2,
    Acumulable: false,
    Activo: true,
    Updated_At: '2026-01-01T00:00:00Z'
  }
];
```

**Step 3: Write a test that verifies seed data matches schema column names**

Create `packages/database/src/seed.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  SEED_PERFILES_PRECIO,
  SEED_CATEGORIAS,
  SEED_ITEM_CATALOGO,
  SEED_REGLAS_NEGOCIO
} from './seed.js';

describe('Seed data matches real schema field names', () => {
  it('PERFILES_PRECIO rows have correct field names', () => {
    const row = SEED_PERFILES_PRECIO[0];
    expect(row).toHaveProperty('ID_Perfil_Precio');
    expect(row).toHaveProperty('Costo_Base_Fijo');
    expect(row).toHaveProperty('Costo_Unitario_Pax');
    expect(row).toHaveProperty('Costo_Unitario_Tiempo');
    expect(row).toHaveProperty('Costo_Unitario_Item');
  });

  it('CATEGORIAS rows have correct field names', () => {
    const row = SEED_CATEGORIAS[0];
    expect(row).toHaveProperty('ID_Categoria');
    expect(row).toHaveProperty('ID_Perfil_Precio_Default');
    expect(row).toHaveProperty('Def_Requiere_Pax');
    expect(row).toHaveProperty('Def_Unidades_Por_Pax');
    expect(row).toHaveProperty('Def_Duracion_Min');
  });

  it('ITEM_CATALOGO rows have correct field names', () => {
    const row = SEED_ITEM_CATALOGO[0];
    expect(row).toHaveProperty('ID_Item');
    expect(row).toHaveProperty('ID_Categoria');
    expect(row).toHaveProperty('ID_Perfil_Precio_Override');
    expect(row).toHaveProperty('Def_Unidades_Por_Pax_Override');
  });

  it('REGLAS_NEGOCIO rows have correct field names', () => {
    const row = SEED_REGLAS_NEGOCIO[0];
    expect(row).toHaveProperty('ID_Regla');
    expect(row).toHaveProperty('Etapa');
    expect(row).toHaveProperty('Scope');
    expect(row).toHaveProperty('Tipo_Accion');
    expect(row).toHaveProperty('Condicion_JSON');
    expect(row).toHaveProperty('Payload_JSON');
  });

  it('ITEM_CATALOGO foreign key references exist in PERFILES_PRECIO', () => {
    const profileIds = SEED_PERFILES_PRECIO.map(p => p.ID_Perfil_Precio);
    const categoryProfileIds = SEED_CATEGORIAS
      .map(c => c.ID_Perfil_Precio_Default)
      .filter(Boolean);
    categoryProfileIds.forEach(id => {
      expect(profileIds).toContain(id);
    });
  });
});
```

**Step 4: Run tests to verify they pass**

```bash
npm test 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add packages/database/src/seed.js packages/database/src/seed.test.js
git commit -m "feat: rewrite seed fixtures with real schema field names and add schema tests"
```

---

### Task 7: Database — write a resolveItemDefinition() helper

**Goal:** A pure function that takes raw DB rows and returns the fully-resolved item definition shape that Item.js will receive. This is the adapter layer between DB and component.

**Files:**
- Create: `packages/database/src/resolveItemDefinition.js`
- Create: `packages/database/src/resolveItemDefinition.test.js`

**Step 1: Write the failing tests first**

```js
// packages/database/src/resolveItemDefinition.test.js
import { describe, it, expect } from 'vitest';
import { resolveItemDefinition } from './resolveItemDefinition.js';
import {
  SEED_ITEM_CATALOGO,
  SEED_CATEGORIAS,
  SEED_PERFILES_PRECIO,
  SEED_REGLAS_NEGOCIO
} from './seed.js';

const db = {
  items: SEED_ITEM_CATALOGO,
  categorias: SEED_CATEGORIAS,
  perfiles: SEED_PERFILES_PRECIO,
  reglas: SEED_REGLAS_NEGOCIO
};

describe('resolveItemDefinition', () => {
  it('resolves item with category profile (no override)', () => {
    const result = resolveItemDefinition('ITEM_CENA', db);
    expect(result.ID_Item).toBe('ITEM_CENA');
    expect(result.Nombre).toBe('Cena de Gala');
    expect(result.categoria.Nombre).toBe('Gastronomía');
    expect(result.perfil.ID_Perfil_Precio).toBe('PERF_PAX'); // from category
    expect(result.perfil.Costo_Unitario_Pax).toBe(50000);
  });

  it('resolves item with profile override', () => {
    const result = resolveItemDefinition('ITEM_BAR', db);
    expect(result.perfil.ID_Perfil_Precio).toBe('PERF_TIEMPO'); // override wins
    expect(result.perfil.Costo_Unitario_Tiempo).toBe(5000);
  });

  it('inherits category defaults for quantities', () => {
    const result = resolveItemDefinition('ITEM_CENA', db);
    expect(result.categoria.Def_Requiere_Pax).toBe(true);
    expect(result.categoria.Def_Unidades_Por_Pax).toBe(1);
  });

  it('includes reglas filtered to the item scope', () => {
    const result = resolveItemDefinition('ITEM_CENA', db);
    // All seed rules are Scope=ITEM, not ID_Item-specific — included for all items
    expect(Array.isArray(result.reglas)).toBe(true);
  });

  it('throws if item not found', () => {
    expect(() => resolveItemDefinition('ITEM_UNKNOWN', db)).toThrow();
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npx vitest run packages/database/src/resolveItemDefinition.test.js
```
Expected: FAIL — module not found.

**Step 3: Implement resolveItemDefinition.js**

```js
// packages/database/src/resolveItemDefinition.js

export function resolveItemDefinition(itemId, { items, categorias, perfiles, reglas }) {
  const item = items.find(i => i.ID_Item === itemId);
  if (!item) throw new Error(`Item not found: ${itemId}`);

  const categoria = categorias.find(c => c.ID_Categoria === item.ID_Categoria);
  if (!categoria) throw new Error(`Category not found: ${item.ID_Categoria}`);

  const perfilId = item.ID_Perfil_Precio_Override ?? categoria.ID_Perfil_Precio_Default;
  const perfil = perfiles.find(p => p.ID_Perfil_Precio === perfilId);
  if (!perfil) throw new Error(`Pricing profile not found: ${perfilId}`);

  const itemReglas = reglas.filter(r =>
    r.Activo &&
    r.Scope === 'ITEM' &&
    r.Etapa === 'RESTRICCION_UI'
  );

  return { ...item, categoria, perfil, reglas: itemReglas };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run packages/database/src/resolveItemDefinition.test.js
```
Expected: all pass.

**Step 5: Run full test suite**

```bash
npm test 2>&1 | tail -5
```
Expected: no regressions.

**Step 6: Commit**

```bash
git add packages/database/src/resolveItemDefinition.js \
        packages/database/src/resolveItemDefinition.test.js
git commit -m "feat: add resolveItemDefinition() adapter with tests"
```

---

### Task 8: Item rebase — define internal/external state contract

**Goal:** Write the state contract for the rebased Item component before touching any code.

**Files:**
- Create: `packages/components/item/STATE_CONTRACT.md`

**Step 1: Write the contract**

```markdown
# Item Component — State Contract

## External State (what flows in from outside)

Provided by a parent container (Category, Basket) or the playground's manual controls:

```js
externalContext: {
  paxGlobal: 100,         // Integer — event headcount
  dia: 1,                  // Integer — day number (1..N)
  hora: '09:00',           // 'HH:MM' string
  duracionMin: 120         // Integer — event duration in minutes
}
```

The item definition is also external — it comes from `resolveItemDefinition()`:
```js
definition: {
  ID_Item, Nombre, Default_Glosa, Activo,
  categoria: { ID_Categoria, Nombre, Def_Requiere_Pax, Def_Requiere_Cant,
               Def_Requiere_Tiempo, Def_Requiere_Hora, Def_Duracion_Min,
               Def_Unidades_Por_Pax },
  perfil: { ID_Perfil_Precio, Nombre, Costo_Base_Fijo, Costo_Unitario_Pax,
            Costo_Unitario_Tiempo, Costo_Unitario_Item },
  reglas: [ { ID_Regla, Nombre, Tipo_Accion, Condicion_JSON, Payload_JSON } ]
}
```

## Internal State (what the component owns)

```js
mode: 'catalog' | 'basket'

quantities: {
  pax: Number,        // resolved: user override OR externalContext.paxGlobal
  cantidad: Number,   // resolved: user override OR derived from Def_Unidades_Por_Pax
  duracionMin: Number // resolved: user override OR categoria.Def_Duracion_Min
}

userSetFields: Set<'pax' | 'cantidad' | 'duracionMin'>  // tracks manual overrides

overrides: {
  comentarios: String  // user's free-text comment
}
```

## What the component produces (toDisplayObject)

```js
{
  // Identity
  id: 'ITEM_CENA',
  nombre: 'Cena de Gala',
  categoria: 'Gastronomía',
  mode: 'catalog' | 'basket',

  // Quantities
  quantities: { pax, cantidad, duracionMin },
  isUserSetPax: Boolean,
  isUserSetCantidad: Boolean,
  isUserSetDuracion: Boolean,

  // Pricing
  total: Number,                    // computed from perfil + quantities
  catalogFormulaHuman: String,      // '$50.000 por persona'
  basketPriceBreakdown: Object,     // { base, pax, cantidad, tiempo, total }

  // Rules
  appliedRules: Array,
  ruleErrors: Array,
  ruleWarnings: Array,
  available: Boolean,

  // UI flags (derived from categoria)
  showPax: Boolean,         // Def_Requiere_Pax
  showCantidad: Boolean,    // Def_Requiere_Cant
  showDuracion: Boolean,    // Def_Requiere_Tiempo
  showHora: Boolean         // Def_Requiere_Hora
}
```
```

**Step 2: Commit**

```bash
git add packages/components/item/STATE_CONTRACT.md
git commit -m "docs: add Item component state contract with real DB field names"
```

---

### Task 9: Item rebase — update Item.js to use real DB field names

**Goal:** Align Item.js to accept a definition in the real DB shape (from `resolveItemDefinition()`) instead of the old hardcoded seed shape.

**Files:**
- Modify: `packages/components/item/Item.js`
- Modify: `packages/components/item/domain/pricing.js`
- Modify: `packages/components/item/domain/quantity.js`
- Modify: `packages/components/item/domain/formatting.js`

**Step 1: Identify all places that read definition fields**

```bash
grep -n "definition\." packages/components/item/Item.js | head -40
grep -n "\.baseFijo\|\.porPersona\|\.porUnidad\|\.porMinuto" packages/components/item/domain/pricing.js
```

**Step 2: Write failing tests using real DB field names**

In `packages/components/item/tests/Item.test.js`, add a new describe block:

```js
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';
import {
  SEED_ITEM_CATALOGO, SEED_CATEGORIAS,
  SEED_PERFILES_PRECIO, SEED_REGLAS_NEGOCIO
} from '../../../database/src/seed.js';

const db = {
  items: SEED_ITEM_CATALOGO,
  categorias: SEED_CATEGORIAS,
  perfiles: SEED_PERFILES_PRECIO,
  reglas: SEED_REGLAS_NEGOCIO
};

describe('Item with real DB definition', () => {
  it('creates item from resolved DB definition', () => {
    const def = resolveItemDefinition('ITEM_CENA', db);
    const item = Item.fromDefinition(def);
    expect(item.toDisplayObject().id).toBe('ITEM_CENA');
    expect(item.toDisplayObject().nombre).toBe('Cena de Gala');
    expect(item.toDisplayObject().categoria).toBe('Gastronomía');
  });

  it('computes total using Costo_Unitario_Pax', () => {
    const def = resolveItemDefinition('ITEM_CENA', db);
    const item = Item.fromDefinition(def);
    item.receiveContext({ paxGlobal: 50, dia: 1, hora: '09:00', duracionMin: 0 });
    item.calculate();
    // PERF_PAX: Costo_Base_Fijo=0 + Costo_Unitario_Pax=50000 * pax=50
    expect(item.toDisplayObject().total).toBe(2500000);
  });

  it('shows correct UI flags from category', () => {
    const def = resolveItemDefinition('ITEM_CENA', db);
    const item = Item.fromDefinition(def);
    const display = item.toDisplayObject();
    expect(display.showPax).toBe(true);     // Def_Requiere_Pax = true
    expect(display.showDuracion).toBe(false); // Def_Requiere_Tiempo = false
  });
});
```

**Step 3: Run to confirm failure**

```bash
npx vitest run packages/components/item/tests/Item.test.js 2>&1 | tail -20
```

**Step 4: Update Item.fromDefinition() to accept real DB shape**

The key changes in `Item.js`:

```js
// Item.fromDefinition() must accept a resolved DB definition and normalize:
static fromDefinition(def) {
  // Map DB fields to internal representation
  const normalized = {
    id: def.ID_Item,
    name: def.Nombre,
    category: def.categoria?.Nombre,
    description: def.Default_Glosa,
    // Pricing profile — map DB field names to internal camelCase
    pricing: {
      baseFijo: def.perfil?.Costo_Base_Fijo ?? 0,
      porPersona: def.perfil?.Costo_Unitario_Pax ?? 0,
      porMinuto: def.perfil?.Costo_Unitario_Tiempo ?? 0,
      porUnidad: def.perfil?.Costo_Unitario_Item ?? 0
    },
    // Default quantities — from category (or item override)
    defaults: {
      requierePax: def.categoria?.Def_Requiere_Pax ?? false,
      requiereCant: def.categoria?.Def_Requiere_Cant ?? false,
      requiereTiempo: def.categoria?.Def_Requiere_Tiempo ?? false,
      requiereHora: def.categoria?.Def_Requiere_Hora ?? false,
      duracionMin: def.categoria?.Def_Duracion_Min ?? 0,
      unidadesPorPax: def.Def_Unidades_Por_Pax_Override
                   ?? def.categoria?.Def_Unidades_Por_Pax
                   ?? 0
    },
    rules: (def.reglas ?? []).map(r => ({
      ID_Regla: r.ID_Regla,
      Nombre: r.Nombre,
      Tipo_Accion: r.Tipo_Accion,
      Condicion_JSON: r.Condicion_JSON,
      Payload_JSON: r.Payload_JSON,
      Prioridad: r.Prioridad,
      Activo: r.Activo
    }))
  };
  return new Item(normalized);
}
```

Also update `toDisplayObject()` to expose UI visibility flags from the definition:
```js
showPax: this.#definition.defaults?.requierePax ?? false,
showCantidad: this.#definition.defaults?.requiereCant ?? false,
showDuracion: this.#definition.defaults?.requiereTiempo ?? false,
showHora: this.#definition.defaults?.requiereHora ?? false,
```

**Step 5: Run tests — new tests must pass, existing tests must not regress**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass. If existing tests fail, the `fromDefinition()` normalization is not backward-compatible — add a `fromSeed()` alias that accepts the old shape.

**Step 6: Commit**

```bash
git add packages/components/item/Item.js \
        packages/components/item/tests/Item.test.js
git commit -m "feat: rebase Item.fromDefinition() to accept real DB field names"
```

---

### Task 10: Item rebase — update ItemStandalone playground

**Goal:** The playground's External State Panel must let the user select a real item from the seed DB instead of editing hardcoded profile sliders.

**Files:**
- Modify: `packages/components/item/logic/createItemStandaloneComponent.js`
- Modify: `packages/components/item/ui/ItemStandalone.html`

**Step 1: Update the playground mount function to load from seed DB**

In `createItemStandaloneComponent.js`:

```js
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';
import {
  SEED_ITEM_CATALOGO, SEED_CATEGORIAS,
  SEED_PERFILES_PRECIO, SEED_REGLAS_NEGOCIO
} from '../../../database/src/seed.js';

const db = {
  items: SEED_ITEM_CATALOGO,
  categorias: SEED_CATEGORIAS,
  perfiles: SEED_PERFILES_PRECIO,
  reglas: SEED_REGLAS_NEGOCIO
};
```

**Step 2: Update ItemStandalone.html External State Panel**

Replace the manual pricing profile sliders with:
1. A dropdown to select an item from `SEED_ITEM_CATALOGO`
2. The existing paxGlobal / hora / duracionMin sliders remain (these are true external context)
3. Remove the manual baseFijo/porPersona/porUnidad/porMinuto inputs (those come from DB now)

The pricing profile section becomes a **read-only display** showing which profile resolved and its values.

**Step 3: Manual test in browser**

```bash
npm run serve:sandbox
# Open: http://localhost:8090/step-03-item/
```

Verify:
- [ ] Item dropdown shows all seed items
- [ ] Selecting an item loads its real profile
- [ ] paxGlobal / hora / duracionMin still adjustable
- [ ] Total recalculates correctly
- [ ] Category name shows correctly
- [ ] UI flags (showPax, showDuracion) match category

**Step 4: Commit**

```bash
git add packages/components/item/logic/createItemStandaloneComponent.js \
        packages/components/item/ui/ItemStandalone.html
git commit -m "feat: update Item playground to select from real DB seed instead of manual sliders"
```

---

### Task 11: Category component — write state contract

**Files:**
- Create: `packages/components/item/STATE_CONTRACT.md` (parallel to Item's)
- Actually: `packages/components/category/STATE_CONTRACT.md`

**Step 1: Create the directory and contract**

```bash
mkdir -p packages/components/category
```

```markdown
# Category Component — State Contract

## External State (what flows in from outside)

From the Basket/Day parent:

```js
externalContext: {
  paxGlobal: 100,     // event headcount, propagated to all child items
  dia: 1,             // day number
  hora: '09:00'       // day start time (used as default for items without hora)
}

definition: {
  // From resolveItemDefinition-equivalent for categories
  ID_Categoria: 'CAT_GASTRO',
  Nombre: 'Gastronomía',
  Icono_UI: 'utensils',
  Def_Requiere_Hora: false
  // ... other category fields
}
```

## Internal State (what the component owns)

```js
items: Item[]           // child item instances
mode: 'collapsed' | 'expanded'
```

## What the component produces (toDisplayObject)

```js
{
  id: 'CAT_GASTRO',
  nombre: 'Gastronomía',
  icono: 'utensils',
  items: Item[].map(i => i.toDisplayObject()),
  subtotal: Number,          // sum of all item totals
  itemCount: Number,
  hasErrors: Boolean,        // any child has ruleErrors
  hasWarnings: Boolean,
  mode: 'collapsed' | 'expanded'
}
```
```

**Step 2: Commit**

```bash
git add packages/components/category/STATE_CONTRACT.md
git commit -m "docs: add Category component state contract"
```

---

### Task 12: Category component — domain logic and tests

**Files:**
- Create: `packages/components/category/Category.js`
- Create: `packages/components/category/tests/Category.test.js`

**Step 1: Write failing tests**

```js
// packages/components/category/tests/Category.test.js
import { describe, it, expect } from 'vitest';
import { Category } from '../Category.js';
import { Item } from '../../item/Item.js';
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';
import {
  SEED_ITEM_CATALOGO, SEED_CATEGORIAS,
  SEED_PERFILES_PRECIO, SEED_REGLAS_NEGOCIO
} from '../../../database/src/seed.js';

const db = { items: SEED_ITEM_CATALOGO, categorias: SEED_CATEGORIAS,
             perfiles: SEED_PERFILES_PRECIO, reglas: SEED_REGLAS_NEGOCIO };

function makeItem(id) {
  return Item.fromDefinition(resolveItemDefinition(id, db));
}

describe('Category', () => {
  it('starts with no items', () => {
    const cat = new Category({ ID_Categoria: 'CAT_GASTRO', Nombre: 'Gastronomía' });
    expect(cat.toDisplayObject().items).toHaveLength(0);
    expect(cat.toDisplayObject().subtotal).toBe(0);
  });

  it('holds multiple items and aggregates subtotal', () => {
    const cat = new Category({ ID_Categoria: 'CAT_GASTRO', Nombre: 'Gastronomía' });
    const item1 = makeItem('ITEM_CENA');
    const item2 = makeItem('ITEM_BAR');
    cat.addItem(item1);
    cat.addItem(item2);
    item1.receiveContext({ paxGlobal: 10 });
    item2.receiveContext({ paxGlobal: 10 });
    item1.addToBasket();
    item2.addToBasket();
    item1.calculate();
    item2.calculate();
    const display = cat.toDisplayObject();
    expect(display.items).toHaveLength(2);
    expect(display.subtotal).toBe(
      item1.toDisplayObject().total + item2.toDisplayObject().total
    );
  });

  it('propagates external context to all child items', () => {
    const cat = new Category({ ID_Categoria: 'CAT_GASTRO', Nombre: 'Gastronomía' });
    const item = makeItem('ITEM_CENA');
    cat.addItem(item);
    cat.receiveContext({ paxGlobal: 75, dia: 1, hora: '10:00' });
    item.addToBasket();
    item.calculate();
    expect(item.toDisplayObject().quantities.pax).toBe(75);
  });

  it('removes an item by id', () => {
    const cat = new Category({ ID_Categoria: 'CAT_GASTRO', Nombre: 'Gastronomía' });
    const item = makeItem('ITEM_CENA');
    cat.addItem(item);
    cat.removeItem('ITEM_CENA');
    expect(cat.toDisplayObject().items).toHaveLength(0);
  });

  it('reports hasErrors if any child item has rule errors', () => {
    const cat = new Category({ ID_Categoria: 'CAT_GASTRO', Nombre: 'Gastronomía' });
    const item = makeItem('ITEM_CENA');
    cat.addItem(item);
    item.receiveContext({ paxGlobal: 5 }); // below min pax rule = 20
    item.addToBasket();
    item.calculate();
    expect(cat.toDisplayObject().hasErrors).toBe(true);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npx vitest run packages/components/category/tests/Category.test.js
```

**Step 3: Implement Category.js**

```js
// packages/components/category/Category.js
export class Category {
  #definition;
  #items;

  constructor(definition) {
    this.#definition = definition;
    this.#items = [];
  }

  addItem(item) {
    this.#items.push(item);
    return this;
  }

  removeItem(itemId) {
    this.#items = this.#items.filter(i => i.toDisplayObject().id !== itemId);
    return this;
  }

  receiveContext(ctx) {
    this.#items.forEach(item => item.receiveContext(ctx));
    return this;
  }

  toDisplayObject() {
    const items = this.#items.map(i => i.toDisplayObject());
    const subtotal = items.reduce((sum, i) => sum + (i.total ?? 0), 0);
    return {
      id: this.#definition.ID_Categoria,
      nombre: this.#definition.Nombre,
      icono: this.#definition.Icono_UI ?? null,
      items,
      subtotal,
      itemCount: items.length,
      hasErrors: items.some(i => i.ruleErrors?.length > 0),
      hasWarnings: items.some(i => i.ruleWarnings?.length > 0)
    };
  }
}
```

**Step 4: Run tests**

```bash
npx vitest run packages/components/category/tests/Category.test.js
npm test 2>&1 | tail -5
```
Expected: all pass, no regressions.

**Step 5: Commit**

```bash
git add packages/components/category/Category.js \
        packages/components/category/tests/Category.test.js
git commit -m "feat: add Category domain component with context propagation and aggregation"
```

---

### Task 13: Category playground

**Files:**
- Create: `packages/components/category/ui/CategoryStandalone.html`
- Create: `packages/components/category/logic/createCategoryStandaloneComponent.js`
- Create: `apps/sandbox/routes/step-06-category/index.html`
- Modify: `apps/sandbox/index.html` (add nav link)
- Modify: `tools/serve-sandbox.mjs` (add route)

**Step 1: Create the mount function**

```js
// packages/components/category/logic/createCategoryStandaloneComponent.js
import Alpine from 'alpinejs';
import { Category } from '../Category.js';
import { Item } from '../../item/Item.js';
import { resolveItemDefinition } from '../../../database/src/resolveItemDefinition.js';
import {
  SEED_ITEM_CATALOGO, SEED_CATEGORIAS,
  SEED_PERFILES_PRECIO, SEED_REGLAS_NEGOCIO
} from '../../../database/src/seed.js';

const db = { ... };

export function mountCategoryStandalone(el) {
  Alpine.data('categoryStandaloneComponent', () => ({
    // External state (playground controls)
    selectedCategoryId: SEED_CATEGORIAS[0].ID_Categoria,
    paxGlobal: 50,
    dia: 1,
    hora: '09:00',
    availableItems: SEED_ITEM_CATALOGO,
    category: null,
    state: {},

    init() { this.rebuild(); },

    rebuild() {
      const catDef = SEED_CATEGORIAS.find(c => c.ID_Categoria === this.selectedCategoryId);
      this.category = new Category(catDef);
      this.refresh();
    },

    addItem(itemId) {
      const def = resolveItemDefinition(itemId, db);
      const item = Item.fromDefinition(def);
      this.category.addItem(item);
      this.category.receiveContext({ paxGlobal: this.paxGlobal, dia: this.dia, hora: this.hora });
      item.addToBasket();
      item.calculate();
      this.refresh();
    },

    removeItem(itemId) {
      this.category.removeItem(itemId);
      this.refresh();
    },

    setContext(key, value) {
      this[key] = key === 'hora' ? value : Number(value);
      this.category.receiveContext({ paxGlobal: this.paxGlobal, dia: this.dia, hora: this.hora });
      this.refresh();
    },

    refresh() {
      this.state = this.category.toDisplayObject();
    }
  }));

  el.innerHTML = `<div x-data="categoryStandaloneComponent" x-init="init()">
    <!-- External State Panel, Category Display, Debug Panel -->
  </div>`;
  Alpine.start();
}
```

**Step 2: Create CategoryStandalone.html following the three-zone playground pattern**

Zones:
- **External state panel:** category selector dropdown, paxGlobal / dia / hora inputs, item-add dropdown
- **Category display:** category header (name, icon, subtotal), list of item accordions
- **Debug panel:** subtotal, item count, hasErrors, hasWarnings

**Step 3: Create sandbox route**

```html
<!-- apps/sandbox/routes/step-06-category/index.html -->
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Step 06 — Category</title>
  <link rel="stylesheet" href="/packages/components/common/styles/claps-global.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>
</head>
<body class="sandbox-page">
  <main class="sandbox-shell">
    <p><a class="btn btn-small btn-secondary" href="/">Back</a></p>
    <main id="app">Loading...</main>
  </main>
  <script type="module">
    import { mountCategoryStandalone } from
      '/packages/components/category/logic/createCategoryStandaloneComponent.js';
    window.addEventListener('DOMContentLoaded', () => {
      mountCategoryStandalone(document.getElementById('app'));
    });
  </script>
</body>
</html>
```

**Step 4: Register route in serve-sandbox.mjs**

Add `'step-06-category'` to the routes list.

**Step 5: Manual test in browser**

```bash
npm run serve:sandbox
# Open: http://localhost:8090/step-06-category/
```

Verify:
- [ ] Category selector shows all seed categories
- [ ] Adding items from dropdown adds them to category display
- [ ] paxGlobal propagates to all child items and recalculates totals
- [ ] Subtotal updates correctly when items are added/removed
- [ ] hasErrors shows when pax triggers a min-pax rule
- [ ] Removing items works

**Step 6: Commit**

```bash
git add packages/components/category/ \
        apps/sandbox/routes/step-06-category/ \
        apps/sandbox/index.html \
        tools/serve-sandbox.mjs
git commit -m "feat: add Category component playground (step-06)"
```

---

## Phase II — UI + Compositions (outline)

> Detailed plans for each Phase II step will be written when Phase I is complete and verified.

```
Step 14  Kit         Item group sold as unit — domain + playground
Step 15  Catalog     Browsable item grid from DB — domain + playground
Step 16  Day         Single day container (categories + items) — domain + playground
Step 17  Basket      Multi-day quotation tree — domain + playground
Step 18  App flow    Evaluate apps/quotation/pkg against specs, assemble final app
```

Each step will follow the same structure: state contract → failing tests → implementation → passing tests → playground → commit.

---

## Execution Checklist

Before moving to the next task:
- [ ] All existing tests still pass (`npm test`)
- [ ] New tests for this task pass
- [ ] If a playground was created: verified manually in browser
- [ ] Committed with a clear message
