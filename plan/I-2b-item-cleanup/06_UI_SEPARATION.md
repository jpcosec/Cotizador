# Step 6: UI Separation — Production Template + Sandbox Resolver Panel

## Intro

The current `ItemStandalone.html` (804 lines) mixes production display concerns with sandbox-only features (resolver modal, add-item modal, state dump, rule inspector). We split it into:

1. **Production template** (`ItemDisplay.html`) — clean, read-only item display
2. **Sandbox resolver panel** (`ResolverPanel.html`) — inline-editable DB resolver, always visible as side panel

The sandbox layout becomes a 2-panel view: item display on the left, editable resolver on the right.

## Agent Instruction

Split `ItemStandalone.html` into two files. Create the sandbox 2-panel layout. The resolver panel shows all 5 DB source tables with inline editing — clicking a value opens an input, changes trigger machine events, item recalculates live.

## Objective

Clean separation: production component has zero sandbox code. All editing/debugging lives in the resolver panel. The resolver replaces all the old "lever" concepts with direct DB record editing.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Sandbox Route (step-03/index.html)                      │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ │
│  │  ItemDisplay.html        │ │  ResolverPanel.html     │ │
│  │  (production component)  │ │  (sandbox-only)         │ │
│  │                          │ │                         │ │
│  │  Context inputs:         │ │  § ITEM_CATALOGO        │ │
│  │    paxGlobal, hora,      │ │    [inline editable]    │ │
│  │    duracion              │ │  § CATEGORIAS           │ │
│  │                          │ │    [inline editable]    │ │
│  │  Catalog card:           │ │  § PERFILES_PRECIO      │ │
│  │    badge, name, formula, │ │    [inline editable]    │ │
│  │    policy, rules dot     │ │  § PERFILES_INIT        │ │
│  │                          │ │    [inline editable]    │ │
│  │  Basket accordion:       │ │  § REGLAS_NEGOCIO       │ │
│  │    time, quantities,     │ │    [add/edit/toggle]    │ │
│  │    price breakdown,      │ │                         │ │
│  │    comments, actions     │ │  ─── State Dump ───     │ │
│  │                          │ │  toDisplayObject() JSON │ │
│  └─────────────────────────┘ └─────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Changes

### 6a. Create `ui/ItemDisplay.html` — Production template

Extract from current `ItemStandalone.html`, keeping ONLY:

**Zone 1 — Context inputs** (production concern: user sets event parameters):
- Item selector dropdown (for sandbox — could be removed in production embed)
- paxGlobal, hora, duracion inputs
- DB info strip (category name, profile name, price chips)

**Zone 2 — Item display**:
- Catalog card: category badge, name, formula text, policy hint, rules dot indicator with popover, rule error/warning alerts
- Basket accordion: time picker, quantity controls (pax/units/duration), price breakdown box, comments textarea, action buttons (copy/duplicate/remove), rule alerts

**Associated CSS**: Only the styles used by these elements.

**Remove from this file**: resolver modal, add-item modal, rule inspector panel, state dump toggle.

### 6b. Create `ui/ResolverPanel.html` — Sandbox resolver

An always-visible side panel showing the resolved DB join with inline editing.

**Each section** = one DB table heading + key-value rows:

**§ ITEM_CATALOGO**: Read-only identity fields (ID, Nombre, ID_Categoria)
**§ CATEGORIAS**: Editable `Def_Requiere_*` flags (toggle switches). FK display.
**§ PERFILES_PRECIO**: Editable pricing fields. Click value → input appears. On blur → calls `setProfileValue(key, value)`. Fields: Costo_Base_Fijo, Costo_Unitario_Pax, Costo_Unitario_Tiempo, Costo_Unitario_Item.
**§ PERFILES_INICIALIZACION**: Editable init fields. On blur → calls `setDefaultQuantity(key, value)`. Fields: Duracion_Min, Unidades_Por_Pax, Unidades_Por_Hora, Minutos_Por_Usuario, Cantidad_Fija, Pax_Fijo.
**§ REGLAS_NEGOCIO**: Rule list with:
- Each rule shows: ID, Nombre, Tipo_Accion badge, FIRED indicator
- Toggle active/inactive
- Expand to see condition (JSON + humanized)
- Add new rule button

**State dump**: Collapsible JSON view of `toDisplayObject()` at bottom.

**Inline edit pattern**:
```html
<!-- Read mode -->
<span x-show="!editing[key]" @click="editing[key] = true" class="editable-value" x-text="value"></span>
<!-- Edit mode -->
<input x-show="editing[key]" type="number" :value="value"
       @blur="updateField(section, key, $event.target.value); editing[key] = false"
       @keydown.enter="$event.target.blur()"
       x-ref="input" x-init="editing[key] && $nextTick(() => $refs.input.focus())">
```

**CSS**: Dark theme (matching current rule inspector aesthetic) to visually distinguish from production component.

### 6c. Update sandbox route `apps/sandbox/routes/step-03/index.html`

Switch from loading just `ItemStandalone.html` to a 2-panel layout:
```html
<div class="sandbox-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 0; height: 100vh;">
  <div id="item-display"><!-- ItemDisplay.html loads here --></div>
  <div id="resolver-panel" style="border-left: 1px solid #e2e8f0; overflow-y: auto;">
    <!-- ResolverPanel.html loads here -->
  </div>
</div>
```

### 6d. Update `createItemStandaloneComponent.js`

The component object needs to expose the full `resolvedDef` and `db` objects to the resolver panel (it already has `resolvedDef` — just ensure `db` is accessible for dropdown options in the resolver).

Add to the component return object:
```javascript
getDb() { return db; },  // For resolver panel dropdowns (categories, profiles)
```

### 6e. Delete `ui/ItemStandalone.html`

After the split is complete and verified, delete the original monolithic file.

## Key Files

- `packages/components/item/ui/ItemDisplay.html` — NEW (production)
- `packages/components/item/ui/ResolverPanel.html` — NEW (sandbox)
- `packages/components/item/ui/ItemStandalone.html` — DELETE after split
- `packages/components/item/logic/createItemStandaloneComponent.js` — minor update
- `apps/sandbox/routes/step-03/index.html` — layout update

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm test  # All tests pass (no logic changes)
```

Manual sandbox verification:
1. Start dev server, open step-03 route
2. **Layout**: Item display on left, resolver panel on right
3. **Read**: Resolver shows all 5 DB sections with correct data
4. **Edit pricing**: Click a PERFILES_PRECIO value, change it → item recalculates (total changes)
5. **Edit init**: Click a PERFILES_INIT value, change Unidades_Por_Pax → quantity resolution changes
6. **Edit rules**: Toggle a rule active/inactive → rule indicators update
7. **Mode switch**: Add to basket → basket view appears, resolver still visible
8. **State dump**: Expand → shows full JSON matching what the left panel displays
