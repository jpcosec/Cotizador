# UI <-> Machine Context Sync Plan

Status: IMPLEMENTED (Feb 2026). All events, actions, and frontend handlers complete.
See: packages/xstate/src/Orchestration/quotationMachineBlueprint.js (UPDATE_QUOTATION_SETTINGS event)
     packages/xstate/src/Orchestration/adapters/actions.js (updateQuotationSettings action)
     packages/frontend/Stores_App.html (syncQuotationSettingsToMachine, actualizarHora)

## Goal

Eliminate state drift between Alpine UI and XState context for quotation-level settings and line scheduling fields.

## Observed Drift

### 1) Quotation settings drift

- UI allows editing `paxGlobal`, `fechaInicio`, `duracionDias` during basket flow.
- Those values are sent once at `QUOTATION_INITIALIZED`, but not persisted after edits.
- On next machine snapshot, bridge overwrites Alpine local values with stale context values.

### 2) Line schedule drift

- UI edits line `hora` directly in Alpine model.
- `UPDATE_ITEM` does not persist `Hora`/`Dia` in machine line state.
- `ADD_ITEM` currently sends `dia`/`hora`, but basket action ignores those keys.

## Proposed Event Contracts

### A) Update quotation-level settings

Event: `UPDATE_QUOTATION_SETTINGS`

Payload:

```json
{
  "type": "UPDATE_QUOTATION_SETTINGS",
  "paxGlobal": 25,
  "fechaEvento": "2026-03-20",
  "duracionDias": 4,
  "recalculateExistingLines": false
}
```

Rules:

- `paxGlobal`: integer >= 1
- `fechaEvento`: ISO date string `YYYY-MM-DD` or null
- `duracionDias`: integer >= 1
- `recalculateExistingLines`: optional boolean (default `false`)

### B) Update line-level fields (existing event)

Event: `UPDATE_ITEM`

Extend `overrides` contract:

```json
{
  "type": "UPDATE_ITEM",
  "lineId": "LIN_123",
  "overrides": {
    "Override_Pax": 30,
    "Override_Cantidad": 30,
    "Override_Duracion_Min": 240,
    "Comentarios": "texto",
    "Dia": 2,
    "Hora": "19:30"
  }
}
```

Rules:

- `Dia`: integer >= 1
- `Hora`: `HH:mm` 24h format

### C) Add item with schedule

Event: `ADD_ITEM`

Normalize to same keys used by line state:

```json
{
  "type": "ADD_ITEM",
  "itemId": "ITEM_X",
  "overrides": {
    "Override_Pax": 25,
    "Dia": 1,
    "Hora": "09:00",
    "Comentarios": "default/edited"
  }
}
```

## Proposed Machine Changes

### 1) State machine blueprint

File: `packages/xstate/src/Orchestration/quotationMachineBlueprint.js`

- Add transition in `quotation.basket.on`:
  - `UPDATE_QUOTATION_SETTINGS` -> action `updateQuotationSettings` (target stays `basket`)

### 2) New basket action: `updateQuotationSettings`

File: `packages/xstate/src/Orchestration/adapters/actions.js`

Behavior:

- Mutate both:
  - `context.quotation.paxGlobal`
  - `context.quotation.cotizacion.Pax_Global`
  - `context.quotation.cotizacion.Fecha_Evento`
  - `context.quotation.cotizacion.Duracion_Dias`
- If `recalculateExistingLines=true`, run full repricing of displayed lines.
- If `false`, keep existing lines untouched; only affects future adds/default resolution.

Recommendation: default to `false` to avoid unexpected repricing mid-edit.

### 3) Extend basket line mutation

File: `packages/xstate/src/Orchestration/adapters/actions.js`

- `addItem`: map `overrides.Dia` and `overrides.Hora` into base line (`Dia`, `Hora`)
- `updateItem`: support `overrides.Dia` and `overrides.Hora`

## Proposed Frontend Wiring

File: `packages/frontend/Stores_App.html`

- Add method: `syncQuotationSettingsToMachine()`
  - sends `UPDATE_QUOTATION_SETTINGS` with current UI values
- Call this method on:
  - `fechaInicio` change
  - `duracionDias` change
  - `paxGlobal` change
  - right before `ADD_ITEM` as defensive sync
- Line hour input should call a dedicated method `actualizarHora(idx, hora)`
  - sends `UPDATE_ITEM` with `overrides.Hora`

Template updates:

- `Components_Timeline.html`
  - add `@change` handlers for top config controls
  - line time input to use `@change="actualizarHora(...)"` instead of local-only model

## Bridge Behavior

Files:

- `packages/frontend/src/Bridge/AlpineXStateBridge.js`
- `packages/frontend/Bridge_AlpineXState.html`

No semantic change required after machine ownership is enforced. Current sync behavior (machine -> Alpine) is correct once write-path exists.

## Test Matrix (for implementation agent)

### A) Quotation settings persistence

1. Change `paxGlobal` in basket, then `ADD_ITEM`:
   - expected: UI keeps new `paxGlobal`
   - expected: added line uses new pax default

2. Change `fechaInicio`, then save/load same quotation:
   - expected: persisted `Fecha_Evento` matches edited value

3. Change `duracionDias`, regenerate days, add line on day N:
   - expected: day remains valid and not reset by snapshot

### B) Line schedule persistence

4. Edit line `Hora`, trigger any machine update (add/remove item):
   - expected: edited hour remains

5. Add item with selected day/hour:
   - expected: created line stores `Dia` and `Hora`

6. Update line `Dia` and `Hora` via `UPDATE_ITEM`:
   - expected: persisted in context and reflected in bridge mapping

### C) Recalculation policy

7. `UPDATE_QUOTATION_SETTINGS` with `recalculateExistingLines=false`:
   - expected: existing line totals stable

8. `UPDATE_QUOTATION_SETTINGS` with `recalculateExistingLines=true`:
   - expected: totals recomputed and deterministic

## Rollout Order

1. Implement event + action in xstate.
2. Wire frontend changes and handlers.
3. Add/adjust tests (xstate + frontend bridge/integration).
4. Run: frontend tests, xstate tests, bundle build.

## Acceptance Criteria

- No visible reset of `paxGlobal`, `fechaInicio`, `duracionDias` after machine events.
- Line `Hora`/`Dia` survive subsequent snapshot syncs.
- `ADD_ITEM` always reflects current quotation settings and selected schedule.
- Tests cover drift regression paths.
