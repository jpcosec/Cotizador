// Archivo: src/Config/Config_Schema.js
// Versión: 3.2.0 (Input-only transactional + runtime calculation + JSON cache)
// FUENTE DE VERDAD para estructura de datos del sistema.
//
// Principios:
// - LINEA_DETALLE es tabla de inputs, no de resultados.
// - Los cálculos se hacen en runtime y se cachean como JSON snapshot.
// - No se borra data: toda modificación reescribe con Updated_At.
// - Impuestos se aplican siempre al total, no por línea.

// TODO: move to database module

export const DATA_SCHEMA = {

  // ==========================================
  // BLOQUE 1: MASTER DATA (Configuración)
  // ==========================================

  CLIENTES: {
    description: "Base de datos de clientes.",
    columns: [
      { name: "ID_Cliente", type: "PK", desc: "Identificador" },
      { name: "Nombre_Empresa", type: "TEXT", desc: "Razón Social" },
      { name: "RUT", type: "TEXT", desc: "Identificador Fiscal" },
      { name: "Email", type: "TEXT", desc: "Contacto Principal" },
      { name: "Telefono", type: "TEXT", desc: "Contacto" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  CATEGORIAS: {
    description: "Configurador de dimensiones de pricing y defaults de UI por tipo de ítem.",
    columns: [
      { name: "ID_Categoria", type: "PK", desc: "Identificador categoría" },
      { name: "Nombre", type: "TEXT", desc: "Nombre visible" },
      { name: "ID_Perfil_Precio_Default", type: "FK", ref: "PERFILES_PRECIO", desc: "Perfil de precio base heredable" },
      { name: "Def_Requiere_Pax", type: "BOOLEAN", desc: "Pricing depende de pax (P)" },
      { name: "Def_Requiere_Cant", type: "BOOLEAN", desc: "Pricing depende de cantidad (Q)" },
      { name: "Def_Requiere_Tiempo", type: "BOOLEAN", desc: "Pricing depende de tiempo (T)" },
      { name: "Def_Requiere_Hora", type: "BOOLEAN", desc: "UI: mostrar selectores de hora" },
      { name: "Def_Duracion_Min", type: "INTEGER", desc: "Duración default en minutos" },
      { name: "Def_Unidades_Por_Pax", type: "DECIMAL", desc: "Calculador default: unidades por pax (ej: 0.33 = 1 cada 3)" },
      { name: "Icono_UI", type: "TEXT", desc: "Nombre de icono para UI" },
      { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  ITEM_CATALOGO: {
    description: "Inventario vendible. Hereda dimensiones de categoría, permite override de precio y calculador.",
    columns: [
      { name: "ID_Item", type: "PK", desc: "SKU único" },
      { name: "Nombre", type: "TEXT", desc: "Nombre comercial" },
      { name: "ID_Categoria", type: "FK", ref: "CATEGORIAS", desc: "Categoría base" },
      { name: "ID_Perfil_Precio_Override", type: "FK", ref: "PERFILES_PRECIO", desc: "Override de perfil de precio (si vacío, hereda de categoría)" },
      { name: "Def_Unidades_Por_Pax_Override", type: "DECIMAL", desc: "Override del calculador unidades/pax" },
      { name: "Default_Glosa", type: "TEXT", desc: "Descripción/comentario por defecto del ítem" },
      { name: "Activo", type: "BOOLEAN", desc: "Borrado lógico" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  PERFILES_PRECIO: {
    description: "Componentes base de precio. Fórmula: Neto = Base + (P * Cp) + (T * Ct) + (Q * Cq).",
    columns: [
      { name: "ID_Perfil_Precio", type: "PK", desc: "Identificador del perfil" },
      { name: "Nombre", type: "TEXT", desc: "Nombre legible (ej: Salon Base 4h)" },
      { name: "Costo_Base_Fijo", type: "MONEY", desc: "Base fija" },
      { name: "Costo_Unitario_Pax", type: "MONEY", desc: "Costo por pax" },
      { name: "Costo_Unitario_Tiempo", type: "MONEY", desc: "Costo por minuto/hora" },
      { name: "Costo_Unitario_Item", type: "MONEY", desc: "Costo por unidad/cantidad" },
      { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  COMPOSICION_KIT: {
    description: "Estructura recursiva Padre-Hijo para packs/kits.",
    columns: [
      { name: "ID_Composicion", type: "PK", desc: "ID relación" },
      { name: "ID_Item_Padre", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem comercial (pack/kit)" },
      { name: "ID_Item_Hijo", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem operativo" },
      { name: "Cantidad", type: "DECIMAL", desc: "Multiplicador" },
      { name: "Tipo_Precio", type: "ENUM", options: ["ABSORBIDO", "SUMAR"], desc: "Cómo contribuye al precio" }, // TODO: DELETE THIS: all kits have no self price, their price is calculated from its childs.
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  REGLAS_NEGOCIO: {
    description: "Motor unificado de reglas por etapa. Cubre defaults de cantidad, restricciones, ajustes, sobreturno e impuestos.",
    columns: [
      { name: "ID_Regla", type: "PK", desc: "Identificador único" },
      { name: "Nombre", type: "TEXT", desc: "Nombre legible de la regla" },
      { name: "Etapa", type: "ENUM", options: ["CANTIDAD_DEFAULT", "RESTRICCION_UI", "AJUSTE_LINEA", "AJUSTE_GLOBAL", "IMPUESTO"], desc: "Fase del pipeline" },
      { name: "Scope", type: "ENUM", options: ["LINEA", "ITEM", "CATEGORIA", "COTIZACION", "CLIENTE", "COMPOSICION"], desc: "Alcance de aplicación" },
      { name: "Tipo_Accion", type: "ENUM", options: ["SET_VALUE", "MULTIPLY", "ADD_FIXED", "ADD_ITEM", "INVALIDATE_BASKET", "WARNING", "ERROR", "SET_TAX", "SET_DEFAULT"], desc: "Acción ejecutable" },
      { name: "Hook", type: "ENUM", options: ["pre_execution", "execute", "post_execution", null], desc: "Lifecycle hook filter (null = any)" },
      { name: "Condicion_JSON", type: "JSON", desc: "Predicado para activar la regla" },
      { name: "Payload_JSON", type: "JSON", desc: "Parámetros para ejecutar la acción" },
      { name: "Prioridad", type: "INTEGER", desc: "Orden de ejecución en su etapa" },
      { name: "Acumulable", type: "BOOLEAN", desc: "Si puede combinarse con otras reglas" },
      { name: "Activo", type: "BOOLEAN", desc: "Vigencia" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  // ==========================================
  // BLOQUE 2: TRANSACTIONAL DATA (Operación)
  // ==========================================

  COTIZACIONES: {
    description: "Encabezados de venta. Sin campos calculados — los totales se computan en runtime.",
    columns: [
      { name: "ID_Cotizacion", type: "PK", desc: "Folio" },
      { name: "ID_Cliente", type: "FK", ref: "CLIENTES", desc: "Cliente" },
      { name: "Estado", type: "ENUM", options: ["Borrador", "Enviada", "Pendiente_Aprobacion", "Aprobada", "Finalizada"], desc: "Workflow" },
      { name: "Fecha_Evento", type: "DATE", desc: "Inicio del evento" },
      { name: "Duracion_Dias", type: "INTEGER", desc: "Duración global" },
      { name: "Pax_Global", type: "INTEGER", desc: "Pax base" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  LINEA_DETALLE: {
    description: "Inputs de venta. Solo datos de entrada y overrides del usuario. Sin cálculos.",
    columns: [
      { name: "ID_Linea", type: "PK", desc: "ID único" },
      { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Cotización padre" },
      { name: "ID_Item", type: "FK", ref: "ITEM_CATALOGO", desc: "Ítem de catálogo" },
      { name: "Estado_Linea", type: "ENUM", options: ["ACTIVA", "REMOVIDA"], desc: "Estado de ciclo de vida; no se elimina historial" },
      { name: "Dia_Numero", type: "INTEGER", desc: "Día relativo (1..N)" },
      { name: "Hora_Inicio", type: "TIME", desc: "Inicio servicio (si aplica)" },
      { name: "Override_Pax", type: "INTEGER", desc: "Pax override por usuario (nullable, si vacío usa global)" },
      { name: "Override_Cantidad", type: "DECIMAL", desc: "Cantidad override por usuario (nullable, si vacío usa calculador)" },
      { name: "Override_Duracion_Min", type: "INTEGER", desc: "Duración override en minutos (nullable, si vacío usa default)" },
      { name: "Comentarios", type: "TEXT", desc: "Observaciones/justificación" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  AJUSTES_COTIZACION: {
    description: "Intervenciones manuales del usuario sobre los cálculos automáticos. Traza de 'el sistema dijo X, el usuario cambió a Y'.",
    columns: [
      { name: "ID_Ajuste", type: "PK", desc: "Identificador" },
      { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Cotización afectada" },
      { name: "ID_Linea", type: "FK", ref: "LINEA_DETALLE", desc: "Línea afectada (nullable para ajustes globales)" },
      { name: "Tipo_Ajuste", type: "ENUM", options: ["OVERRIDE_PRECIO", "OVERRIDE_PAX", "OVERRIDE_CANTIDAD", "OVERRIDE_DURACION", "DESCUENTO_LINEA", "DESCUENTO_GLOBAL", "RECARGO"], desc: "Tipo de intervención" },
      { name: "Valor_Original", type: "MONEY", desc: "Lo que calculó el sistema" },
      { name: "Valor_Nuevo", type: "MONEY", desc: "Lo que el usuario puso" },
      { name: "Motivo", type: "TEXT", desc: "Justificación del cambio" },
      { name: "Usuario", type: "TEXT", desc: "Quién hizo el ajuste" },
      { name: "Updated_At", type: "DATETIME", desc: "Última modificación" }
    ]
  },

  // ==========================================
  // BLOQUE 3: CACHE Y AUDITORÍA
  // ==========================================

  CACHE_COTIZACION: {
    description: "JSON snapshot de resultados calculados. Regenerable en cualquier momento. Consumido por frontend.",
    columns: [
      { name: "ID_Cotizacion", type: "PK/FK", ref: "COTIZACIONES", desc: "1:1 con cotización" },
      { name: "Snapshot_JSON", type: "JSON", desc: "Resultado completo: líneas con precios, subtotales, impuestos, totales, reglas aplicadas" },
      { name: "Updated_At", type: "DATETIME", desc: "Última regeneración" }
    ]
  },

  HISTORIAL_COTIZACION: {
    description: "Auditoría de cambios.",
    columns: [
      { name: "ID_Log", type: "PK", desc: "ID evento" },
      { name: "ID_Cotizacion", type: "FK", ref: "COTIZACIONES", desc: "Target" },
      { name: "Timestamp", type: "DATETIME", desc: "Cuándo" },
      { name: "Usuario", type: "TEXT", desc: "Quién" },
      { name: "Accion", type: "TEXT", desc: "Qué hizo" },
      { name: "Detalle_Cambio", type: "JSON", desc: "Valores ant/nue" }
    ]
  }
};
