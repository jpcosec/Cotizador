# Orchestration

## Files

| File | Purpose |
|---|---|
| `quotationMachineBlueprint.js` | State/event/transition map as a plain object. No runtime dependencies. |
| `quotationMachine.xstate.js` | Factory that builds an XState machine from the blueprint + adapters. Handles v4/v5. |
| `adapters/guards.js` | 4 guard functions — pure predicates over context/event. |
| `adapters/actions.js` | All `assign` actions — call `src/Pricing/` pure functions directly. |
| `adapters/services.js` | 2 async services for save/send (return results, no context mutations). |
| `adapters/index.js` | Assembles the full adapter object for `createQuotationXStateMachine`. |

## Usage

```js
import { createQuotationXStateMachine } from './quotationMachine.xstate.js';
import { quotationAdapters } from './adapters/index.js';

const machine = createQuotationXStateMachine(quotationAdapters);
```

## Context shape

```js
{
  quotation: {               // null until INIT_BASKET
    cotizacion: {
      ID_Cotizacion,
      ID_Cliente,
      Fecha_Evento,
      Duracion_Dias,
      Pax_Global,
      Estado,                // 'Borrador' | 'Guardada' | 'Enviada'
    },
    paxGlobal: number,
    ajustesManuales: [],     // manual discounts, surcharges, price overrides
    _lineSeq: number,        // internal line ID counter
  },
  lineas: [],                // computed line items (stripped + repriced on every recalc)
  totals: { subtotal, taxes, total },
  store: null,               // InMemoryStore — injected before first event
  messages: [],
  errors: [],
}
```

## Canonical action pipeline (after each basket mutation)

```
applyBasketState → resolveItems → runFinalValidation → applyGlobalDiscounts
```

1. **`applyBasketState`** — syncs `cotizacion.Pax_Global` from `quotation.paxGlobal`.
2. **`resolveItems`** — strip computed fields → `resolveDefaults` → `calculateLinePrice` → `applyLineAdjustments`.
3. **`runFinalValidation`** — basic checks + `RESTRICCION_UI` rules → updates `context.errors`.
4. **`applyGlobalDiscounts`** — `applyGlobalAdjustments` (rules) + `applyManualAdjustments` + `calculateTaxes` → updates `context.lineas` and `context.totals`.

`OVERRIDE_PRICE` uses `resolveItemSubtree` instead of `resolveItems` (partial recalc scoped to the affected composition tree).

## Import paths

`adapters/actions.js` imports from `../../Pricing/` — this resolves correctly after the
`feature/pricing-logic` and `feature/xstate-machine-design` branches are merged.

During worktree development, configure your bundler to alias `src/Pricing` and `src/RulesEngine`
to the pricing branch's `src/` directory.
