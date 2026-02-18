/**
 * ============================================
 * MICROORM PARA GOOGLE SHEETS
 * Capa de abstracción para operaciones CRUD
 * ============================================
 */

// ============================================
// CLASE: SheetDB (Acceso directo a Sheets)
// ============================================

var SheetDB = (function() {
  
  function SheetDB(sheetName) {
    this.ss = SpreadsheetApp.openById(DB_CONFIG.SHEET_ID);
    this.sheet = this.ss.getSheetByName(sheetName);
    
    if (!this.sheet) {
      throw new Error('❌ Sheet "' + sheetName + '" no existe. Verifica el nombre.');
    }
    
    this.sheetName = sheetName;
    this._headers = null;
    this._headersMap = null;
  }
  
  /**
   * Obtiene los headers (fila 1) mapeados a índices
   */
  SheetDB.prototype.getHeaders = function() {
    if (this._headers) return this._headers;
    
    var lastCol = this.sheet.getLastColumn();
    if (lastCol === 0) {
      throw new Error('❌ La hoja "' + this.sheetName + '" está vacía');
    }
    
    this._headers = this.sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    return this._headers;
  };
  
  /**
   * Obtiene mapa de headers {nombre: indice}
   */
  SheetDB.prototype.getHeadersMap = function() {
    if (this._headersMap) return this._headersMap;
    
    var headers = this.getHeaders();
    this._headersMap = {};
    
    for (var i = 0; i < headers.length; i++) {
      if (headers[i]) {
        this._headersMap[headers[i]] = i;
      }
    }
    
    return this._headersMap;
  };
  
  /**
   * Convierte una fila de array a objeto
   */
  SheetDB.prototype.rowToObject = function(row, rowIndex) {
    var headers = this.getHeaders();
    var obj = { _rowIndex: rowIndex };
    
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    
    return obj;
  };
  
  /**
   * Convierte objeto a array basado en headers
   */
  SheetDB.prototype.objectToRow = function(obj) {
    var headers = this.getHeaders();
    var headersMap = this.getHeadersMap();
    var row = [];
    
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      row.push(obj[header] !== undefined ? obj[header] : '');
    }
    
    return row;
  };
  
  /**
   * SELECT ALL
   */
  SheetDB.prototype.all = function() {
    var lastRow = this.sheet.getLastRow();
    
    if (lastRow <= 1) return []; // Solo headers o vacío
    
    var lastCol = this.sheet.getLastColumn();
    var data = this.sheet.getRange(1, 1, lastRow, lastCol).getValues();
    
    var headers = data[0];
    var rows = data.slice(1);
    
    var results = [];
    for (var i = 0; i < rows.length; i++) {
      results.push(this.rowToObject(rows[i], i + 2)); // +2 porque fila 1 es header
    }
    
    return results;
  };
  
  /**
   * SELECT WHERE
   */
  SheetDB.prototype.where = function(predicate) {
    return this.all().filter(predicate);
  };
  
  /**
   * FIND ONE
   */
  SheetDB.prototype.find = function(predicate) {
    var results = this.where(predicate);
    return results.length > 0 ? results[0] : null;
  };
  
  /**
   * INSERT
   */
  SheetDB.prototype.insert = function(data) {
    var row = this.objectToRow(data);
    this.sheet.appendRow(row);
    
    var lastRow = this.sheet.getLastRow();
    data._rowIndex = lastRow;
    
    return data;
  };
  
  /**
   * UPDATE (requiere _rowIndex)
   */
  SheetDB.prototype.update = function(data) {
    if (!data._rowIndex) {
      throw new Error('❌ Update requiere _rowIndex del registro');
    }
    
    var row = this.objectToRow(data);
    var headers = this.getHeaders();
    
    this.sheet.getRange(data._rowIndex, 1, 1, headers.length).setValues([row]);
    
    return data;
  };
  
  /**
   * DELETE (por rowIndex)
   */
  SheetDB.prototype.deleteRow = function(rowIndex) {
    this.sheet.deleteRow(rowIndex);
  };
  
  /**
   * TRUNCATE (elimina todo excepto headers)
   */
  SheetDB.prototype.truncate = function() {
    var lastRow = this.sheet.getLastRow();
    if (lastRow > 1) {
      this.sheet.deleteRows(2, lastRow - 1);
    }
  };
  
  return SheetDB;
})();

// ============================================
// HELPERS GLOBALES
// ============================================

/**
 * Genera ID auto-incremental con prefijo
 */
function generarID(prefix, tableName) {
  var db = new SheetDB(tableName);
  var records = db.all();
  var numero = records.length + 1;
  
  return prefix + '-' + String(numero).padStart(4, '0');
}

/**
 * Timestamp actual en formato ISO
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Fecha en formato chileno
 */
function formatFecha(date) {
  if (!date) date = new Date();
  return date.toLocaleDateString('es-CL');
}

/**
 * Validar RUT chileno
 */
function validarRUT(rut) {
  if (!rut) return false;
  var pattern = /^\d{7,8}-[\dkK]$/;
  return pattern.test(rut);
}