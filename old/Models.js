/**
 * ============================================
 * MODELOS DE NEGOCIO
 * Cada modelo representa una tabla del Sheet
 * ============================================
 */

// ============================================
// MODELO: Cliente
// ============================================

var Cliente = {
  
  tableName: DB_CONFIG.TABLES.CLIENTES,
  
  /**
   * Listar todos los clientes
   */
  all: function() {
    var db = new SheetDB(this.tableName);
    return db.all();
  },
  
  /**
   * Buscar por ID
   */
  find: function(id) {
    var db = new SheetDB(this.tableName);
    return db.find(function(cliente) {
      return cliente.ID_Cliente === id;
    });
  },
  
  /**
   * Buscar por RUT
   */
  findByRUT: function(rut) {
    var db = new SheetDB(this.tableName);
    return db.find(function(cliente) {
      return cliente.RUT === rut;
    });
  },
  
  /**
   * Búsqueda por nombre (fuzzy)
   */
  search: function(query) {
    var db = new SheetDB(this.tableName);
    var todos = db.all();
    var q = query.toLowerCase();
    
    return todos.filter(function(cliente) {
      return cliente.Nombre_Empresa && 
             cliente.Nombre_Empresa.toLowerCase().indexOf(q) !== -1;
    });
  },
  
  /**
   * Crear nuevo cliente
   */
  create: function(data) {
    // Validar
    var errors = this.validate(data);
    if (errors) {
      throw new Error(errors.join(', '));
    }
    
    // Generar ID
    if (!data.ID_Cliente) {
      data.ID_Cliente = generarID('CLI', this.tableName);
    }
    
    // Insertar
    var db = new SheetDB(this.tableName);
    return db.insert(data);
  },
  
  /**
   * Actualizar cliente
   */
  update: function(data) {
    if (!data._rowIndex) {
      throw new Error('❌ Se requiere _rowIndex para actualizar');
    }
    
    var db = new SheetDB(this.tableName);
    return db.update(data);
  },
  
  /**
   * Obtener cotizaciones del cliente
   */
  getCotizaciones: function(idCliente) {
    return Cotizacion.findByCliente(idCliente);
  },
  
  /**
   * Validación de datos
   */
  validate: function(data) {
    var errors = [];
    
    if (!data.Nombre_Empresa) {
      errors.push("Nombre de empresa es requerido");
    }
    
    if (!data.RUT) {
      errors.push("RUT es requerido");
    }
    
    // Validar formato RUT
    if (data.RUT && !validarRUT(data.RUT)) {
      errors.push("RUT inválido (formato: 12345678-9)");
    }
    
    // Verificar duplicados
    if (data.RUT) {
      var existe = this.findByRUT(data.RUT);
      if (existe && existe.ID_Cliente !== data.ID_Cliente) {
        errors.push("Ya existe un cliente con este RUT");
      }
    }
    
    return errors.length > 0 ? errors : null;
  }
};

// ============================================
// MODELO: Cotización
// ============================================

var Cotizacion = {
  
  tableName: DB_CONFIG.TABLES.COTIZACIONES,
  
  /**
   * Crear nueva cotización
   */
  create: function(data) {
    // Generar ID
    if (!data.ID_Cotizacion) {
      data.ID_Cotizacion = generarID('COT', this.tableName);
    }
    
    // Defaults
    if (!data.Fecha_Emision) {
      data.Fecha_Emision = formatFecha();
    }
    if (!data.Estado) {
      data.Estado = 'Borrador';
    }
    if (!data.Total_Neto) {
      data.Total_Neto = 0;
    }
    if (!data.Cant_Personas) {
      data.Cant_Personas = 1;
    }
    if (!data.Link_PDF) {
      data.Link_PDF = '';
    }
    
    // Insertar
    var db = new SheetDB(this.tableName);
    return db.insert(data);
  },
  
  /**
   * Buscar por ID
   */
  find: function(id) {
    var db = new SheetDB(this.tableName);
    return db.find(function(cot) {
      return cot.ID_Cotizacion === id;
    });
  },
  
  /**
   * Buscar por cliente
   */
/**
   * Buscar por cliente
   */
  findByCliente: function(idCliente) {
    var db = new SheetDB(this.tableName);
    var cotizaciones = db.where(function(cot) {
      return cot.ID_Cliente === idCliente;
    });
    
    // Ordenar por fecha descendente (con validación)
    return cotizaciones.sort(function(a, b) {
      var fechaA = a.Fecha_Emision || '';
      var fechaB = b.Fecha_Emision || '';
      
      // Convertir a string por si acaso
      fechaA = String(fechaA);
      fechaB = String(fechaB);
      
      // Comparación segura
      if (fechaB < fechaA) return -1;
      if (fechaB > fechaA) return 1;
      return 0;
    });
  },
  
  /**
   * Obtener cotización CON detalle (eager loading)
   */
  getConDetalle: function(idCotizacion) {
    var cotizacion = this.find(idCotizacion);
    if (!cotizacion) return null;
    
    // Cargar detalles
    cotizacion.detalles = DetalleCotizacion.getByCotizacion(idCotizacion);
    
    // Cargar cliente
    cotizacion.cliente = Cliente.find(cotizacion.ID_Cliente);
    
    return cotizacion;
  },
  
  /**
   * Marcar como enviada
   */
  marcarEnviada: function(idCotizacion, linkPdf, totalNeto) {
    var cotizacion = this.find(idCotizacion);
    if (!cotizacion) {
      throw new Error('Cotización no encontrada: ' + idCotizacion);
    }
    
    cotizacion.Estado = 'Enviada';
    cotizacion.Link_PDF = linkPdf;
    cotizacion.Total_Neto = totalNeto;
    
    var db = new SheetDB(this.tableName);
    return db.update(cotizacion);
  },
  
  /**
   * Obtener solo borradores
   */
  borradores: function() {
    var db = new SheetDB(this.tableName);
    return db.where(function(cot) {
      return cot.Estado === 'Borrador';
    });
  },
  
  /**
   * Listar últimas N cotizaciones
   */
 /**
   * Listar últimas N cotizaciones
   */
  ultimas: function(limite) {
    limite = limite || 10;
    var db = new SheetDB(this.tableName);
    var todas = db.all();
    
    // Ordenar por fecha descendente (con validación)
    todas.sort(function(a, b) {
      var fechaA = a.Fecha_Emision || '';
      var fechaB = b.Fecha_Emision || '';
      
      // Convertir a string
      fechaA = String(fechaA);
      fechaB = String(fechaB);
      
      if (fechaB < fechaA) return -1;
      if (fechaB > fechaA) return 1;
      return 0;
    });
    
    return todas.slice(0, limite);
  }
};

