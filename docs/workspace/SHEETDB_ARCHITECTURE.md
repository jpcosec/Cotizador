# SheetDB Architecture: Where Does Data Live?

## High-Level Overview

```
┌─────────────────────────────────────────────┐
│          Google Sheet Document              │
│        (Single source of truth)             │
├─────────────────────────────────────────────┤
│                                             │
│  [Index tab]      → Frontend UI rendered    │
│  [CLIENTES tab]   → Clients data            │
│  [ITEM_CATALOGO]  → Product catalog         │
│  [CATEGORIAS]     → Product categories      │
│  [PERFILES_PRECIO]→ Pricing configurations  │
│  [COTIZACIONES]   → Saved quotes            │
│  [LINEA_DETALLE]  → Quote line items        │
│                                             │
└─────────────────────────────────────────────┘
         ↑                    ↑
         │                    │
         │            ┌───────┴────────┐
         │            │                │
   Browser       Apps Script
   (Frontend)     (Backend)
                  Code.gs
```

---

## Data Flow Example: "Load Catalog"

```
1. User clicks "Cargar Catálogo"
   ├─ Frontend calls:
   │  google.script.run.getCatalogo()
   │
   ├─→ GAS Backend (Code.gs) receives call
   │   ├─ Opens ITEM_CATALOGO sheet
   │   ├─ Reads all rows (skips inactive)
   │   └─ Converts to JSON
   │
   ├─→ Returns JSON to Frontend
   │   [
   │     { ID_Item: "ITEM_COFFEE_INT", Nombre: "Coffee Intermedio", ... },
   │     { ID_Item: "ITEM_SALON_FARIO", Nombre: "Salón Fario", ... },
   │     ...
   │   ]
   │
   └─ Frontend displays items in Sidebar
      ├─ Grouped by category
      └─ Ready to add to basket
```

---

## Request/Response Pattern

### Frontend Call (Stores_App.html)
```javascript
google.script.run
  .withSuccessHandler(function(data) {
    self.catalogo = data || [];  // Store in Alpine.js state
  })
  .withFailureHandler(function(error) {
    console.error(error);
  })
  .getCatalogo();  // ← Calls GAS backend function
```

### GAS Backend Response (Code.gs)
```javascript
function getCatalogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ITEM_CATALOGO");

  // Read all rows, convert to objects
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = data[i][idx];
    });
    if (item.Activo !== false) items.push(item);
  }

  return items;  // ← Returned to frontend
}
```

---

## All Frontend ↔ Backend Functions

| Frontend Function | GAS Function | Sheet Used | Purpose |
|-------------------|--------------|-----------|---------|
| `cargarCatalogo()` | `getCatalogo()` | ITEM_CATALOGO | Get all products |
| `buscarClientes()` | `buscarCliente(query)` | CLIENTES | Search client by name |
| `crearCliente()` | `crearOObtenerCliente(data)` | CLIENTES | Create new client |
| `guardarCotizacion()` | `guardarCotizacion(cliente, carrito)` | COTIZACIONES, LINEA_DETALLE | Save quote |
| `cargarCotizacion()` | `cargarCotizacion(id)` | COTIZACIONES, LINEA_DETALLE | Load saved quote |
| `generarPDF()` | `generarPDF(id)` | (external) | Generate PDF |

---

## Where Does CSV Data Go?

### Original CSV (Data_Historica.csv)
```
Archivo, Nombre, Empresa, E Mail, Fono, Fecha, ...
/path/to/file, Saul Contreras, Johnsons -SOFOFA., ...
```

### Import Process
```
CSV Data
  ↓
Code.gs: populateSeedData() function
  ├─ Parses CSV
  ├─ Creates ITEM_CATALOGO rows
  ├─ Creates CLIENTES rows
  └─ Creates PERFILES_PRECIO rows
  ↓
Google Sheet Data Tabs
  (CLIENTES, ITEM_CATALOGO, etc.)
```

**To import historical CSV:**
1. Modify `populateSeedData()` in Code.gs
2. Or add CSV import UI button
3. Parse → Transform → Append to sheets

---

## Local Development vs Production

### Local (localhost:8081)
```
Frontend calls google.script.run.getCatalogo()
  ↓
Local_GAS_Shim.html (mock)
  └─ Returns window.localCatalogItems (fake data)
```

### Production (Google Apps Script)
```
Frontend calls google.script.run.getCatalogo()
  ↓
Code.gs: getCatalogo() (real function)
  ↓
Reads from ITEM_CATALOGO sheet
  └─ Returns real data from Google Sheet
```

