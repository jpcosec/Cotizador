/**
 * Code.gs - Google Apps Script Backend for Cotizador SF Lodge
 *
 * This file provides the server-side functions that the frontend calls via google.script.run
 * It manages all database access through Google Sheets
 */

// ============================================================================
// INITIALIZATION & SETUP (Run once from Apps Script editor)
// ============================================================================

/**
 * Initialize the SheetDB - Creates all data sheets and populates with seed data
 *
 * Call this ONCE from the Apps Script editor console:
 * > initializeSheetDb()
 *
 * This will:
 * 1. Create sheets for each table (CLIENTES, ITEM_CATALOGO, CATEGORIAS, etc.)
 * 2. Add headers based on schema
 * 3. Populate with starter data
 */
function initializeSheetDb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Define schema for core tables
  const schema = {
    CLIENTES: [
      { name: "ID_Cliente", type: "PK" },
      { name: "Nombre_Empresa", type: "TEXT" },
      { name: "RUT", type: "TEXT" },
      { name: "Email", type: "TEXT" },
      { name: "Telefono", type: "TEXT" },
      { name: "Updated_At", type: "DATETIME" }
    ],

    CATEGORIAS: [
      { name: "ID_Categoria", type: "PK" },
      { name: "Nombre", type: "TEXT" },
      { name: "ID_Perfil_Precio_Default", type: "FK" },
      { name: "Def_Requiere_Pax", type: "BOOLEAN" },
      { name: "Def_Requiere_Cant", type: "BOOLEAN" },
      { name: "Def_Requiere_Tiempo", type: "BOOLEAN" },
      { name: "Def_Requiere_Hora", type: "BOOLEAN" },
      { name: "Def_Duracion_Min", type: "INTEGER" },
      { name: "Def_Unidades_Por_Pax", type: "DECIMAL" },
      { name: "Icono_UI", type: "TEXT" },
      { name: "Activo", type: "BOOLEAN" },
      { name: "Updated_At", type: "DATETIME" }
    ],

    PERFILES_PRECIO: [
      { name: "ID_Perfil_Precio", type: "PK" },
      { name: "Nombre", type: "TEXT" },
      { name: "Costo_Base_Fijo", type: "MONEY" },
      { name: "Costo_Unitario_Pax", type: "MONEY" },
      { name: "Costo_Unitario_Tiempo", type: "MONEY" },
      { name: "Costo_Unitario_Item", type: "MONEY" },
      { name: "Activo", type: "BOOLEAN" },
      { name: "Updated_At", type: "DATETIME" }
    ],

    ITEM_CATALOGO: [
      { name: "ID_Item", type: "PK" },
      { name: "Nombre", type: "TEXT" },
      { name: "ID_Categoria", type: "FK" },
      { name: "ID_Perfil_Precio_Override", type: "FK" },
      { name: "Def_Unidades_Por_Pax_Override", type: "DECIMAL" },
      { name: "Activo", type: "BOOLEAN" },
      { name: "Updated_At", type: "DATETIME" }
    ],

    COTIZACIONES: [
      { name: "ID_Cotizacion", type: "PK" },
      { name: "ID_Cliente", type: "FK" },
      { name: "Estado", type: "ENUM" },
      { name: "Fecha_Evento", type: "DATE" },
      { name: "Duracion_Dias", type: "INTEGER" },
      { name: "Pax_Global", type: "INTEGER" },
      { name: "Updated_At", type: "DATETIME" }
    ],

    LINEA_DETALLE: [
      { name: "ID_Linea", type: "PK" },
      { name: "ID_Cotizacion", type: "FK" },
      { name: "ID_Item", type: "FK" },
      { name: "Estado_Linea", type: "ENUM" },
      { name: "Dia_Numero", type: "INTEGER" },
      { name: "Hora_Inicio", type: "TIME" },
      { name: "Override_Pax", type: "INTEGER" },
      { name: "Override_Cantidad", type: "DECIMAL" },
      { name: "Override_Duracion_Min", type: "INTEGER" },
      { name: "Comentarios", type: "TEXT" },
      { name: "Updated_At", type: "DATETIME" }
    ]
  };

  // Create sheets and add headers
  for (const [tableName, columns] of Object.entries(schema)) {
    let sheet = ss.getSheetByName(tableName);

    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      Logger.log("✅ Created sheet: " + tableName);
    } else {
      Logger.log("⚠️  Sheet already exists: " + tableName);
    }

    // Set headers (row 1)
    const headerNames = columns.map(col => col.name);
    sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);
    sheet.setFrozenRows(1);
  }

  // Populate with seed data
  populateSeedData();

  Logger.log("✅ Database initialization complete!");
}

