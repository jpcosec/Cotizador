// Archivo: src/Config/Config_Schema.js
// Versión: 3.0.1 (Lógica de Cantidad Desacoplada + Override por capas + Sobreturno)

export const DATA_SCHEMA = {
  
  // ==========================================
  // BLOQUE 1: MASTER DATA (Configuración)
  // ==========================================

  REGLAS_CALCULO_CANTIDAD: {
    description: "Motor de estimación de cantidades (defaults inteligentes).",
    columns: [
      { name: "ID_Regla_Cant", type: "PK", desc: "Identificador (ej: CANT-VINO)" },
      { name: "Nombre", type: "TEXT", desc: "Descripción (ej: 1 botella cada 3 pax)" },
      { name: "Modo_Calculo", type: "ENUM", options: ["FIJO", "POR_PAX", "FACTOR_PAX", "POR_TIEMPO"], desc: "Algoritmo" },
      { name: "Factor_Default", type: "DECIMAL", desc: "El número base (ej: 0.33 para 1/3)" }
    ]
  },

  CATEGORIAS: {
    description: "ADN del ítem. Define comportamiento, defaults base (Nivel 1) y restricciones sugeridas.",
    columns: [
      { name: "ID_Categoria", type: "PK", desc: "Identificador (ej: CAT-DJ)" },
      { name: "Nombre", type: "TEXT", desc: "Nombre visible (ej: Audio)" },
      { name: "Comportamiento_Base", type: "ENUM", options: ["SERVICIO", "PRODUCTO", "ESPACIO", "PERSONAL"], desc: "Lógica Core" },
      
      // --- DEFAULTS DE UI ---
      { name: "Def_Requiere_Hora", type: "BOOLEAN", desc: "UI: ¿Mostrar selectores de hora?" },
      { name: "Def_Requiere_Cant", type: "BOOLEAN", desc: "UI: ¿Mostrar input cantidad?" },
      
      // --- DEFAULTS DE NEGOCIO (NIVEL 1) ---
      { name: "Def_Usa_Pax", type: "BOOLEAN", desc: "Logic: ¿Costo depende de pax?" },
      { name: "ID_Regla_Cant_Default", type: "FK", ref: "REGLAS_CALCULO_CANTIDAD", desc: "Regla base de cantidad" },
      { name: "Factor_Cant_Default", type: "DECIMAL", desc: "Factor base de cantidad (si aplica)" },
      { name: "ID_Regla_Precio_Default", type: "FK", ref: "REGLA_PRECIO", desc: "Fórmula de cobro sugerida" },
      { name: "Def_Impuesto_ID", type: "FK", ref: "REGLAS_IMPUESTO", desc: "Impuesto sugerido (ej: IVA)" },
      
      { name: "Def_Duracion_Min", type: "INTEGER", desc: "Minutos default" },
      { name: "Max_Pax_Default", type: "INTEGER", desc: "Capacidad máxima sugerida (ej: salones)" },
      { name: "Icono_UI", type: "TEXT", desc: "Nombre de icono (mdi)" }
    ]
  },

  REGLA_PRECIO: {
    description: "Motor matemático. Desacopla el precio del producto y soporta sobreturno/tiered pricing.",
    columns: [
      { name: "ID_Regla", type: "PK", desc: "ID Fórmula" },
      { name: "Nombre_Formula", type: "TEXT", desc: "Descripción humana" },
      { name: "Costo_Base_Fijo", type: "MONEY", desc: "Costo fijo" },
      { name: "Costo_Unitario_Pax", type: "MONEY", desc: "Costo por persona" },
      { name: "Costo_Unitario_Tiempo", type: "MONEY", desc: "Costo por tiempo (h/d)" },
      { name: "Tiempo_Base_Incluido", type: "INTEGER", desc: "Minutos cubiertos por costo base (ej: 240)" },
      { name: "Costo_Unitario_Tiempo_Extra", type: "MONEY", desc: "Costo por minuto/hora adicional" },
      { name: "Costo_Unitario_Item", type: "MONEY", desc: "Costo por unidad" },
      { name: "Formula_Legible", type: "TEXT", desc: "Explicación visual" }
    ]
  },

  REGLAS_IMPUESTO: {
    description: "Tasas impositivas flexibles.",
    columns: [
      { name: "ID_Impuesto", type: "PK", desc: "ID (ej: IMP-IVA)" },
      { name: "Nombre", type: "TEXT", desc: "Nombre legal" },
      { name: "Tasa", type: "DECIMAL", desc: "Factor (ej: 0.19)" },
      { name: "Activo", type: "BOOLEAN", desc: "Vigencia" }
    ]
  },

  ITEM_CATALOGO: {
    description: "Inventario vendible. Soporta override por ítem (Nivel 2) sobre defaults de categoría.",
    columns: [
      { name: "ID_Item", type: "PK", desc: "SKU único" },
      { name: "Nombre", type: "TEXT", desc: "Nombre comercial" },
      { name: "ID_Categoria", type: "FK", ref: "CATEGORIAS", desc: "Herencia" },
      
      // --- LOGICA DE CANTIDAD (NIVEL 2 - OVERRIDE) ---
      // Si estos campos están vacíos, se usa lo de la CATEGORIA.
      { name: "ID_Regla_Cant_Override", type: "FK", ref: "REGLAS_CALCULO_CANTIDAD", desc: "Regla específica del ítem" },
      { name: "Factor_Cant_Override", type: "DECIMAL", desc: "Factor específico (ej: 0.33)" },

      // --- LOGICA DE PRECIOS (NIVEL 2 - OVERRIDE) ---
      { name: "ID_Regla_Precio", type: "FK", ref: "REGLA_PRECIO", desc: "Fórmula de cobro" },
      { name: "ID_Impuesto", type: "FK", ref: "REGLAS_IMPUESTO", desc: "Override de impuesto" },
      { name: "Precio_Base_Ref", type: "MONEY", desc: "Referencia visual" },
      
      // --- DRIVERS DE CÁLCULO (DEFAULTS) ---
      // Estos valores pre-llenan variables al seleccionar el ítem
      { name: "Default_Cantidad", type: "INTEGER", desc: "Variable 'Q' inicial (ej: 1)" },
      { name: "Default_Duracion_Min", type: "INTEGER", desc: "Variable 'T' inicial en minutos (ej: 240)" },
      { name: "Capacidad_Max_Pax", type: "INTEGER", desc: "Override de capacidad (ej: Salón Chico)" },
      
      // --- PERMISOS DE EDICIÓN (NIVEL 3) ---
      { name: "Permite_Editar_Cantidad", type: "BOOLEAN", desc: "Si usuario puede cambiar 'Q'" },
      { name: "Permite_Editar_Duracion", type: "BOOLEAN", desc: "Si usuario puede cambiar 'T'" },
      { name: "Permite_Override_Pax", type: "BOOLEAN", desc: "Si usuario puede cambiar 'P'" },

      // --- OTROS ---
      { name: "Default_Glosa", type: "TEXT", desc: "Texto sugerido para comentarios" },
      { name: "Activo", type: "BOOLEAN", desc: "Borrado lógico" }
    ]
  },

  COMPOSICION_KIT: {
    description: "Estructura recursiva Padre-Hijo.",
    columns: [
      { name: "ID_Composicion", type: "PK", desc: "ID relación" },
      { name: "ID_Item_Padre", type: "FK", ref: "ITEM_CATALOGO", desc: "El Pack" },
      { name: "ID_Item_Hijo", type: "FK", ref: "ITEM_CATALOGO", desc: "El Componente" },
      { name: "Cantidad", type: "DECIMAL", desc: "Multiplicador" },
      { name: "Tipo_Precio", type: "ENUM", options: ["ABSORBIDO", "SUMAR"], desc: "Estrategia costo" }
    ]
  },

  REGLAS_DESCUENTO: {
    description: "Rebajas automáticas y manuales.",
    columns: [
      { name: "ID_Descuento", type: "PK", desc: "ID único" },
      { name: "Nombre", type: "TEXT", desc: "Etiqueta en cotización" },
      { name: "Origen", type: "ENUM", options: ["SISTEMA", "MANUAL"], desc: "Automático vs Vendedor" },
      { name: "Trigger_Item", type: "FK", ref: "ITEM_CATALOGO", desc: "Gatillador (Sistema)" },
      { name: "Tipo_Calculo", type: "ENUM", options: ["POR_PAX", "FIJO", "PORCENTAJE"], desc: "Matemática" },
      { name: "Valor", type: "MONEY", desc: "Monto/Porcentaje base" },
      { name: "Permite_Editar_Valor", type: "BOOLEAN", desc: "Si vendedor edita monto" },
      { name: "Requiere_Aprobacion", type: "BOOLEAN", desc: "Gatilla flujo admin" },
      { name: "Acumulable", type: "BOOLEAN", desc: "Suma con otros" }
    ]
  },

  RESTRICCION: {
    description: "Reglas de negocio y validaciones.",
    columns: [
      { name: "ID_Restriccion", type: "PK", desc: "ID Regla" },
      { name: "ID_Item_Trigger", type: "FK", ref: "ITEM_CATALOGO", desc: "Si llevas esto..." },
      { name: "Tipo_Restriccion", type: "ENUM", options: ["MIN_PAX", "REQUIERE", "EXCLUYE", "MIN_VENTA"], desc: "Condición" },
      { name: "ID_Item_Target", type: "FK", ref: "ITEM_CATALOGO", desc: "Objetivo" },
      { name: "Valor_Limite", type: "DECIMAL", desc: "Umbral numérico" },
      { name: "Nivel_Severidad", type: "ENUM", options: ["ERROR", "WARNING"], desc: "Bloqueante?" }
    ]
  },
  
  CLIENTES: {
    description: "Base de datos de clientes.",
    columns: [
      { name: "ID_Cliente", type: "PK", desc: "Identificador" },
      { name: "Nombre_Empresa", type: "TEXT", desc: "Razón Social" },
      { name: "RUT", type: "TEXT", desc: "Identificador Fiscal" },
      { name: "Email", type: "TEXT", desc: "Contacto Principal" },
      { name: "Telefono", type: "TEXT", desc: "Contacto" }
    ]
  },

  // ==========================================
  // BLOQUE 2: TRANSACTIONAL DATA (Operación)
  // ==========================================

  COTIZACIONES: {
    description: "Encabezados de venta (Dinámico).",
    columns: [
      { name: "ID_Cotizacion", type: "PK", desc: "Folio" },
      { name: "ID_Cliente", type: "FK", ref: "CLIENTES", desc: "Cliente" },
      { name: "Estado", type: "ENUM", options: ["Borrador", "Enviada", "Pendiente_Aprobacion", "Aprobada", "Finalizada"], desc: "Workflow" },
      { name: "Fecha_Evento", type: "DATE", desc: "Día inicio" },
      { name: "Duracion_Dias", type: "INTEGER", desc: "Extensión evento" },
      { name: "Pax_Global", type: "INTEGER", desc: "Invitados base" },
      { name: "Total_Neto", type: "MONEY", desc: "Suma sin imp" },
      { name: "Total_IVA", type: "MONEY", desc: "IVA calc" },
      { name: "Total_Impuestos_Adic", type: "MONEY", desc: "Otros imp (ILA)" },
      { name: "Total_Final", type: "MONEY", desc: "A pagar" },
      { name: "Desglose_Impuestos", type: "JSON", desc: "Snapshot de impuestos" }
    ]
  },

  LINEA_DETALLE: {
    description: "Items vendidos (Dinámico).",
    columns: [
      { name: "ID_Linea", type: "PK", desc: "ID único" },
      { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Padre" },
      { name: "ID_Item", type: "FK", ref: "ITEM_CATALOGO", desc: "Producto" },
      { name: "Es_Descuento", type: "BOOLEAN", desc: "Flag tipo línea" },
      { name: "ID_Regla_Descuento", type: "FK", ref: "REGLAS_DESCUENTO", desc: "Origen descuento" },
      { name: "Dia_Numero", type: "INTEGER", desc: "Día relativo (1..N)" },
      { name: "Hora_Inicio", type: "TIME", desc: "Inicio servicio" },
      { name: "Hora_Termino", type: "TIME", desc: "Fin servicio" },
      { name: "Input_Cantidad", type: "INTEGER", desc: "Unidades (Editable si Item permite)" },
      { name: "Input_Pax", type: "INTEGER", desc: "Pax línea (Override)" },
      { name: "Precio_Unitario_Calc", type: "MONEY", desc: "Unitario Neto" },
      { name: "Precio_Total_Linea", type: "MONEY", desc: "Final Neto (puede ser negativo)" },
      { name: "Impuesto_Monto", type: "MONEY", desc: "Plata impuestos" },
      { name: "Impuesto_Tasa_Snapshot", type: "DECIMAL", desc: "Tasa usada (ej: 0.19)" },
      { name: "Comentarios", type: "TEXT", desc: "Observaciones/Justificación" },
      { name: "Config_JSON", type: "JSON", desc: "Metadata técnica" }
    ]
  },

  HISTORIAL_COTIZACION: {
    description: "Auditoría de cambios.",
    columns: [
      { name: "ID_Log", type: "PK", desc: "ID Evento" },
      { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Target" },
      { name: "Timestamp", type: "DATETIME", desc: "Cuándo" },
      { name: "Usuario", type: "TEXT", desc: "Quién" },
      { name: "Accion", type: "TEXT", desc: "Qué hizo" },
      { name: "Detalle_Cambio", type: "JSON", desc: "Valores ant/nue" }
    ]
  }
};
