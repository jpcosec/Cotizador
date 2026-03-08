# Legacy Quotation UI Blueprint (claps_codelab)

Quick visual and control reference of the legacy external quotation UI in `claps_codelab/packages/frontend`.

## Basket State Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ RIGHT AREA HEADER (Config Panel)                                            │
│ [Cargar] [Guardar] [Copiar Día] [PDF] [Datos]                               │
│ Inicio [date]   Duración [n]   Pax Global [n]                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Day Tabs:  [Día 1] [Día 2] [Día 3] ...                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Timeline (accordion list of basket lines for selected day)                  │
│  [Hora] Item Name  $Total • pax                           [expand/collapse] │
│   - Pax [n], Unidades [n], Duración [n]                                     │
│   - Comentario [textarea]                                                    │
│   - [Eliminar] [Copiar al siguiente día] [Duplicar]                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Bottom Summary Bar: Neto $...   Total $...                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────── LEFT SIDEBAR ──────────────────────────────────┐
│ SF Lodge / Cotizador                                                         │
│ Cliente: [Seleccionar/Crear] or selected client + [Cambiar]                 │
│ Buscar item [text]                                                           │
│ Category accordion list                                                      │
│   - Mini card per item (name + base price + add icon)                       │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Primary Controls

- Sidebar: select/change client, search catalog, expand categories, add item.
- Timeline config: load quotation, save quotation, copy day, generate PDF, open DB viewer.
- Global quotation settings: event start date, duration days, global pax.
- Day navigation: day tabs.
- Line controls: time, pax override, units override, duration override, line comment.
- Line actions: remove, copy-to-next-day, duplicate-in-day.
- Validation flow: review table + totals, confirm/save, back to basket.
- Completion flow: create new quotation, view previous quotations.

## Other Screens and Modals

- Browse screen (welcome + start/load actions).
- Initialize screen (quotation setup phase).
- Error screen.
- Client selector/creator modal.
- Previous quotations modal (filter + load).
- Database viewer modal.
- XState debug badge (fixed bottom-right).

## Source References

- `claps_codelab/packages/frontend/Index.html`
- `claps_codelab/packages/frontend/Components_Sidebar.html`
- `claps_codelab/packages/frontend/Components_Timeline.html`
- `claps_codelab/packages/frontend/Components_ValidationSummary.html`
- `claps_codelab/packages/frontend/Components_CompletionSuccess.html`
- `claps_codelab/packages/frontend/Components_ModalCliente.html`
- `claps_codelab/packages/frontend/Components_ModalCotizaciones.html`
- `claps_codelab/packages/frontend/Components_DatabaseViewer.html`
- `claps_codelab/packages/frontend/Styles_Global.html`
