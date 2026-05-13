# Migration: PDF Generation

## What

Legacy (`legacy/Controller_Cotizacion.js`) has a fully working PDF generator: `servicioGenerarPDF` → `_crearDocumentoFisico`. It creates a formatted Google Docs document from a quotation, converts it to PDF via `DriveApp`, trashes the intermediate doc, and returns a public URL.

Dev has **zero PDF export**. The `CACHE_COTIZACION` table and `HISTORIAL_COTIZACION` exist, and `Cotizacion.Estado` has a `Finalizada` state — both imply PDF generation is planned — but no implementation exists yet.

## Why it matters

PDF is the **deliverable** of the quotation flow. Without it, the app can build quotes but not send them to clients. It is also what triggers `Estado = 'Enviada'` and populates `Link_PDF` (legacy) / `Estado = 'Finalizada'` (dev), closing the sales cycle.

## What legacy does

```
servicioGenerarPDF(idCotizacion)
  └── Cotizacion.find(idCotizacion)         // load header
  └── _crearDocumentoFisico(idCotizacion)
        ├── Cotizacion.getConDetalle()       // eager-load items
        ├── DocumentApp.create(title)        // create Google Doc
        ├── body.appendTable(header)         // lodge name + client info block
        ├── body.appendTable(itemsTable)     // line items: fecha/hora, item, pax, unit price, total
        ├── body.appendTable(totalsTable)    // neto + IVA 19% + total
        ├── doc.getAs(MimeType.PDF)          // convert to PDF blob
        ├── DriveApp.createFile(blob)        // save to Drive
        └── DriveApp.getFileById(doc).setTrashed(true)  // clean up doc
  └── Cotizacion.marcarEnviada(id, url, total)
```

Layout structure:
- **Header table** (2 cols): lodge branding left, quotation metadata right (ID, date, client, RUT, contact, pax)
- **Line-items table** (5 cols): `Fecha/Hora | Item/Servicio | Pax | Valor Unit. | Total`
- **Totals block**: neto, IVA (19%), total — right-aligned, final row bold green

Notable details:
- Dates from Sheets arrive as either `Date` objects or strings like `"2026-02-05 09:00"`. Legacy normalizes both paths with a `replace(/-/g, '/')` trick before `new Date()`.
- Column widths are set manually (90/180/40/70/80 px). Wrapped in try/catch because `setColumnWidth` throws on some Sheets configurations.
- The doc is immediately trashed after PDF creation — no intermediate artifact remains.

## How to migrate

### Option A — Keep Google Docs (GAS-native, lowest effort)

Port `_crearDocumentoFisico` as a new GAS server function `generarPDFV2(idCotizacion)` that:
1. Loads `COTIZACIONES` + `LINEA_DETALLE` (new schema) instead of the legacy `Cotizacion.getConDetalle`
2. Joins `ITEM_CATALOGO` to get item names (legacy used `d.Item` directly; dev stores `ID_Item` in `LINEA_DETALLE`)
3. Computes `total = Override_Pax ?? Pax_Global × price` per line using the same formula as `ItemLogic`
4. Keeps the same Doc → PDF → trash pattern

Schema differences to handle:

| Legacy field | Dev equivalent |
|---|---|
| `d.Item` | `ITEM_CATALOGO[ID_Item].Nombre` |
| `d.Timestamp_Evento` | `Dia_Numero` + `Hora_Inicio` + `Fecha_Evento` from `COTIZACIONES` |
| `d.Cantidad` | `Override_Pax ?? Pax_Global` |
| `d.Precio_Unitario_Aplicado` | computed from `PERFILES_PRECIO` via `ItemLogic` formula |
| `d.Total_Linea` | `baseFijo + (qty × rate)` |
| `cot.Total_Neto` | sum of all line totals |

`GasSheetAdapter` already has the `load()` path to retrieve `{ cotizacion, lineas }`. The new server function just needs to call the equivalent of `load()` internally and do the Doc rendering.

### Option B — HTML-to-PDF in browser (decoupled)

If moving away from Google Docs dependency: render a printable HTML template via Alpine, then `window.print()` or a headless PDF lib. This removes the GAS coupling but requires building the template on the frontend side.

## Files to create

- `dev/gas/servicioGenerarPDF.js` — new GAS server function (Option A)
- `dev/src/services/exports/pdfTemplate.js` — HTML template renderer (Option B)
- Update `GasSheetAdapter` to expose a `generatePdf(id)` method
- Update `AppStateMachine` to add a `GENERATE_PDF` event in the `Finalizada` transition
