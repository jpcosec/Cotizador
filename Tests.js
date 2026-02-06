/**
 * ============================================
 * TESTS DEL SISTEMA
 * ============================================
 */

function testConexion() {
  Logger.log("========== TEST: CONEXIÓN ==========");
  
  try {
    // Test básico de lectura
    var db = new SheetDB(DB_CONFIG.TABLES.ITEMS);
    var items = db.all();
    Logger.log("✅ Conexión OK - Items encontrados: " + items.length);
    
    if (items.length > 0) {
      Logger.log("   Primer item: " + JSON.stringify(items[0]));
    }
    
  } catch (e) {
    Logger.log("❌ ERROR DE CONEXIÓN: " + e.message);
    Logger.log(e.stack);
  }
}

function testCompleto() {
  Logger.log("========== INICIANDO TESTS COMPLETOS ==========");
  
  try {
    // Test 1: Catálogo
    Logger.log("\n--- Test 1: Catálogo ---");
    var catalogo = Item.getCatalogo();
    Logger.log("✅ Catálogo cargado: " + catalogo.length + " items");
    if (catalogo.length > 0) {
      Logger.log("   Primer item: " + catalogo[0].nombre + " - $" + catalogo[0].precio);
    }
    
    // Test 2: Crear Cliente
    Logger.log("\n--- Test 2: Crear Cliente ---");
    var rutTest = "76543210-9";
    
    // Limpiar si existe
    var existente = Cliente.findByRUT(rutTest);
    if (existente) {
      Logger.log("   Cliente ya existe, usando existente");
      var cliente = existente;
    } else {
      var cliente = Cliente.create({
        Nombre_Empresa: "Test Empresa SA",
        RUT: rutTest,
        Email: "test@test.cl",
        Telefono: "+56912345678",
        Contacto: "Juan Pérez"
      });
      Logger.log("✅ Cliente creado: " + cliente.ID_Cliente);
    }
    
    // Test 3: Buscar Cliente
    Logger.log("\n--- Test 3: Buscar Cliente ---");
    var encontrado = Cliente.findByRUT(rutTest);
    Logger.log("✅ Cliente encontrado: " + encontrado.Nombre_Empresa);
    Logger.log("   ID: " + encontrado.ID_Cliente);
    
    // Test 4: Búsqueda fuzzy
    Logger.log("\n--- Test 4: Búsqueda por nombre ---");
    var resultados = Cliente.search("test");
    Logger.log("✅ Búsqueda 'test': " + resultados.length + " resultados");
    
    // Test 5: Crear Cotización
    Logger.log("\n--- Test 5: Crear Cotización ---");
    var cotizacion = Cotizacion.create({
      ID_Cliente: cliente.ID_Cliente,
      Cant_Personas: 10
    });
    Logger.log("✅ Cotización creada: " + cotizacion.ID_Cotizacion);
    Logger.log("   Estado: " + cotizacion.Estado);
    Logger.log("   Fecha: " + cotizacion.Fecha_Emision);
    
    // Test 6: Guardar Detalle
    Logger.log("\n--- Test 6: Guardar Detalle ---");
    var carrito = [
      {
        nombre: "Test Item 1",
        fecha: "2025-02-15",
        hora: "10:00",
        cantidad: 10,
        precio: 5000,
        total: 50000
      },
      {
        nombre: "Test Item 2",
        fecha: "2025-02-15",
        hora: "14:00",
        cantidad: 10,
        precio: 8000,
        total: 80000
      }
    ];
    
    var detalles = DetalleCotizacion.insertBatch(cotizacion.ID_Cotizacion, carrito);
    Logger.log("✅ Detalle guardado: " + detalles.length + " líneas");
    
    // Test 7: Leer Cotización Completa
    Logger.log("\n--- Test 7: Leer Cotización Completa ---");
    var cotCompleta = Cotizacion.getConDetalle(cotizacion.ID_Cotizacion);
    Logger.log("✅ Cotización leída:");
    Logger.log("   Cliente: " + cotCompleta.cliente.Nombre_Empresa);
    Logger.log("   Detalles: " + cotCompleta.detalles.length + " líneas");
    Logger.log("   Total: $" + cotCompleta.Total_Neto);
    
    // Test 8: Marcar como enviada
    Logger.log("\n--- Test 8: Marcar como Enviada ---");
    Cotizacion.marcarEnviada(cotizacion.ID_Cotizacion, "http://test.pdf", 130000);
    var actualizada = Cotizacion.find(cotizacion.ID_Cotizacion);
    Logger.log("✅ Estado actualizado: " + actualizada.Estado);
    Logger.log("   Total actualizado: $" + actualizada.Total_Neto);
    
    Logger.log("\n========== ✅ TODOS LOS TESTS PASARON ==========");
    
    return {
      success: true,
      cliente: cliente,
      cotizacion: actualizada
    };
    
  } catch (e) {
    Logger.log("\n========== ❌ ERROR EN TESTS ==========");
    Logger.log("❌ ERROR: " + e.message);
    Logger.log(e.stack);
    return {
      success: false,
      error: e.message
    };
  }
}

