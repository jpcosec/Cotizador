/**
 * ============================================
 * CONTROLADOR DE COTIZACIONES
 * Maneja la lógica de negocio: Guardar, Cargar y PDF
 * ============================================
 */

/**
 * 1. GUARDAR (Solo guarda en Sheets y devuelve el ID)
 */
function servicioGuardarCotizacion(datosCliente, carrito, idExistente) {
  try {
    // A. Gestionar Cliente
    var cliente = crearOObtenerCliente(datosCliente);
    
    // B. Calcular Totales
    var neto = 0;
    for (var i = 0; i < carrito.length; i++) {
      neto += (Number(carrito[i].total) || 0);
    }
    
    // C. Crear Cabecera de Cotización
    var cotizacion = Cotizacion.create({
      ID_Cliente: cliente.ID_Cliente,
      Cant_Personas: carrito[0] ? Number(carrito[0].cantidad) : 1,
      Total_Neto: neto,
      Estado: 'Guardada'
    });
    
    // D. Guardar Detalle (Items)
    // SheetDB insertará esto. Asegurarse que Timestamp_Evento se guarde como string ayuda,
    // pero Sheets a veces lo reconvierte.
    DetalleCotizacion.insertBatch(cotizacion.ID_Cotizacion, carrito);
    
    return {
      success: true,
      id: cotizacion.ID_Cotizacion,
      mensaje: 'Cotización guardada correctamente.'
    };

  } catch (e) {
    Logger.log(e.stack);
    throw new Error('Error al guardar: ' + e.message);
  }
}

/**
 * 2. CARGAR (Lee de Sheets y devuelve formato para AlpineJS)
 */
/**
 * 2. CARGAR (Inteligente: Calcula el número de día relativo)
 */
/**
 * 2. CARGAR (Inteligente: Calcula Día Relativo basado en fechas)
 */
function servicioCargarCotizacion(idCotizacion) {
  try {
    var cot = Cotizacion.getConDetalle(idCotizacion);
    if (!cot) throw new Error("Cotización no encontrada");
    
    var cliente = cot.cliente;
    var detalles = cot.detalles;

    // A. Si no hay items, devolver estructura vacía
    if (!detalles || detalles.length === 0) {
      return { 
        success: true, 
        cliente: cliente, 
        carrito: [], 
        fechaInicio: new Date().toISOString().split('T')[0] // Fallback a hoy
      };
    }

    // B. Normalizar fechas para poder ordenarlas
    detalles.forEach(function(d) {
      // Truco: Sheets devuelve Date o String. Lo unificamos a Objeto Date.
      if (d.Timestamp_Evento instanceof Date) {
        d._fechaObj = d.Timestamp_Evento;
      } else {
        // Fix para strings tipo "2026-02-05 09:00"
        var cleanStr = String(d.Timestamp_Evento || '').replace(/-/g, '/'); 
        d._fechaObj = new Date(cleanStr);
        // Si falló el parseo, usar fecha actual para no romper
        if (isNaN(d._fechaObj.getTime())) d._fechaObj = new Date(); 
      }
    });

    // C. Ordenar cronológicamente (Importante para saber cuál es el Día 1)
    detalles.sort(function(a, b) { return a._fechaObj - b._fechaObj; });

    // D. Determinar la Fecha Base (El día más antiguo es el día de inicio)
    var fechaBase = new Date(detalles[0]._fechaObj);
    fechaBase.setHours(0,0,0,0); // Resetear horas para comparar solo días
    
    // Formatear fecha base para devolverla al frontend (YYYY-MM-DD)
    var yBase = fechaBase.getFullYear();
    var mBase = String(fechaBase.getMonth() + 1).padStart(2, '0');
    var dBase = String(fechaBase.getDate()).padStart(2, '0');
    var fechaInicioStr = yBase + '-' + mBase + '-' + dBase;

    // E. Mapear items calculando su "Día Relativo" (1, 2, 3...)
    var carritoFrontend = detalles.map(function(d) {
      var fechaItem = new Date(d._fechaObj);
      fechaItem.setHours(0,0,0,0);

      // Diferencia en milisegundos
      var diffTime = fechaItem.getTime() - fechaBase.getTime();
      // Convertir a días (redondeando hacia arriba por si acaso)
      var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // El día 1 es diffDays 0, por eso sumamos 1
      var diaRelativo = diffDays + 1; 

      // Formatear Hora y Fecha para los inputs
      var hh = String(d._fechaObj.getHours()).padStart(2, '0');
      var mm = String(d._fechaObj.getMinutes()).padStart(2, '0');
      
      // Reconstruir fecha string YYYY-MM-DD
      var yItem = d._fechaObj.getFullYear();
      var mItem = String(d._fechaObj.getMonth() + 1).padStart(2, '0');
      var dItem = String(d._fechaObj.getDate()).padStart(2, '0');

      return {
        nombre: d.Item,
        categoria: 'Cargado',
        precio: Number(d.Precio_Unitario_Aplicado),
        cantidad: Number(d.Cantidad),
        total: Number(d.Total_Linea),
        fecha: yItem + '-' + mItem + '-' + dItem,
        hora: hh + ':' + mm,
        dia: diaRelativo // ¡AQUÍ ESTÁ LA MAGIA!
      };
    });

    return {
      success: true,
      cliente: cliente,
      carrito: carritoFrontend,
      fechaInicio: fechaInicioStr // Devolvemos la fecha calculada
    };

  } catch (e) {
    Logger.log(e.stack);
    throw new Error('Error al cargar: ' + e.message);
  }
}
/**
 * 3. GENERAR PDF
 */
