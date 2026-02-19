# Setup Guide: SheetDB Database Initialization

## Problem Summary

The frontend was calling GAS functions that didn't exist:
- ❌ `getCatalogo()` → undefined
- ❌ `buscarCliente()` → undefined
- ❌ `crearOObtenerCliente()` → undefined

**Solution:** Enhanced `Code.gs` with real backend functions + sheet initialization.

---

## Architecture

```
Google Sheet (1 document)
├── Index (UI - displays frontend)
├── CLIENTES (data - clients)
├── ITEM_CATALOGO (data - catalog items)
├── CATEGORIAS (data - categories)
├── PERFILES_PRECIO (data - pricing profiles)
├── COTIZACIONES (data - saved quotes)
└── LINEA_DETALLE (data - quote line items)
```

**Data Flow:**
1. Frontend calls `google.script.run.getCatalogo()`
2. GAS backend (Code.gs) reads from ITEM_CATALOGO sheet
3. Returns data to frontend

---

## Setup Steps

### Step 1: Deploy to Google Apps Script

```bash
cd /home/jp/CotizadorLodge/claps_codelab
clasp push
```

This uploads the enhanced `Code.gs` to your GAS project.

### Step 2: Initialize the Database (One-time)

1. **Open Apps Script Editor**
   - Go to your Sheet
   - Tools → Apps Script Editor

2. **Run initialization function**
   - In the editor, paste into the console and execute:
   ```javascript
   initializeSheetDb()
   ```

3. **Expected output:**
   ```
   ✅ Created sheet: CLIENTES
   ✅ Created sheet: CATEGORIAS
   ✅ Created sheet: PERFILES_PRECIO
   ✅ Created sheet: ITEM_CATALOGO
   ✅ Created sheet: COTIZACIONES
   ✅ Created sheet: LINEA_DETALLE
   ✅ Seeded PERFILES_PRECIO
   ✅ Seeded CATEGORIAS
   ✅ Seeded ITEM_CATALOGO
   ✅ Database initialization complete!
   ```

4. **Verify in Sheets**
   - Go back to your Google Sheet
   - You should see new tabs (sheets) for each table
   - Row 1 has headers, rows 2+ have data

### Step 3: Test the UI

1. Refresh the Google Sheet (UI loads in `Index`)
2. Try "Cargar Catálogo" button
3. Should show items:
   - ☕ Coffee Intermedio
   - 🏛️ Salón Fario
   - 🍽️ Almuerzos Buffet Parrilla

---

## What Changed in Code.gs

### New Functions

| Function | Purpose | Called by |
|----------|---------|-----------|
| `getCatalogo()` | Get all active catalog items | Frontend: `cargarCatalogo()` |
| `buscarCliente(query)` | Search clients by name | Frontend: `buscarClientes()` |
| `crearOObtenerCliente(data)` | Create or get existing client | Frontend: `crearCliente()` |
| `guardarCotizacion(cliente, carrito)` | Save quotation to sheets | Frontend: `guardarCotizacion()` |
| `cargarCotizacion(id)` | Load saved quotation | Frontend: `cargarCotizacion()` |
| `generarPDF(id)` | Generate PDF (placeholder) | Frontend: `generarPDF()` |
| `initializeSheetDb()` | **Create all sheets + seed data** | Manual execution |

---

## Database Schema (Auto-Created)

### CLIENTES (Clients)
| Column | Type | Purpose |
|--------|------|---------|
| ID_Cliente | PK | Unique identifier |
| Nombre_Empresa | TEXT | Company name |
| RUT | TEXT | Tax ID |
| Email | TEXT | Contact email |
| Telefono | TEXT | Phone |
| Updated_At | DATETIME | Last modification |

### ITEM_CATALOGO (Catalog Items)
| Column | Type | Purpose |
|--------|------|---------|
| ID_Item | PK | Product SKU |
| Nombre | TEXT | Product name |
| ID_Categoria | FK | Category |
| ID_Perfil_Precio_Override | FK | Pricing profile |
| Def_Unidades_Por_Pax_Override | DECIMAL | Units per person |
| Activo | BOOLEAN | Active flag |
| Updated_At | DATETIME | Last modification |

### CATEGORIAS (Categories)
| Column | Type | Purpose |
|--------|------|---------|
| ID_Categoria | PK | Category ID |
| Nombre | TEXT | Display name |
| ID_Perfil_Precio_Default | FK | Default pricing |
| Def_Requiere_Pax | BOOLEAN | Pricing depends on guests |
| Def_Requiere_Cant | BOOLEAN | Pricing depends on quantity |
| Def_Requiere_Tiempo | BOOLEAN | Pricing depends on time |
| Def_Requiere_Hora | BOOLEAN | Show time picker in UI |
| ... (more fields) | | |

### COTIZACIONES (Quotations)
| Column | Type | Purpose |
|--------|------|---------|
| ID_Cotizacion | PK | Quote ID |
| ID_Cliente | FK | Client reference |
| Estado | ENUM | Workflow state |
| Fecha_Evento | DATE | Event date |
| Duracion_Dias | INTEGER | Duration in days |
| Pax_Global | INTEGER | Guest count |
| Updated_At | DATETIME | Last modification |

### LINEA_DETALLE (Quote Line Items)
| Column | Type | Purpose |
|--------|------|---------|
| ID_Linea | PK | Line item ID |
| ID_Cotizacion | FK | Quote reference |
| ID_Item | FK | Catalog item |
| Estado_Linea | ENUM | ACTIVA or REMOVIDA |
| Dia_Numero | INTEGER | Day 1, 2, 3... |
| Hora_Inicio | TIME | Service start time |
| Override_Pax | INTEGER | Guest override |
| Override_Cantidad | DECIMAL | Quantity override |
| Override_Duracion_Min | INTEGER | Duration override |
| Comentarios | TEXT | Notes |
| Updated_At | DATETIME | Last modification |

---

## Troubleshooting

### "ITEM_CATALOGO sheet not found"
→ Run `initializeSheetDb()` first

### "getCatalogo is not a function"
→ Run `clasp push` to deploy Code.gs to Apps Script

### Data appears empty
→ Check the sheet tabs exist and have headers in row 1

### Want to reset database?
```javascript
// In Apps Script editor console, run:
function resetDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['CLIENTES', 'ITEM_CATALOGO', 'CATEGORIAS', 'COTIZACIONES', 'LINEA_DETALLE', 'PERFILES_PRECIO'];
  sheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });
  populateSeedData();
}
resetDatabase()
```

---

## Next Steps

### To Add More Catalog Items

Edit the ITEM_CATALOGO sheet directly or update `populateSeedData()` in Code.gs with more items.

### To Load Historical Data

Instead of manual seed data, load from CSV:
```javascript
// Pseudo-code - would parse CSV and insert rows
const csv = Utilities.parseCsv(csvContent);
csv.forEach(row => {
  itemSheet.appendRow(row);
});
```

### To Use Real Pricing Profiles

Update PERFILES_PRECIO with real costs:
- PROF_COFFEE: $5,500 per person
- PROF_SALON: $220,000 base
- PROF_ALMUERZOS: $15,000 per person

---

## File Changes

**Modified:**
- `claps_codelab/gas/Code.gs` - Added all backend functions

**No changes to:**
- `claps_codelab/gas/Index.html` - Still works
- `claps_codelab_frontend/Stores_App.html` - Still works
- Frontend UI code - No changes needed

---

**Status:** ✅ Ready to deploy and initialize

**Last Updated:** 2026-02-19