function limpiarDatosPrueba() {
  Logger.log("========== LIMPIANDO DATOS DE PRUEBA ==========");
  
  try {
    var cliente = Cliente.findByRUT("76543210-9");
    
    if (cliente) {
      Logger.log("Cliente encontrado: " + cliente.ID_Cliente);
      
      // Buscar sus cotizaciones
      var cotizaciones = Cliente.getCotizaciones(cliente.ID_Cliente);
      Logger.log("Cotizaciones del cliente: " + cotizaciones.length);
      
      // Eliminar detalles de cada cotización
      for (var i = 0; i < cotizaciones.length; i++) {
        DetalleCotizacion.deleteByCotizacion(cotizaciones[i].ID_Cotizacion);
        Logger.log("  Detalles eliminados de: " + cotizaciones[i].ID_Cotizacion);
      }
      
      // Eliminar cotizaciones (en orden inverso de rowIndex)
      cotizaciones.sort(function(a, b) {
        return b._rowIndex - a._rowIndex;
      });
      
      var dbCot = new SheetDB(DB_CONFIG.TABLES.COTIZACIONES);
      for (var i = 0; i < cotizaciones.length; i++) {
        dbCot.deleteRow(cotizaciones[i]._rowIndex);
      }
      Logger.log("✅ Cotizaciones eliminadas");
      
      // Eliminar cliente
      var dbCli = new SheetDB(DB_CONFIG.TABLES.CLIENTES);
      dbCli.deleteRow(cliente._rowIndex);
      Logger.log("✅ Cliente eliminado");
    } else {
      Logger.log("No hay cliente de prueba para eliminar");
    }
    
    Logger.log("\n========== ✅ LIMPIEZA COMPLETA ==========");
    
  } catch (e) {
    Logger.log("❌ ERROR EN LIMPIEZA: " + e.message);
    Logger.log(e.stack);
  }
}

function testBusquedaCliente() {
  Logger.log("========== TEST BÚSQUEDA CLIENTE ==========");
  
  try {
    // Test 1: Buscar por nombre
    var resultados1 = buscarCliente("Test");
    Logger.log("Búsqueda por 'Test': " + resultados1.length + " resultados");
    if (resultados1.length > 0) {
      Logger.log("Primer resultado: " + JSON.stringify(resultados1[0]));
    }
    
    // Test 2: Buscar por RUT
    var resultados2 = buscarCliente("12345678-9");
    Logger.log("Búsqueda por RUT: " + resultados2.length + " resultados");
    if (resultados2.length > 0) {
      Logger.log("Resultado: " + JSON.stringify(resultados2[0]));
    }
    
    // Test 3: Listar todos
    var todos = Cliente.all();
    Logger.log("Total clientes en BD: " + todos.length);
    
  } catch (e) {
    Logger.log("❌ ERROR: " + e.message);
    Logger.log(e.stack);
  }
}