/**
 * Populate seed data into sheets
 */
function populateSeedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date().toISOString();

  // Seed Perfiles de Precio
  const perfilesSheet = ss.getSheetByName("PERFILES_PRECIO");
  if (perfilesSheet.getLastRow() === 1) {
    perfilesSheet.appendRow([
      "PROF_COFFEE", "Coffee Intermedio", 0, 5500, 0, 0, true, now
    ]);
    perfilesSheet.appendRow([
      "PROF_SALON", "Salón Standard", 220000, 0, 0, 0, true, now
    ]);
    perfilesSheet.appendRow([
      "PROF_ALMUERZOS", "Almuerzos Buffet", 0, 15000, 0, 0, true, now
    ]);
    Logger.log("✅ Seeded PERFILES_PRECIO");
  }

  // Seed Categorías
  const categoriasSheet = ss.getSheetByName("CATEGORIAS");
  if (categoriasSheet.getLastRow() === 1) {
    categoriasSheet.appendRow([
      "CAT_CAFE", "Cafés", "PROF_COFFEE", true, false, false, false, 0, 1, "☕", true, now
    ]);
    categoriasSheet.appendRow([
      "CAT_SALONES", "Salones", "PROF_SALON", false, false, false, true, 240, 1, "🏛️", true, now
    ]);
    categoriasSheet.appendRow([
      "CAT_COMIDAS", "Comidas", "PROF_ALMUERZOS", true, false, false, true, 120, 1, "🍽️", true, now
    ]);
    Logger.log("✅ Seeded CATEGORIAS");
  }

  // Seed Items de Catálogo
  const itemsSheet = ss.getSheetByName("ITEM_CATALOGO");
  if (itemsSheet.getLastRow() === 1) {
    itemsSheet.appendRow([
      "ITEM_COFFEE_INT", "Coffee Intermedio", "CAT_CAFE", null, null, true, now
    ]);
    itemsSheet.appendRow([
      "ITEM_SALON_FARIO", "Salón Fario", "CAT_SALONES", "PROF_SALON", null, true, now
    ]);
    itemsSheet.appendRow([
      "ITEM_ALMUERZO_PARRILLA", "Almuerzos Buffet Parrilla", "CAT_COMIDAS", "PROF_ALMUERZOS", null, true, now
    ]);
    Logger.log("✅ Seeded ITEM_CATALOGO");
  }

  // Seed Clientes (empty for now - users create them)
  const clientesSheet = ss.getSheetByName("CLIENTES");
  Logger.log("✅ CLIENTES sheet ready (empty)");

  // Seed Cotizaciones (empty for now)
  const cotizacionesSheet = ss.getSheetByName("COTIZACIONES");
  Logger.log("✅ COTIZACIONES sheet ready (empty)");
}

// ============================================================================
// FRONTEND API FUNCTIONS (Called by google.script.run)
// ============================================================================

/**
 * Get all catalog items (for sidebar)
 *
 * Called by: cargarCatalogo() in frontend
 * Returns: Array of items with { ID_Item, Nombre, ID_Categoria, ... }
 */
