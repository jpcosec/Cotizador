# Step 04: Stage 1 — Quotation Context (Empty Cart)

**What:** Create a quotation context with pax and event data but no items.

**File:** `src/Pipeline/01_context.js`

**Functions:**
- `createQuotation({ paxGlobal, fechaEvento, duracionDias, clienteId }, store)` → initial context
- `updatePax(ctx, newPax)` → modifies paxGlobal

**Context shape:**
```js
{
  cotizacion: { ID_Cotizacion, ID_Cliente, Fecha_Evento, Duracion_Dias, Pax_Global, Estado: 'Borrador' },
  paxGlobal: 80,
  lineas: [],
  totals: { subtotal: 0, taxes: [], total: 0 },
  messages: []
}
```

**Test file:** `tests/unit/01_context.test.js`
- create with 80 pax → paxGlobal=80, lineas=[], totals.total=0
- create with client CLI_CORP → cotizacion.ID_Cliente = 'CLI_CORP'
- updatePax to 100 → paxGlobal=100

**Depends on:** Step 02.
