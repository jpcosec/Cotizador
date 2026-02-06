/**
 * ============================================
 * API FUNCTIONS (ROUTER)
 * ============================================
 */

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() { 
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cotizador SF Lodge')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getCatalogo() {
  return Item.getCatalogo();
}

function buscarCliente(query) {
  try {
    var cliente = Cliente.findByRUT(query);
    if (cliente) return [cliente];
    return Cliente.search(query);
  } catch (e) { return []; }
}

function crearOObtenerCliente(datos) {
  // Lógica de ayuda para normalizar datos antes de llamar al modelo
  // ... (puedes mantener la lógica de validación aquí o importarla del controlador)
  // Para simplificar, la dejaré en el controller y haremos que controller use Models directos
  // Pero como el frontend llama a esta para crear clientes sueltos:
  try {
     var rut = datos.rut || datos.RUT;
     var nombre = datos.nombre || datos.Nombre_Empresa;
     if (!rut || !nombre) throw new Error("Faltan datos");
     
     var c = Cliente.findByRUT(rut);
     if (!c) {
       c = Cliente.create({
         Nombre_Empresa: String(nombre),
         RUT: String(rut),
         Contacto: String(datos.contacto || ''),
         Email: String(datos.email || ''),
         Telefono: String(datos.telefono || '')
       });
     }
     return c;
  } catch(e) { throw e; }
}

// === NUEVAS FUNCIONES EXPUESTAS ===

function guardarCotizacion(datosCliente, carrito) {
  return servicioGuardarCotizacion(datosCliente, carrito);
}

function cargarCotizacion(idCotizacion) {
  return servicioCargarCotizacion(idCotizacion);
}

function generarPDF(idCotizacion) {
  return servicioGenerarPDF(idCotizacion);
}