function getCatalogo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("ITEM_CATALOGO");

    if (!sheet) {
      throw new Error("ITEM_CATALOGO sheet not found. Run initializeSheetDb() first.");
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers

    const headers = data[0];
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((header, idx) => {
        item[header] = row[idx];
      });

      // Only include active items
      if (item.Activo !== false) {
        items.push(item);
      }
    }

    return items;
  } catch (error) {
    console.error("Error in getCatalogo:", error);
    throw error;
  }
}

/**
 * Search clients by name
 *
 * Called by: buscarClientes() in frontend
 * Args: query - search string
 * Returns: Array of matching clients
 */
function buscarCliente(query) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES");

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const nombreIdx = headers.indexOf("Nombre_Empresa");

    if (nombreIdx === -1) return [];

    const q = (query || "").toLowerCase();
    const results = [];

    for (let i = 1; i < data.length; i++) {
      const nombre = String(data[i][nombreIdx] || "").toLowerCase();
      if (nombre.includes(q)) {
        const client = {};
        headers.forEach((header, idx) => {
          client[header] = data[i][idx];
        });
        results.push(client);
      }
    }

    return results;
  } catch (error) {
    console.error("Error in buscarCliente:", error);
    throw error;
  }
}

/**
 * Create or get existing client
 *
 * Called by: crearCliente() in frontend
 * Args: data - { nombre, rut, email, telefono, contacto }
 * Returns: Created client object with ID_Cliente
 */
function crearOObtenerCliente(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES");

    if (!sheet) {
      throw new Error("CLIENTES sheet not found. Run initializeSheetDb() first.");
    }

    // Check if client with this RUT already exists
    const existing = buscarClientePorRUT(data.rut);
    if (existing) {
      return existing;
    }

    // Create new client
    const clientId = "CLI_" + Utilities.getUuid().substring(0, 8).toUpperCase();
    const now = new Date().toISOString();

    sheet.appendRow([
      clientId,
      data.nombre || "",
      data.rut || "",
      data.email || "",
      data.telefono || "",
      now
    ]);

    return {
      ID_Cliente: clientId,
      Nombre_Empresa: data.nombre,
      RUT: data.rut,
      Email: data.email,
      Telefono: data.telefono,
      Updated_At: now
    };
  } catch (error) {
    console.error("Error in crearOObtenerCliente:", error);
    throw error;
  }
}

/**
 * Save a quotation (creates or updates COTIZACION + LINEA_DETALLE rows)
 *
 * Called by: guardarCotizacion() in frontend
 * Args: cliente, carrito (items in basket)
 * Returns: { success: true, id: "COT_xxx", mensaje: "..." }
 */
function guardarCotizacion(cliente, carrito) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cotSheet = ss.getSheetByName("COTIZACIONES");
    const lineaSheet = ss.getSheetByName("LINEA_DETALLE");

    if (!cotSheet || !lineaSheet) {
      throw new Error("COTIZACIONES or LINEA_DETALLE sheets not found.");
    }

    const now = new Date();
    const cotizacionId = "COT_" + Math.floor(Date.now() / 1000);

    // Add quotation header
    cotSheet.appendRow([
      cotizacionId,
      cliente.ID_Cliente,
      "Borrador",
      new Date().toISOString().split('T')[0],
      1, // Default duration
      10, // Default pax
      now.toISOString()
    ]);

    // Add line items
    for (let i = 0; i < carrito.length; i++) {
      const item = carrito[i];
      const lineaId = cotizacionId + "_L" + (i + 1);

      lineaSheet.appendRow([
        lineaId,
        cotizacionId,
        item.nombre, // In real scenario, this would be ID_Item
        "ACTIVA",
        item.dia || 1,
        item.hora || "09:00",
        item.cantidad || 1,
        null,
        null,
        "",
        now.toISOString()
      ]);
    }

    return {
      success: true,
      id: cotizacionId,
      mensaje: "Cotización guardada correctamente"
    };
  } catch (error) {
    console.error("Error in guardarCotizacion:", error);
    throw error;
  }
}