---

## Sheet Structure Examples

### ITEM_CATALOGO Sheet (Row 1: Headers)
```
| ID_Item | Nombre | ID_Categoria | ID_Perfil_Precio_Override | Activo | Updated_At |
|---------|--------|--------------|---------------------------|--------|------------|
| ITEM_COFFEE_INT | Coffee Intermedio | CAT_CAFE | | TRUE | 2026-02-19... |
| ITEM_SALON_FARIO | Salón Fario | CAT_SALONES | PROF_SALON | TRUE | 2026-02-19... |
| ITEM_ALMUERZO_PARRILLA | Almuerzos Buffet Parrilla | CAT_COMIDAS | PROF_ALMUERZOS | TRUE | 2026-02-19... |
```

### CLIENTES Sheet (Row 1: Headers)
```
| ID_Cliente | Nombre_Empresa | RUT | Email | Telefono | Updated_At |
|------------|----------------|-----|-------|----------|------------|
| CLI_ABC123 | Johnsons -SOFOFA. | 12345678-K | sf@sflodge.cl | 229019059 | 2026-02-19... |
```

### COTIZACIONES Sheet (Row 1: Headers)
```
| ID_Cotizacion | ID_Cliente | Estado | Fecha_Evento | Duracion_Dias | Pax_Global | Updated_At |
|---------------|------------|--------|--------------|----------------|-----------|------------|
| COT_12345678 | CLI_ABC123 | Borrador | 2026-03-01 | 2 | 55 | 2026-02-19... |
```

### LINEA_DETALLE Sheet (Row 1: Headers)
```
| ID_Linea | ID_Cotizacion | ID_Item | Dia_Numero | Hora_Inicio | Override_Pax | Updated_At |
|----------|--------------|---------|-----------|------------|--------------|------------|
| COT_12345678_L1 | COT_12345678 | ITEM_COFFEE_INT | 1 | 09:00 | 55 | 2026-02-19... |
```

---

## Permissions & Access

### Frontend UI (in Sheets)
- ✅ Read-only access to sheets (via google.script.run)
- ✅ Can't directly modify sheets
- ✅ Must call GAS functions to write data

### GAS Backend (Code.gs)
- ✅ Full read/write access to all sheets
- ✅ Can create, delete, update rows
- ✅ Acts as gatekeeper/validator

### Direct Sheet Editing
- ✅ You (the user) can edit sheets directly in Google Sheets
- ✅ Good for testing & data corrections
- ✅ Changes appear immediately to frontend (if it re-reads)

---

## Security Considerations

### Current Architecture
- ✅ Frontend calls trusted GAS functions
- ✅ GAS functions validate inputs
- ✅ No direct SQL injection (using Sheet API, not databases)
- ⚠️ Basic input validation (consider adding more)

### Recommendations
1. Add validation in GAS functions:
   ```javascript
   if (!data.nombre || data.nombre.trim() === '') {
     throw new Error("Nombre is required");
   }
   ```

2. Sanitize user inputs before inserting

3. Add authorization checks (who can edit what)

---

## Performance Notes

### Current Approach
- **Pros:** Simple, no database setup, works in Google Sheets
- **Cons:** Slow for large datasets (GAS sheet operations are ~100-500ms)

### Optimization Ideas
1. **Caching:** Load catalog once on app init, not on every filter
2. **Pagination:** Load 50 items at a time instead of all
3. **Indexing:** Cache client list for faster search

### Example: Cache Catalog on Init
```javascript
// In Stores_App.html
init() {
  // Load once
  this.cargarCatalogo();  // ← Only call once

  // After: use this.catalogo for filtering, sorting, etc.
  // Don't call getCatalogo() again unless data changes
}
```

---

## What's Next?

### Immediate
1. ✅ Deploy Code.gs (`clasp push`)
2. ✅ Run `initializeSheetDb()` in Apps Script editor
3. ✅ Refresh UI and test

### Short-term
- [ ] Load real CSV data into sheets
- [ ] Test client creation & saving quotes
- [ ] Add PDF generation (placeholder is done)
- [ ] Test on multiple users

### Medium-term
- [ ] Add data validation in GAS
- [ ] Implement search indexing
- [ ] Add user authentication
- [ ] Archive old quotes

---

**Architecture Status:** ✅ Ready for deployment

**Last Updated:** 2026-02-19