function servicioGenerarPDF(idCotizacion) {
  try {
    var cot = Cotizacion.find(idCotizacion);
    if (!cot) throw new Error("Cotización no existe. Guárdala primero.");

    var urlPdf = _crearDocumentoFisico(idCotizacion);
    Cotizacion.marcarEnviada(idCotizacion, urlPdf, cot.Total_Neto);
    
    return urlPdf;
  } catch (e) {
    throw new Error('Error generando PDF: ' + e.message);
  }
}

/**
 * FUNCION PRIVADA: Maquetación del PDF
 */
function _crearDocumentoFisico(idCotizacion) {
  var cot = Cotizacion.getConDetalle(idCotizacion);
  var cliente = cot.cliente;
  
  var doc = DocumentApp.create('Cotización ' + cot.ID_Cotizacion + ' - ' + cliente.Nombre_Empresa);
  var body = doc.getBody();
  
  body.setMarginTop(30).setMarginBottom(30).setMarginLeft(40).setMarginRight(40);
  
  // HEADER
  var headerTable = body.appendTable([["SF LODGE - COTIZACIÓN", ""], ["", ""]]);
  headerTable.setBorderWidth(0);
  headerTable.setColumnWidth(0, 250);
  headerTable.setColumnWidth(1, 250);
  
  var cellLodge = headerTable.getCell(1, 0);
  cellLodge.insertParagraph(0, "SF LODGE").setHeading(DocumentApp.ParagraphHeading.HEADING2).setBold(true).setForegroundColor("#2d5a27");
  cellLodge.appendParagraph("San Francisco Lodge & Spa\nLos Andes, Chile\ncontacto@sflodge.cl").setFontSize(9).setForegroundColor("#666666");
  
  var cellClient = headerTable.getCell(1, 1);
  var textCliente = "N° COTIZACIÓN: " + String(cot.ID_Cotizacion) + "\n" +
                    "FECHA: " + String(cot.Fecha_Emision) + "\n" +
                    "CLIENTE: " + String(cliente.Nombre_Empresa).toUpperCase() + "\n" +
                    "RUT: " + String(cliente.RUT) + "\n" +
                    "ATENCIÓN: " + String(cliente.Contacto || '-') + "\n" +
                    "PAX APROX: " + String(cot.Cant_Personas);
  cellClient.insertParagraph(0, textCliente).setFontSize(9).setLineSpacing(1.15);
  cellClient.setBackgroundColor("#f3f3f3").setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(10).setPaddingRight(10);

  body.appendParagraph(""); 

  // DETALLE
  var pDetalle = body.appendParagraph("DETALLE DE SERVICIOS / ITINERARIO");
  pDetalle.setHeading(DocumentApp.ParagraphHeading.HEADING3).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setForegroundColor("#2d5a27");

  var tablaData = [["Fecha/Hora", "Item / Servicio", "Pax", "Valor Unit.", "Total"]];
  
  for (var i = 0; i < cot.detalles.length; i++) {
    var d = cot.detalles[i];
    
    // FORMATO SEGURO DE FECHA PARA PDF
    var fechaStr = String(d.Timestamp_Evento || '-');
    if (d.Timestamp_Evento instanceof Date) {
      // Si es fecha, formatear bonito para el PDF
      var mm = d.Timestamp_Evento.getMonth() + 1;
      var dd = d.Timestamp_Evento.getDate();
      var hh = String(d.Timestamp_Evento.getHours()).padStart(2, '0');
      var min = String(d.Timestamp_Evento.getMinutes()).padStart(2, '0');
      fechaStr = dd + "/" + mm + " " + hh + ":" + min;
    }

    tablaData.push([
      fechaStr, 
      String(d.Item || ''), 
      String(d.Cantidad || '0'), 
      "$" + Number(d.Precio_Unitario_Aplicado).toLocaleString('es-CL'),
      "$" + Number(d.Total_Linea).toLocaleString('es-CL')
    ]);
  }
  
  var tabla = body.appendTable(tablaData);
  tabla.setBorderWidth(1).setBorderColor("#cccccc");
  
  var rowHeader = tabla.getRow(0);
  for (var c = 0; c < rowHeader.getNumCells(); c++) {
    rowHeader.getCell(c).setBackgroundColor("#2d5a27").getChild(0).asParagraph().setForegroundColor("#ffffff").setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  }
  
  try {
    tabla.setColumnWidth(0, 90); tabla.setColumnWidth(1, 180); tabla.setColumnWidth(2, 40); tabla.setColumnWidth(3, 70); tabla.setColumnWidth(4, 80);
  } catch(e) {}

  body.appendParagraph(""); 

  // TOTALES
  var neto = Number(cot.Total_Neto) || 0;
  var iva = Math.round(neto * 0.19);
  var total = neto + iva;
  
  var totalsTable = body.appendTable([
    ["NETO:", "$" + neto.toLocaleString('es-CL')],
    ["IVA (19%):", "$" + iva.toLocaleString('es-CL')],
    ["TOTAL:", "$" + total.toLocaleString('es-CL')]
  ]);
  
  totalsTable.setBorderWidth(0).setWidth(200).setMarginLeft(300);
  
  for (var r = 0; r < totalsTable.getNumRows(); r++) {
    var row = totalsTable.getRow(r);
    row.getCell(0).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    row.getCell(1).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    if (r === 2) {
      row.getCell(1).getChild(0).asParagraph().setBold(true).setForegroundColor("#2d5a27").setFontSize(11);
      row.getCell(1).setBorderTop(1, DocumentApp.BorderStyle.SOLID, "#000000");
    }
  }
  
  doc.saveAndClose();
  var pdf = DriveApp.createFile(doc.getAs(MimeType.PDF));
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdf.getUrl();
}