/**
 * Load a saved quotation
 *
 * Called by: cargarCotizacion() in frontend
 * Args: cotizacionId - e.g. "COT_xxx"
 * Returns: { success: true, cliente, carrito, ... } or { success: false }
 */
function cargarCotizacion(cotizacionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cotSheet = ss.getSheetByName("COTIZACIONES");
    const lineaSheet = ss.getSheetByName("LINEA_DETALLE");
    const clientesSheet = ss.getSheetByName("CLIENTES");

    if (!cotSheet || !lineaSheet) {
      throw new Error("Data sheets not found.");
    }

    // Find quotation
    const cotData = cotSheet.getDataRange().getValues();
    const cotHeaders = cotData[0];
    const idIdx = cotHeaders.indexOf("ID_Cotizacion");
    const clienteIdIdx = cotHeaders.indexOf("ID_Cliente");
    const fechaIdx = cotHeaders.indexOf("Fecha_Evento");
    const duracionIdx = cotHeaders.indexOf("Duracion_Dias");
    const paxIdx = cotHeaders.indexOf("Pax_Global");

    let cotizacion = null;
    for (let i = 1; i < cotData.length; i++) {
      if (String(cotData[i][idIdx]) === cotizacionId) {
        cotizacion = {
          id: cotData[i][idIdx],
          clienteId: cotData[i][clienteIdIdx],
          fechaInicio: cotData[i][fechaIdx],
          duracionDias: cotData[i][duracionIdx],
          paxGlobal: cotData[i][paxIdx]
        };
        break;
      }
    }

    if (!cotizacion) {
      return { success: false, mensaje: "Cotización no encontrada" };
    }

    // Find client
    const clientData = clientesSheet.getDataRange().getValues();
    const clientHeaders = clientData[0];
    const clientIdIdx = clientHeaders.indexOf("ID_Cliente");
    const nombreIdx = clientHeaders.indexOf("Nombre_Empresa");

    let cliente = null;
    for (let i = 1; i < clientData.length; i++) {
      if (String(clientData[i][clientIdIdx]) === cotizacion.clienteId) {
        cliente = {};
        clientHeaders.forEach((header, idx) => {
          cliente[header] = clientData[i][idx];
        });
        break;
      }
    }

    // Find line items
    const lineaData = lineaSheet.getDataRange().getValues();
    const lineaHeaders = lineaData[0];
    const cotIdIdx = lineaHeaders.indexOf("ID_Cotizacion");

    const carrito = [];
    for (let i = 1; i < lineaData.length; i++) {
      if (String(lineaData[i][cotIdIdx]) === cotizacionId) {
        const linea = {};
        lineaHeaders.forEach((header, idx) => {
          linea[header] = lineaData[i][idx];
        });
        carrito.push(linea);
      }
    }

    return {
      success: true,
      cliente: cliente,
      carrito: carrito,
      fechaInicio: cotizacion.fechaInicio,
      duracionDias: cotizacion.duracionDias,
      paxGlobal: cotizacion.paxGlobal
    };
  } catch (error) {
    console.error("Error in cargarCotizacion:", error);
    return { success: false, mensaje: error.toString() };
  }
}

/**
 * Generate PDF for a quotation (placeholder)
 *
 * In real implementation, this would generate a PDF document
 */
function generarPDF(cotizacionId) {
  try {
    // Placeholder: return a simple message
    // Real implementation would create a PDF and return a shareable link
    return "https://example.com/pdf/" + cotizacionId;
  } catch (error) {
    console.error("Error in generarPDF:", error);
    throw error;
  }
}

/**
 * Helper: Search client by RUT
 */
function buscarClientePorRUT(rut) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES");

    if (!sheet || sheet.getLastRow() <= 1) {
      return null;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rutIdx = headers.indexOf("RUT");

    if (rutIdx === -1) return null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][rutIdx]) === String(rut)) {
        const client = {};
        headers.forEach((header, idx) => {
          client[header] = data[i][idx];
        });
        return client;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// UI ENTRY POINT
// ============================================================================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cotizador SF Lodge v2');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