// ============================================
// MODELO: Detalle Cotización
// ============================================
// ============================================
// MODELO: Detalle Cotización
// ============================================

var DetalleCotizacion = {
  
  tableName: DB_CONFIG.TABLES.DETALLE,
  
  /**
   * Insertar múltiples líneas (batch)
   */
  insertBatch: function(idCotizacion, lineas) {
    var db = new SheetDB(this.tableName);
    var insertados = [];
    
    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i];
      var data = {
        ID: this._generateID(),
        ID_Cotizacion: idCotizacion,
        Item: linea.nombre,
        Timestamp_Evento: linea.fecha + ' ' + linea.hora,
        Cantidad: linea.cantidad,
        Precio_Unitario_Aplicado: linea.precio,
        Total_Linea: linea.total
      };
      
      insertados.push(db.insert(data));
    }
    
    return insertados;
  },
  
  /**
   * Obtener detalle por cotización
   */
  getByCotizacion: function(idCotizacion) {
    var db = new SheetDB(this.tableName);
    var detalles = db.where(function(det) {
      return det.ID_Cotizacion === idCotizacion;
    });
    
    // Ordenar por timestamp (con validación)
    return detalles.sort(function(a, b) {
      var tsA = a.Timestamp_Evento || '';
      var tsB = b.Timestamp_Evento || '';
      
      // Convertir a string por si acaso
      tsA = String(tsA);
      tsB = String(tsB);
      
      if (tsA < tsB) return -1;
      if (tsA > tsB) return 1;
      return 0;
    });
  },
  
  /**
   * Eliminar todos los detalles de una cotización
   */
  deleteByCotizacion: function(idCotizacion) {
    var db = new SheetDB(this.tableName);
    var detalles = this.getByCotizacion(idCotizacion);
    
    // Ordenar por rowIndex descendente para evitar problemas al eliminar
    detalles.sort(function(a, b) {
      return b._rowIndex - a._rowIndex;
    });
    
    for (var i = 0; i < detalles.length; i++) {
      db.deleteRow(detalles[i]._rowIndex);
    }
  },
  
  /**
   * Generar ID único
   */
  _generateID: function() {
    var timestamp = new Date().getTime();
    var random = Math.floor(Math.random() * 1000);
    return 'DET-' + timestamp + '-' + random;
  }
};

// ============================================
// MODELO: Item (Catálogo)
// ============================================

var Item = {
  
  tableName: DB_CONFIG.TABLES.ITEMS,
  
  /**
   * Obtener catálogo procesado
   */
  getCatalogo: function() {
    var db = new SheetDB(this.tableName);
    var items = db.all();
    var self = this;
    
    var catalogo = [];
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      
      var precio = self._limpiarPrecio(item['Valor Original']) ||
                   self._limpiarPrecio(item['Valor por persona']) ||
                   self._limpiarPrecio(item['Valor Fijo']) ||
                   0;
      
      if (item.Item && precio > 0) {
        catalogo.push({
          categoria: item.Categoria || 'General',
          nombre: item.Item,
          precio: precio,
          detalle: item['Detalle de servicios'] || '',
          horario: item.Horario || ''
        });
      }
    }
    
    return catalogo;
  },
  
  /**
   * Buscar item por nombre
   */
  findByNombre: function(nombre) {
    var db = new SheetDB(this.tableName);
    return db.find(function(item) {
      return item.Item === nombre;
    });
  },
  
  /**
   * Obtener items por categoría
   */
  getByCategoria: function(categoria) {
    var catalogo = this.getCatalogo();
    return catalogo.filter(function(item) {
      return item.categoria === categoria;
    });
  },
  
  /**
   * Limpiar precio (tu lógica existente)
   */
  _limpiarPrecio: function(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    
    try {
      var texto = valor.toString();
      if (texto.indexOf('+') !== -1) {
        texto = texto.split('+')[0];
      }
      var limpio = texto.replace(/[^0-9]/g, '');
      return parseInt(limpio) || 0;
    } catch (e) {
      return 0;
    }
  }
};