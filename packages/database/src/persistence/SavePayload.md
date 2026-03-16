# SavePayload Contract

This document defines the save/load boundary used by rebuild quotation runtime.

## Legacy Baseline (Extracted)

Source files reviewed:

- `claps_codelab/Codigo.js`
- `claps_codelab/Controller_Cotizacion.js`
- `claps_codelab/Models.js`
- `claps_codelab/SheetDB.js`
- `claps_codelab/Stores_App.html`

### Legacy Save (`guardarCotizacion`)

- Router signature: `guardarCotizacion(datosCliente, carrito)`.
- Service orchestration:
  1. Create or reuse client (`crearOObtenerCliente`).
  2. Compute net total from cart lines.
  3. Create quotation header.
  4. Persist all detail rows for that quotation.
- Legacy success response:

```js
{
  success: true,
  id: 'COT-0001',
  mensaje: 'Cotizacion guardada correctamente.'
}
```

### Legacy Load (`cargarCotizacion`)

- Router signature: `cargarCotizacion(idCotizacion)`.
- Service returns client + normalized cart rows for UI rebuild.
- Legacy success response:

```js
{
  success: true,
  cliente,
  carrito: [
    {
      nombre,
      categoria,
      precio,
      cantidad,
      total,
      fecha,
      hora,
      dia,
    },
  ],
  fechaInicio,
}
```

### Legacy PDF Dependency

- `generarPDF` requires a saved quotation ID.
- UI flow is save first -> generate PDF by saved ID.

## Rebuild Serializer Input

`serializeQuotation(input)` receives a runtime snapshot projection:

```js
{
  selectedClient,
  settings,
  basketState,
  quotationId?,
  idPolicy?,
  now?,
}
```

## Rebuild Storage Mapping

### `COTIZACIONES` header row

| Runtime source | Storage column |
|---|---|
| `quotationId` (or `idPolicy.createQuotationId`) | `ID_Cotizacion` |
| `selectedClient.id` or `selectedClient.ID_Cliente` | `ID_Cliente` |
| constant | `Estado = 'Borrador'` |
| `settings.fechaInicio` | `Fecha_Evento` |
| `settings.duracionDias` | `Duracion_Dias` |
| `settings.paxGlobal` | `Pax_Global` |
| `now` | `Updated_At` |

### `LINEA_DETALLE` rows

Each basket entry becomes one row:

| Runtime source | Storage column |
|---|---|
| `idPolicy.createLineId(...)` | `ID_Linea` |
| quotation id | `ID_Cotizacion` |
| `entry.itemId` / definition id | `ID_Item` |
| constant | `Estado_Linea = 'ACTIVA'` |
| day projection | `Dia_Numero` |
| `override.hora ?? schedule.hora ?? settings.horaInicio` | `Hora_Inicio` |
| `override.pax` | `Override_Pax` |
| `override.cantidad` | `Override_Cantidad` |
| `override.duracionMin` | `Override_Duracion_Min` |
| `override.comentarios` | `Comentarios` |
| `now` | `Updated_At` |

All override numeric fields are normalized to number or `null`.

## PersistencePort Response Contract

`PersistencePort.save(...)` and `PersistencePort.load(...)` must return one of:

```js
{
  ok: true,
  data: {
    quotationId,
    cotizacion,
    lineas,
    lineCount,
  },
}
```

```js
{
  ok: false,
  error: {
    code,    // INVALID_ARGUMENT | NOT_FOUND | STORAGE_ERROR
    message,
    details?,
  },
}
```

## ID Strategy Policy

ID generation is a strategy injected to serializer/adapters, never hard-coded in runtime UI flow.

```js
{
  createQuotationId({ selectedClient, settings, basketState, nowIso }),
  createLineId({ quotationId, lineIndex, dayIndex, entry }),
}
```

If no policy is provided, serializer uses a local default policy. Runtime is still policy-agnostic.

## Layer Rules

- Serializer is pure and deterministic for the same `input`.
- Runtime depends only on `PersistencePort`.
- Adapters own physical storage details.
