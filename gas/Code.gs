/**
 * Code.gs - Google Apps Script Backend for Cotizador SF Lodge
 *
 * AUTO-GENERATED from packages/database/src/services/ and src/Config/Config_Schema.js
 * DO NOT EDIT MANUALLY - regenerate via: npm run build:gas
 *
 * This file provides server-side functions that the frontend calls via google.script.run
 * All functions are generated from the service layer for consistency and maintainability.
 * Schema is read directly from src/Config/Config_Schema.js (single source of truth).
 */

// ============================================================================
// SHEET SCHEMA DEFINITIONS (full schema from Config_Schema)
// ============================================================================

const SHEET_SCHEMA = {
  "CLIENTES": {
    "description": "Base de datos de clientes.",
    "columns": [
      {
        "name": "ID_Cliente",
        "type": "PK",
        "desc": "Identificador"
      },
      {
        "name": "Nombre_Empresa",
        "type": "TEXT",
        "desc": "Razón Social"
      },
      {
        "name": "RUT",
        "type": "TEXT",
        "desc": "Identificador Fiscal"
      },
      {
        "name": "Email",
        "type": "TEXT",
        "desc": "Contacto Principal"
      },
      {
        "name": "Telefono",
        "type": "TEXT",
        "desc": "Contacto"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "CATEGORIAS": {
    "description": "Configurador de dimensiones de pricing y defaults de UI por tipo de ítem.",
    "columns": [
      {
        "name": "ID_Categoria",
        "type": "PK",
        "desc": "Identificador categoría"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre visible"
      },
      {
        "name": "ID_Perfil_Precio_Default",
        "type": "FK",
        "ref": "PERFILES_PRECIO",
        "desc": "Perfil de precio base heredable"
      },
      {
        "name": "Def_Requiere_Pax",
        "type": "BOOLEAN",
        "desc": "Pricing depende de pax (P)"
      },
      {
        "name": "Def_Requiere_Cant",
        "type": "BOOLEAN",
        "desc": "Pricing depende de cantidad (Q)"
      },
      {
        "name": "Def_Requiere_Tiempo",
        "type": "BOOLEAN",
        "desc": "Pricing depende de tiempo (T)"
      },
      {
        "name": "Def_Requiere_Hora",
        "type": "BOOLEAN",
        "desc": "UI: mostrar selectores de hora"
      },
      {
        "name": "Def_Duracion_Min",
        "type": "INTEGER",
        "desc": "Duración default en minutos"
      },
      {
        "name": "Def_Unidades_Por_Pax",
        "type": "DECIMAL",
        "desc": "Calculador default: unidades por pax (ej: 0.33 = 1 cada 3)"
      },
      {
        "name": "Icono_UI",
        "type": "TEXT",
        "desc": "Nombre de icono para UI"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Vigencia"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "ITEM_CATALOGO": {
    "description": "Inventario vendible. Hereda dimensiones de categoría, permite override de precio y calculador.",
    "columns": [
      {
        "name": "ID_Item",
        "type": "PK",
        "desc": "SKU único"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre comercial"
      },
      {
        "name": "ID_Categoria",
        "type": "FK",
        "ref": "CATEGORIAS",
        "desc": "Categoría base"
      },
      {
        "name": "ID_Perfil_Precio_Override",
        "type": "FK",
        "ref": "PERFILES_PRECIO",
        "desc": "Override de perfil de precio (si vacío, hereda de categoría)"
      },
      {
        "name": "Def_Unidades_Por_Pax_Override",
        "type": "DECIMAL",
        "desc": "Override del calculador unidades/pax"
      },
      {
        "name": "Default_Glosa",
        "type": "TEXT",
        "desc": "Descripción/comentario por defecto del ítem"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Borrado lógico"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "PERFILES_PRECIO": {
    "description": "Componentes base de precio. Fórmula: Neto = Base + (P * Cp) + (T * Ct) + (Q * Cq).",
    "columns": [
      {
        "name": "ID_Perfil_Precio",
        "type": "PK",
        "desc": "Identificador del perfil"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre legible (ej: Salon Base 4h)"
      },
      {
        "name": "Costo_Base_Fijo",
        "type": "MONEY",
        "desc": "Base fija"
      },
      {
        "name": "Costo_Unitario_Pax",
        "type": "MONEY",
        "desc": "Costo por pax"
      },
      {
        "name": "Costo_Unitario_Tiempo",
        "type": "MONEY",
        "desc": "Costo por minuto/hora"
      },
      {
        "name": "Costo_Unitario_Item",
        "type": "MONEY",
        "desc": "Costo por unidad/cantidad"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Vigencia"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "COMPOSICION_KIT": {
    "description": "Estructura recursiva Padre-Hijo para packs/kits.",
    "columns": [
      {
        "name": "ID_Composicion",
        "type": "PK",
        "desc": "ID relación"
      },
      {
        "name": "ID_Item_Padre",
        "type": "FK",
        "ref": "ITEM_CATALOGO",
        "desc": "Ítem comercial (pack/kit)"
      },
      {
        "name": "ID_Item_Hijo",
        "type": "FK",
        "ref": "ITEM_CATALOGO",
        "desc": "Ítem operativo"
      },
      {
        "name": "Cantidad",
        "type": "DECIMAL",
        "desc": "Multiplicador"
      },
      {
        "name": "Tipo_Precio",
        "type": "ENUM",
        "options": [
          "ABSORBIDO",
          "SUMAR"
        ],
        "desc": "Cómo contribuye al precio"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "REGLAS_NEGOCIO": {
    "description": "Motor unificado de reglas por etapa. Cubre defaults de cantidad, restricciones, ajustes, sobreturno e impuestos.",
    "columns": [
      {
        "name": "ID_Regla",
        "type": "PK",
        "desc": "Identificador único"
      },
      {
        "name": "Nombre",
        "type": "TEXT",
        "desc": "Nombre legible de la regla"
      },
      {
        "name": "Etapa",
        "type": "ENUM",
        "options": [
          "CANTIDAD_DEFAULT",
          "RESTRICCION_UI",
          "AJUSTE_LINEA",
          "AJUSTE_GLOBAL",
          "IMPUESTO"
        ],
        "desc": "Fase del pipeline"
      },
      {
        "name": "Scope",
        "type": "ENUM",
        "options": [
          "LINEA",
          "ITEM",
          "CATEGORIA",
          "COTIZACION",
          "CLIENTE",
          "COMPOSICION"
        ],
        "desc": "Alcance de aplicación"
      },
      {
        "name": "Tipo_Accion",
        "type": "ENUM",
        "options": [
          "SET_VALUE",
          "MULTIPLY",
          "ADD_FIXED",
          "ADD_ITEM",
          "INVALIDATE_BASKET",
          "WARNING",
          "ERROR",
          "SET_TAX",
          "SET_DEFAULT"
        ],
        "desc": "Acción ejecutable"
      },
      {
        "name": "Hook",
        "type": "ENUM",
        "options": [
          "pre_execution",
          "execute",
          "post_execution",
          null
        ],
        "desc": "Lifecycle hook filter (null = any)"
      },
      {
        "name": "Condicion_JSON",
        "type": "JSON",
        "desc": "Predicado para activar la regla"
      },
      {
        "name": "Payload_JSON",
        "type": "JSON",
        "desc": "Parámetros para ejecutar la acción"
      },
      {
        "name": "Prioridad",
        "type": "INTEGER",
        "desc": "Orden de ejecución en su etapa"
      },
      {
        "name": "Acumulable",
        "type": "BOOLEAN",
        "desc": "Si puede combinarse con otras reglas"
      },
      {
        "name": "Activo",
        "type": "BOOLEAN",
        "desc": "Vigencia"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "COTIZACIONES": {
    "description": "Encabezados de venta. Sin campos calculados — los totales se computan en runtime.",
    "columns": [
      {
        "name": "ID_Cotizacion",
        "type": "PK",
        "desc": "Folio"
      },
      {
        "name": "ID_Cliente",
        "type": "FK",
        "ref": "CLIENTES",
        "desc": "Cliente"
      },
      {
        "name": "Estado",
        "type": "ENUM",
        "options": [
          "Borrador",
          "Enviada",
          "Pendiente_Aprobacion",
          "Aprobada",
          "Finalizada"
        ],
        "desc": "Workflow"
      },
      {
        "name": "Fecha_Evento",
        "type": "DATE",
        "desc": "Inicio del evento"
      },
      {
        "name": "Duracion_Dias",
        "type": "INTEGER",
        "desc": "Duración global"
      },
      {
        "name": "Pax_Global",
        "type": "INTEGER",
        "desc": "Pax base"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "LINEA_DETALLE": {
    "description": "Inputs de venta. Solo datos de entrada y overrides del usuario. Sin cálculos.",
    "columns": [
      {
        "name": "ID_Linea",
        "type": "PK",
        "desc": "ID único"
      },
      {
        "name": "ID_Cotizacion",
        "type": "FK",
        "ref": "COTIZACIONES",
        "desc": "Cotización padre"
      },
      {
        "name": "ID_Item",
        "type": "FK",
        "ref": "ITEM_CATALOGO",
        "desc": "Ítem de catálogo"
      },
      {
        "name": "Estado_Linea",
        "type": "ENUM",
        "options": [
          "ACTIVA",
          "REMOVIDA"
        ],
        "desc": "Estado de ciclo de vida; no se elimina historial"
      },
      {
        "name": "Dia_Numero",
        "type": "INTEGER",
        "desc": "Día relativo (1..N)"
      },
      {
        "name": "Hora_Inicio",
        "type": "TIME",
        "desc": "Inicio servicio (si aplica)"
      },
      {
        "name": "Override_Pax",
        "type": "INTEGER",
        "desc": "Pax override por usuario (nullable, si vacío usa global)"
      },
      {
        "name": "Override_Cantidad",
        "type": "DECIMAL",
        "desc": "Cantidad override por usuario (nullable, si vacío usa calculador)"
      },
      {
        "name": "Override_Duracion_Min",
        "type": "INTEGER",
        "desc": "Duración override en minutos (nullable, si vacío usa default)"
      },
      {
        "name": "Comentarios",
        "type": "TEXT",
        "desc": "Observaciones/justificación"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "AJUSTES_COTIZACION": {
    "description": "Intervenciones manuales del usuario sobre los cálculos automáticos. Traza de 'el sistema dijo X, el usuario cambió a Y'.",
    "columns": [
      {
        "name": "ID_Ajuste",
        "type": "PK",
        "desc": "Identificador"
      },
      {
        "name": "ID_Cotizacion",
        "type": "FK",
        "ref": "COTIZACIONES",
        "desc": "Cotización afectada"
      },
      {
        "name": "ID_Linea",
        "type": "FK",
        "ref": "LINEA_DETALLE",
        "desc": "Línea afectada (nullable para ajustes globales)"
      },
      {
        "name": "Tipo_Ajuste",
        "type": "ENUM",
        "options": [
          "OVERRIDE_PRECIO",
          "OVERRIDE_PAX",
          "OVERRIDE_CANTIDAD",
          "OVERRIDE_DURACION",
          "DESCUENTO_LINEA",
          "DESCUENTO_GLOBAL",
          "RECARGO"
        ],
        "desc": "Tipo de intervención"
      },
      {
        "name": "Valor_Original",
        "type": "MONEY",
        "desc": "Lo que calculó el sistema"
      },
      {
        "name": "Valor_Nuevo",
        "type": "MONEY",
        "desc": "Lo que el usuario puso"
      },
      {
        "name": "Motivo",
        "type": "TEXT",
        "desc": "Justificación del cambio"
      },
      {
        "name": "Usuario",
        "type": "TEXT",
        "desc": "Quién hizo el ajuste"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última modificación"
      }
    ]
  },
  "CACHE_COTIZACION": {
    "description": "JSON snapshot de resultados calculados. Regenerable en cualquier momento. Consumido por frontend.",
    "columns": [
      {
        "name": "ID_Cotizacion",
        "type": "PK/FK",
        "ref": "COTIZACIONES",
        "desc": "1:1 con cotización"
      },
      {
        "name": "Snapshot_JSON",
        "type": "JSON",
        "desc": "Resultado completo: líneas con precios, subtotales, impuestos, totales, reglas aplicadas"
      },
      {
        "name": "Updated_At",
        "type": "DATETIME",
        "desc": "Última regeneración"
      }
    ]
  },
  "HISTORIAL_COTIZACION": {
    "description": "Auditoría de cambios.",
    "columns": [
      {
        "name": "ID_Log",
        "type": "PK",
        "desc": "ID evento"
      },
      {
        "name": "ID_Cotizacion",
        "type": "FK",
        "ref": "COTIZACIONES",
        "desc": "Target"
      },
      {
        "name": "Timestamp",
        "type": "DATETIME",
        "desc": "Cuándo"
      },
      {
        "name": "Usuario",
        "type": "TEXT",
        "desc": "Quién"
      },
      {
        "name": "Accion",
        "type": "TEXT",
        "desc": "Qué hizo"
      },
      {
        "name": "Detalle_Cambio",
        "type": "JSON",
        "desc": "Valores ant/nue"
      }
    ]
  }
};

// ============================================================================
// INIT CSV DATA MAP (generated from data/init/*.csv)
// ============================================================================

const INIT_CSV_DATA_MAP = {
  "AJUSTES_COTIZACION": "ID_Ajuste,ID_Cotizacion,ID_Linea,Tipo_Ajuste,Valor_Original,Valor_Nuevo,Motivo,Usuario,Updated_At\n",
  "CACHE_COTIZACION": "ID_Cotizacion,Snapshot_JSON,Updated_At\n",
  "CATEGORIAS": "ID_Categoria,Nombre,ID_Perfil_Precio_Default,Def_Requiere_Pax,Def_Requiere_Cant,Def_Requiere_Tiempo,Def_Requiere_Hora,Def_Duracion_Min,Def_Unidades_Por_Pax,Icono_UI,Activo,Updated_At\nCAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,\"Arriendo de salones, audios y comedores\",PROF_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS,false,false,true,true,480,0,,true,2026-02-19T16:42:08.795Z\nCAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,Coffes y servicios relacionado a salones,PROF_COFFEE_BASICO,false,false,false,false,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_SERVICIOS_PARA_FIESTAS,Servicios para fiestas,PROF_LUCES_PERIMETRALES_SALON_CHINOOK_O_VIP,true,false,true,true,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_BEBIDAS_Y_BAR,Bebidas  y Bar,PROF_TICKET_DE_TRAGO,false,false,false,false,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,Cambios de horas y lugar en servicios de alimentacion,PROF_CAMBIO_DE_HORARIO_DEL_DESAYUNO_1_HORA_MINIMO_30_PERSONAS,false,false,true,true,480,0,,true,2026-02-19T16:42:08.795Z\nCAT_ALIMENTACION_Y_BANQUETERIA,Alimentacion y banqueteria,PROF_DESAYUNO,true,false,true,true,480,0,,true,2026-02-19T16:42:08.795Z\nCAT_SPA,Spa,PROF_MASAJISTA_EXCLUSIVA_PARA_MASAJES_RELAX_30_MINUTOS,false,false,true,true,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_ALOJAMIENTO,Alojamiento,PROF_HABITACION_SINGLE_HOTEL_B_B,false,false,false,false,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_OTROS_ARTICULOS,Otros articulos,PROF_1_RAMO_DE_FLORES_6_ROSAS_ROJAS_BLANCAS_ROSADAS_AMARILLA,false,false,false,false,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_ACTIVIDADES,Actividades,PROF_GUIAS_EXCLUSIVOS_PARA_CAMINATAS,true,false,true,true,0,0,,true,2026-02-19T16:42:08.795Z\nCAT_TEAMBUILDING,Teambuilding,PROF_PAINTBALL,true,false,true,true,0,1,,true,2026-02-19T16:42:08.795Z\nCAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,\"Teambuilding, actividades de pausa\",PROF_LOS_NEUMATICOS,true,false,false,false,0,1,,true,2026-02-19T16:42:08.795Z\n",
  "CLIENTES": "ID_Cliente,Nombre_Empresa,RUT,Email,Telefono,Updated_At\nCLI-0001,test1,18123123-5,empresa@asda.cl,56912312331,2026-02-19T16:42:08.795Z\nCLI-0002,pedro palotes,12345678-9,wea@a.cl,569123123,2026-02-19T16:42:08.795Z\nCLI-0003,pedro palotes,12345678-9,wea@a.cl,569123123,2026-02-19T16:42:08.795Z\nCLI-0004,Aventuta*/r,76666800-3,carmen@sflodge.cl,974961403,2026-02-19T16:42:08.795Z\nCLI-0005,Ruth Stollsteimer,11111111-1,ruth.stollsteimer@gmail.com,56996475523,2026-02-19T16:42:08.795Z\nCLI-0006,Ruth Stollsteimer,11111111-1,ruth.stollsteimer@gmail.com,56996475523,2026-02-19T16:42:08.795Z\nCLI-0008,La corralera spa,25870262-K,taydecorrales@gmail.com,,2026-02-19T16:42:08.795Z\n",
  "COMPOSICION_KIT": "ID_Composicion,ID_Item_Padre,ID_Item_Hijo,Cantidad,Tipo_Precio,Updated_At\n",
  "COTIZACIONES": "ID_Cotizacion,ID_Cliente,Estado,Fecha_Evento,Duracion_Dias,Pax_Global,Updated_At\n",
  "HISTORIAL_COTIZACION": "ID_Log,ID_Cotizacion,Timestamp,Usuario,Accion,Detalle_Cambio\n",
  "ITEM_CATALOGO": "ID_Item,Nombre,ID_Categoria,ID_Perfil_Precio_Override,Def_Unidades_Por_Pax_Override,Default_Glosa,Activo,Updated_At\r\nITEM_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS,\"Salon Chinook uso diurno, hasta 320 personas\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS,,\"Equipado con papelógrafo, aire acondicionado y calefacción, 8 h Día. Incluye arranque trifasico para productoras (Definir montaje)\",true,2026-02-19T16:42:08.795Z\r\nITEM_SALON_COHO_USO_DIURNO_HASTA_120_PERSONAS,\"Salon Coho uso diurno, hasta 120 personas\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_SALON_COHO_USO_DIURNO_HASTA_120_PERSONAS,,\"Equipado con papelógrafo, aire acondicionado y calefacción, 8 h Día. ( Definir montaje)\",true,2026-02-19T16:42:08.795Z\r\nITEM_SALON_FARIO_USO_DIURNO_HASTA_70_PERSONAS,\"Salon Fario uso diurno, hasta 70 personas\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_SALON_FARIO_USO_DIURNO_HASTA_70_PERSONAS,,\"Equipado con papelógrafo, aire acondicionado y calefacción, 8 h Día. ( Definir montaje)\",true,2026-02-19T16:42:08.795Z\r\nITEM_SALON_ARCOIRIS_USO_DIURNO_HASTA_70_PERSONAS,\"Salón Arcoiris uso diurno, hasta 70 personas\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_SALON_ARCOIRIS_USO_DIURNO_HASTA_70_PERSONAS,,\"Equipado con papelógrafo, aire acondicionado y calefacción, 8 h Día. ( Definir montaje)\",true,2026-02-19T16:42:08.795Z\r\nITEM_DIRECTORIO_USO_DIURNO_PARA_16_PERSONAS_MESA_IMPERIAL,\"Directorio uso diurno para 16 personas, mesa imperial\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_DIRECTORIO_USO_DIURNO_PARA_16_PERSONAS_MESA_IMPERIAL,,\"Equipado con TV, papelógrafo, aire acondicionado y calefacción, 8 h Día.\",true,2026-02-19T16:42:08.795Z\r\nITEM_DOMO_PARA_240_PERSONAS,Domo para 240 personas,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_DOMO_PARA_240_PERSONAS,,Domo rústico incluye arranque trifasico para productoras.,true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIOS_DE_MONTAJE_CHINOOK_DURANTE_EL_ARRIENDO_DE_SALON,Cambios de montaje  Chinook durante el arriendo de salon.,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_CAMBIOS_DE_MONTAJE_CHINOOK_DURANTE_EL_ARRIENDO_DE_SALON,,Cambio de montaje durante la jornada de trabajo,true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIOS_DE_MONTAJE_COHO_DURANTE_EL_ARRIENDO_DE_SALON,Cambios de montaje Coho durante el arriendo de salon.,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_CAMBIOS_DE_MONTAJE_COHO_DURANTE_EL_ARRIENDO_DE_SALON,,Cambio de montaje durante la jornada de trabajo,true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIOS_DE_MONTAJE_FARIOS_Y_ARCOIRIS_DURANTE_EL_ARRIENDO_DE_SALON,Cambios de montaje  Farios y Arcoiris durante el arriendo de salon.,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_CAMBIOS_DE_MONTAJE_FARIOS_Y_ARCOIRIS_DURANTE_EL_ARRIENDO_DE_SALON,,Cambio de montaje durante la jornada de trabajo,true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_80_PERSONAS_8_HORAS_USO_DIURNO,Comedor VIP y terraza (2do piso) para 80 personas 8 horas uso diurno,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_80_PERSONAS_8_HORAS_USO_DIURNO,,Comedor en 2do piso con terraza para servicios de alimentacion exclusivos. Posee una terraza exclusiva.,true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_8_HORAS_USO_DIURNO,\"Comedor truchita o ex pool y terraza para 35 personas, 8 horas uso diurno\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_8_HORAS_USO_DIURNO,,Comedor exclusivo para maximo  35 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_8_HORAS_USO_DIURNO,\"Arriendo pergola con parrilla para 16 personas, 8 horas uso diurno\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_8_HORAS_USO_DIURNO,,Pergola exclusiva con parrilla,true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_70_PERSONAS_1_5_HRS_AM_O_PM_ALMUERZO_O_CENA,\"Comedor VIP y terraza (2do piso) para 70 personas 1,5 hrs / AM O PM (ALMUERZO O CENA)\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_70_PERSONAS_1_5_HRS_AM_O_PM_ALMUERZO_O_CENA,,Comedor en 2do piso con terraza para servicios de alimentacion exclusivos. Posee una terraza exclusiva.,true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_1_5_HORAS_AM_O_PM_ALMUERZO_O_CENA,\"Comedor truchita o ex pool y terraza para 35 personas 1,5 horas / AM O PM (ALMUERZO O CENA)\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_1_5_HORAS_AM_O_PM_ALMUERZO_O_CENA,,Comedor exclusivo para maximo  35 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_4_HORAS,\"Arriendo pergola con parrilla para 16 personas, 4 horas\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_4_HORAS,,Pergola exclusiva con parrilla,true,2026-02-19T16:42:08.795Z\r\nITEM_ARRIENDO_PERGOLA_PICADERO_SOLO_CON_AUTORIZACION_2_DIAS_ANTES,\"Arriendo pergola picadero solo con autorizacion, 2 dias antes.\",CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_ARRIENDO_PERGOLA_PICADERO_SOLO_CON_AUTORIZACION_2_DIAS_ANTES,,Arriendo por una pergola techada en el sector del picadero.,true,2026-02-19T16:42:08.795Z\r\nITEM_TECNICA_PARA_SALONES_USO_DIURNO,Tecnica para salones uso diurno.,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_TECNICA_PARA_SALONES_USO_DIURNO,,\"Data, amplificacion, 2 microfonos para uso en el dia.\",true,2026-02-19T16:42:08.795Z\r\nITEM_AUDIO_4_HORAS_EN_LA_NOCHE,Audio 4 horas en la noche,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_AUDIO_4_HORAS_EN_LA_NOCHE,,\"Data, amplificacion, 2 microfonos para uso noche.\",true,2026-02-19T16:42:08.795Z\r\nITEM_AMPLIFICACION_EXTERIOR,Amplificacion exterior,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_AMPLIFICACION_EXTERIOR,,2 parlantes con microfono ubicado en exteriores cercanos a algun punto electrico.,true,2026-02-19T16:42:08.795Z\r\nITEM_MICROFONO_INALAMBRICO_ADICIONAL,Microfono inalambrico adicional,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_MICROFONO_INALAMBRICO_ADICIONAL,,,true,2026-02-19T16:42:08.795Z\r\nITEM_MICROFONO_SOLAPA_ADICIONAL,Microfono solapa adicional,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_MICROFONO_SOLAPA_ADICIONAL,,,true,2026-02-19T16:42:08.795Z\r\nITEM_OPERADOR_PARA_AUDIO_8_HRS,Operador para audio 8 hrs,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_OPERADOR_PARA_AUDIO_8_HRS,,Operador de audio para salon diurno. Se debe agregar tecnica que desee operar.,true,2026-02-19T16:42:08.795Z\r\nITEM_PAPELOGRAFO_ADICIONAL_PARA_EL_SALON,Papelografo adicional para el salon,CAT_ARRIENDO_DE_SALONES_AUDIOS_Y_COMEDORES,PROF_PAPELOGRAFO_ADICIONAL_PARA_EL_SALON,,Total en el hotel 8,true,2026-02-19T16:42:08.795Z\r\nITEM_COFFEE_BASICO,Coffee Básico,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_COFFEE_BASICO,,\"Café, té, agua, jugo de pulpa, 1 tapadito, 1 top de masa de hoja+ 1 mini muffin o 1 galleta\",true,2026-02-19T16:42:08.795Z\r\nITEM_COFFEE_INTERMEDIO,Coffee Intermedio,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_COFFEE_INTERMEDIO,,\"Café, té, agua, jugo de pulpa, 1 tapadito, 1 mini muffin, 1 facturita, 1 galleta y  una fruta.\",true,2026-02-19T16:42:08.795Z\r\nITEM_COFFE_FULL,Coffe Full,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_COFFE_FULL,,\"Café de grano, té, jugo de pulpa, 2 tapaditos, 2 mini muffin , 2 galletas, 1 facturita y una brocheta de fruta.\",true,2026-02-19T16:42:08.795Z\r\nITEM_COFFE_LIGHT,Coffe Light,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_COFFE_LIGHT,,\"Café, té, agua, jugo de pulpa, yogurt natural con granola y fruta, 1 tapadito integral, una brocheta de fruta\",true,2026-02-19T16:42:08.795Z\r\nITEM_ADICIONAR_COFFE_DENTRO_DEL_SALON,Adicionar coffe dentro del Salon,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_ADICIONAR_COFFE_DENTRO_DEL_SALON,,Servicios de coffe ubicados dentro del salon.,true,2026-02-19T16:42:08.795Z\r\nITEM_MAQUINA_CAFE_MILANO_CON_CARGA_PARA_120_CAFES_APP_AUTOSERVICIO,Maquina Cafe Milano con carga para 120 cafes app. ( autoservicio),CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_MAQUINA_CAFE_MILANO_CON_CARGA_PARA_120_CAFES_APP_AUTOSERVICIO,,\"Maquina auto servicio que entrega app. 120 unidades entre Cafe, capuchinos, mocachino, late, expresos, americano, agua caliente chocolate.\",true,2026-02-19T16:42:08.795Z\r\nITEM_1_TAPADITO,1 tapadito,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_1_TAPADITO,,,true,2026-02-19T16:42:08.795Z\r\nITEM_1_MEDIALUNA,1 medialuna,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_1_MEDIALUNA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_GALLETAS_DE_MANTEQUILLA_3_POR_PERSONA,Galletas de mantequilla  3 por persona,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_GALLETAS_DE_MANTEQUILLA_3_POR_PERSONA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_CAFE_DE_GRANO_O_TE_EN_SALON_8_HRS,Cafe de grano o te en salon 8 hrs,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_CAFE_DE_GRANO_O_TE_EN_SALON_8_HRS,,valor por persona,true,2026-02-19T16:42:08.795Z\r\nITEM_DISPENSADOR_DE_AGUA_20_LTS_EN_SALON,Dispensador de agua 20 Lts en salon,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_DISPENSADOR_DE_AGUA_20_LTS_EN_SALON,,Dispensador de agua  20 lts con vasos en salón,true,2026-02-19T16:42:08.795Z\r\nITEM_RECARGA_DE_BIDON_DE_20_LTS_PARA_DISPENSADOR_DE_AGUA,Recarga de bidon de 20 Lts para dispensador de agua,CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_RECARGA_DE_BIDON_DE_20_LTS_PARA_DISPENSADOR_DE_AGUA,,Recarga de bidon de agua de 20 litros y vasos.,true,2026-02-19T16:42:08.795Z\r\nITEM_CAFE_DE_GRANO_TE_Y_AGUA_FRIA_CALIENTE_EN_SALON_POR_8_HORAS,\"Cafe de grano, te y agua fria /caliente en salon  por 8 horas.\",CAT_COFFES_Y_SERVICIOS_RELACIONADO_A_SALONES,PROF_CAFE_DE_GRANO_TE_Y_AGUA_FRIA_CALIENTE_EN_SALON_POR_8_HORAS,,valor por persona,true,2026-02-19T16:42:08.795Z\r\nITEM_LUCES_PERIMETRALES_SALON_CHINOOK_O_VIP,Luces perimetrales salon chinook o vip,CAT_SERVICIOS_PARA_FIESTAS,PROF_LUCES_PERIMETRALES_SALON_CHINOOK_O_VIP,,12 Luces decorativas perimetrales para una fiesta o karaoke.,true,2026-02-19T16:42:08.795Z\r\nITEM_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,DJ y/o Karaoke por 4 hrs para grupos menores 50 Pax,CAT_SERVICIOS_PARA_FIESTAS,PROF_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,,\"Dj y karaoke por 4 horas,( agregar salon)\",true,2026-02-19T16:42:08.795Z\r\nITEM_HORA_EXTRA_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,Hora extra DJ y/o Karaoke por 4 hrs para grupos menores 50 Pax,CAT_SERVICIOS_PARA_FIESTAS,PROF_HORA_EXTRA_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,,hora extra,true,2026-02-19T16:42:08.795Z\r\nITEM_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,DJ y/o Karaoke para grupos mayores a 50 Pax,CAT_SERVICIOS_PARA_FIESTAS,PROF_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,,\"Dj y karaoke por 4 horas,( agregar salon)\",true,2026-02-19T16:42:08.795Z\r\nITEM_HORA_EXTRA_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,Hora extra DJ y/o Karaoke para grupos mayores a 50 Pax,CAT_SERVICIOS_PARA_FIESTAS,PROF_HORA_EXTRA_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,,hora extra,true,2026-02-19T16:42:08.795Z\r\nITEM_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS_4_HORAS_NOCHE,\"Salon chinook con fogata, hasta 300 personas, 4 horas noche\",CAT_SERVICIOS_PARA_FIESTAS,PROF_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS_4_HORAS_NOCHE,,Salon para fiestas y karaokes con terraza exclusiva . Incluye fogata en terraza y tiene arranque trifasico para productoras,true,2026-02-19T16:42:08.795Z\r\nITEM_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS,\"Salon chinook con fogata, hasta 300 personas\",CAT_SERVICIOS_PARA_FIESTAS,PROF_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS,,Salon para fiestas y karaokes con terraza exclusiva . Incluye fogata en terraza y tiene arranque trifasico para productoras.,true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS_4_HORAS_NOCHE,\"Comedor VIP con fogata, 2 piso hasta 70 personas, 4 horas noche\",CAT_SERVICIOS_PARA_FIESTAS,PROF_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS_4_HORAS_NOCHE,,\"Comedor en 2do piso con terraza para fiestas o Karaokes exclusivos, incluye fogata en terraza\",true,2026-02-19T16:42:08.795Z\r\nITEM_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS,\"Comedor VIP con fogata, 2 piso hasta 70 personas\",CAT_SERVICIOS_PARA_FIESTAS,PROF_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS,,Comedor en 2do piso con terraza para servicios de alimentacion exclusivos. Posee una terraza exclusiva.,true,2026-02-19T16:42:08.795Z\r\nITEM_ESPACIO_DEL_BAR_PARA_KARAOKE_HASTA_50_PERSONAS_POR_4_HRS_NOCHE,\"Espacio del Bar para karaoke, hasta 50 personas por 4 hrs noche\",CAT_SERVICIOS_PARA_FIESTAS,PROF_ESPACIO_DEL_BAR_PARA_KARAOKE_HASTA_50_PERSONAS_POR_4_HRS_NOCHE,,Espacio del bar principal del hotel para la realizacion de karaokes,true,2026-02-19T16:42:08.795Z\r\nITEM_DOMO_PARA_FIESTAS_CON_FOGATA_HASTA_250_PERSONAS_4_HORAS_NOCHE,\"Domo para fiestas con fogata, hasta 250 personas, 4 horas noche\",CAT_SERVICIOS_PARA_FIESTAS,PROF_DOMO_PARA_FIESTAS_CON_FOGATA_HASTA_250_PERSONAS_4_HORAS_NOCHE,,Domo para fiestas y karaokes con amplios jardines.Incluye fogata y tiene arranque trifasico para productoras.,true,2026-02-19T16:42:08.795Z\r\nITEM_LOUNGE_EN_TERRAZAS_SILLONES_MESAS_Y_FOGONES_HASTA_50_PAX_VALOR_PERSONA,\"Lounge en terrazas (sillones, mesas y fogones), hasta 50 pax. Valor  persona\",CAT_SERVICIOS_PARA_FIESTAS,PROF_LOUNGE_EN_TERRAZAS_SILLONES_MESAS_Y_FOGONES_HASTA_50_PAX_VALOR_PERSONA,1,\"Lugares: Terraza chinook, terraza comedor  chico( ex pool), terraza comedor 2do piso y Domo. Valor por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_TICKET_DE_TRAGO,Ticket de trago,CAT_BEBIDAS_Y_BAR,PROF_TICKET_DE_TRAGO,,\"1 trago pp a escoger entre: Piscola ( Mistral 35), Roncola (Havanna),  vodka (wyborowa), Whisky( Ballantines finest 3 años), Gin beefeter, Ramazzotti,  Daiquiri, Pisco sour, Kir Royal, Piña Colada con y sin alcohol, Copa de vino castillo molina( blanco y tinto) , copa de espumante Viña Mar Brut, cervezas en botella tales como Sol, Heineken con y sin alcohol,  Austral y Kunstmann. Las bebidas son de marcas CCU.\",true,2026-02-19T16:42:08.795Z\r\nITEM_TICKET_DE_CERVEZA,Ticket de cerveza,CAT_BEBIDAS_Y_BAR,PROF_TICKET_DE_CERVEZA,,\"Ticket de cerveza en botella tales como: Sol, Heineken, Austral o Kunstmann.\",true,2026-02-19T16:42:08.795Z\r\nITEM_TICKET_DE_TRAGO_VIP,Ticket de trago Vip,CAT_BEBIDAS_Y_BAR,PROF_TICKET_DE_TRAGO_VIP,,\"Piscola ( Mistral Nobel o 3R doble destilado), Roncola (Havanna reserva), Vodka( Absolut), Whisky (ballantines 7 años),Gin Kantal, Tequila Olmeca, Ramazzotti,  Daiquiri, Pisco sour, Kir Royal, Piña Colada, Vino  Gran Tarapacá( blanco y tinto) , Espumante Viña Mar Brut, cervezas en botella tales como Sol, Heineken,  Austral, Kunstmann botella y Barril Schop Kunstmann. Las bebidas son de marcas CCU.\",true,2026-02-19T16:42:08.795Z\r\nITEM_BAR_ABIERTO_4_HORAS_VALOR_POR_PERSONA,\"Bar abierto 4 horas, valor por persona\",CAT_BEBIDAS_Y_BAR,PROF_BAR_ABIERTO_4_HORAS_VALOR_POR_PERSONA,,\"Piscola ( Mistra 35), Roncola (Havanna),  vodka (wyborowa), Whisky( Ballantines finest 3 años), Gin beefeter, Ramazzotti,  Daiquiri, Pisco sour, Kir Royal, Piña Colada( con y sin alcohol), Copa de vino castillo molina( blanco y tinto) , copa de espumante Viña Mar Brut, cervezas en botella tales como Sol, Heineken con y sin alcohol,  Austral y Kunstmann. Las bebidas son de marcas CCU.\",true,2026-02-19T16:42:08.795Z\r\nITEM_HORA_EXTRA_BAR_ABIERTO_POR_PERSONA,Hora extra Bar abierto por persona,CAT_BEBIDAS_Y_BAR,PROF_HORA_EXTRA_BAR_ABIERTO_POR_PERSONA,,extensión de 1 hora para el bar abierto,true,2026-02-19T16:42:08.795Z\r\nITEM_BAR_ABIERTO_SIN_ALCOHOL_4_HORAS_VALOR_POR_PERSONA,\"Bar abierto sin alcohol 4 horas, valor por persona\",CAT_BEBIDAS_Y_BAR,PROF_BAR_ABIERTO_SIN_ALCOHOL_4_HORAS_VALOR_POR_PERSONA,,\"Mocktails tales como Piña colada, Chardonnay sour , San Francisco (Mocktail en base a jugo de naranja), Paloma (Mocktail en base a pomelo), Cerveza sin alcohol (Heineken 0.0), Limonada, Jugos naturales, Vino blanco sin alcohol, Sangria sin alcohol. Las bebidas son de marcas CCU.\",true,2026-02-19T16:42:08.795Z\r\nITEM_HORA_EXTRA_BAR_ABIERTO_SIN_ALCOHOL_POR_PERSONA,Hora extra Bar abierto sin alcohol por persona,CAT_BEBIDAS_Y_BAR,PROF_HORA_EXTRA_BAR_ABIERTO_SIN_ALCOHOL_POR_PERSONA,,extensión de 1 hora para el bar abierto,true,2026-02-19T16:42:08.795Z\r\nITEM_BAR_ABIERTO_VIP_4_HORAS_VALOR_POR_PERSONA,\"Bar abierto VIP  4 horas, valor por persona\",CAT_BEBIDAS_Y_BAR,PROF_BAR_ABIERTO_VIP_4_HORAS_VALOR_POR_PERSONA,,\"Piscola ( Mistral Nobel o 3R doble destilado), Roncola (Havanna reserva), Vodka( Absolut), Whisky (ballantines 7 años),Gin Kantal, Tequila Olmeca, Ramazzotti,  Daiquiri, Pisco sour, Kir Royal, Piña Colada, Vino  Gran Tarapacá( blanco y tinto) , Espumante Viña Mar Brut, cervezas en botella tales como Sol, Heineken,  Austral, Kunstmann botella y Barril Schop Kunstmann. Las bebidas son de marcas CCU.\",true,2026-02-19T16:42:08.795Z\r\nITEM_HORA_EXTRA_BAR_ABIERTO_VIP_POR_PERSONA,Hora extra Bar abierto Vip por persona,CAT_BEBIDAS_Y_BAR,PROF_HORA_EXTRA_BAR_ABIERTO_VIP_POR_PERSONA,,extensión de 1 hora para el bar abierto,true,2026-02-19T16:42:08.795Z\r\nITEM_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_4_HORAS_POR_PERSONA,\"Bar Abierto de bebidas en vaso por 4 horas, por persona\",CAT_BEBIDAS_Y_BAR,PROF_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_4_HORAS_POR_PERSONA,,Botellas de 3 litros CCU servido en vaso desechable (ver tamaño),true,2026-02-19T16:42:08.795Z\r\nITEM_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_8_HORAS_POR_PERSONA,\"Bar Abierto de bebidas en vaso por 8 horas, por persona\",CAT_BEBIDAS_Y_BAR,PROF_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_8_HORAS_POR_PERSONA,,Botellas de 3 litros CCU servido en vaso desechable (ver tamaño),true,2026-02-19T16:42:08.795Z\r\nITEM_BEBIDAS,Bebidas,CAT_BEBIDAS_Y_BAR,PROF_BEBIDAS,,Lata de bebida o agua  ccu,true,2026-02-19T16:42:08.795Z\r\nITEM_TICKET_DE_BEBIDA_O_AGUA,Ticket de bebida o agua,CAT_BEBIDAS_Y_BAR,PROF_TICKET_DE_BEBIDA_O_AGUA,,Lata de bebida o agua ccu,true,2026-02-19T16:42:08.795Z\r\nITEM_BARRIL_DE_CERVEZA_KUNTSMAN_TOROBAYO_30L,Barril de cerveza kuntsman torobayo 30L,CAT_BEBIDAS_Y_BAR,PROF_BARRIL_DE_CERVEZA_KUNTSMAN_TOROBAYO_30L,,Barril de cerveza torobayo exclusivo,true,2026-02-19T16:42:08.795Z\r\nITEM_BEBESTIBLES_ADICIONALES_EN_SALON_BEBIDAS_JUGOS_NATURALES_AGUA_MINERAL,\"Bebestibles adicionales en Salón (Bebidas, Jugos Naturales, Agua Mineral)\",CAT_BEBIDAS_Y_BAR,PROF_BEBESTIBLES_ADICIONALES_EN_SALON_BEBIDAS_JUGOS_NATURALES_AGUA_MINERAL,,Visitar QR para mayor detalles ( https://gour.media/san-francisco-lodge/ ),true,2026-02-19T16:42:08.795Z\r\nITEM_VINO_CASTILLO_MOLINA,Vino Castillo Molina,CAT_BEBIDAS_Y_BAR,PROF_VINO_CASTILLO_MOLINA,,Se recomienda 1 botella para 5 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_VINO_CASILLERO_DEL_DIABLO_RESERVA_ESPECIAL,Vino Casillero del diablo Reserva Especial,CAT_BEBIDAS_Y_BAR,PROF_VINO_CASILLERO_DEL_DIABLO_RESERVA_ESPECIAL,,Se recomienda 1 botella para 5 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_VINO_MARQUES_CASA_CONCHA,Vino Marques Casa Concha,CAT_BEBIDAS_Y_BAR,PROF_VINO_MARQUES_CASA_CONCHA,,Se recomienda 1 botella para 5 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIO_DE_HORARIO_DEL_DESAYUNO_1_HORA_MINIMO_30_PERSONAS,\"Cambio de horario del desayuno 1 hora, minimo 30 personas\",CAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,PROF_CAMBIO_DE_HORARIO_DEL_DESAYUNO_1_HORA_MINIMO_30_PERSONAS,,\"valor por persona, se adelanta o se extiende el desayuno por una hora\",true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIO_DE_HORARIO_DEL_DESAYUNO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,\"Cambio de horario del desayuno por media hora , minimo 30 personas\",CAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,PROF_CAMBIO_DE_HORARIO_DEL_DESAYUNO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,,\"valor por persona, se adelanta o se extiende el desayuno por media hora\",true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIO_DE_HORARIO_DE_ALMUERZO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,\"Cambio de horario de almuerzo por media hora, minimo 30 personas\",CAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,PROF_CAMBIO_DE_HORARIO_DE_ALMUERZO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,,\"valor por persona, se adelanta o se extiende el almuerzo por media hora.\",true,2026-02-19T16:42:08.795Z\r\nITEM_EXTENSION_MEDIA_HORA_HORARIO_DE_CENA,Extension media hora horario de cena,CAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,PROF_EXTENSION_MEDIA_HORA_HORARIO_DE_CENA,,valor por persona para extension de servicios de cena por media hora hasta las 21:30,true,2026-02-19T16:42:08.795Z\r\nITEM_CAMBIO_DE_LUGAR_DE_SERVICIO_DE_ALIMENTACION,Cambio de lugar de servicio de alimentacion,CAT_CAMBIOS_DE_HORAS_Y_LUGAR_EN_SERVICIOS_DE_ALIMENTACION,PROF_CAMBIO_DE_LUGAR_DE_SERVICIO_DE_ALIMENTACION,,\"Valor por persona, se debe reservar adicionalmente el salon ( chinook, salon truchita o comedor vip)\",true,2026-02-19T16:42:08.795Z\r\nITEM_DESAYUNO,Desayuno,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_DESAYUNO,,\"Tipos de Café, Chocolate, té, leche, jugo, yogurt, cereales, Fruta, jamón, quesos, huevos, tocino, chorizo, verduras asadas, mermeladas, mantequilla, distintos tipos de panes, minipastelitos, queques, croissant.\",true,2026-02-19T16:42:08.795Z\r\nITEM_DESAYUNO_INCLUIDO_POR_ALOJAMIENTO,Desayuno incluido por alojamiento,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_DESAYUNO_INCLUIDO_POR_ALOJAMIENTO,,\"Tipos de Café, Chocolate, té, leche, jugo, yogurt, cereales, Fruta, jamón, quesos, huevos, tocino, chorizo, verduras asadas, mermeladas, mantequilla, distintos tipos de panes, minipastelitos, queques, croissant.\",true,2026-02-19T16:42:08.795Z\r\nITEM_ALMUERZO_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,\"Almuerzo Sugerencias del chef  en formato Buffet, mas de 30 pasajeros. Menos de 30 es carta\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_ALMUERZO_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,,\"Buffet tenedor libre con variedad de ensaladas, guarniciones y acompañamientos calientes. No incluye bebidas ni aperitivos. Si en el hotel hay menos de 30 personas el servicio a la carta, si contamos con mas de 30 personas será buffet.  Horario almuerzo desde 13:30 hasta 15:00 hrs\",true,2026-02-19T16:42:08.795Z\r\nITEM_CENA_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,\"Cena Sugerencias del chef  en formato Buffet, mas de 30 pasajeros. Menos de 30 es carta\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CENA_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,,\"Buffet tenedor libre con opciones de Pizzas, fondos con carnes, acompañamientos, Salad bar, salsas, dressing, postres, sopas, inc café. . Horario cena desde 19:30 hasta 21:00.. Si en el hotel hay menos de 30 personas el servicio a la carta, si es mas de 30 personas será buffet.\",true,2026-02-19T16:42:08.795Z\r\nITEM_ALMUERZO_O_CENA_A_LA_CARTA,Almuerzo o cena a la carta,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_ALMUERZO_O_CENA_A_LA_CARTA,,\"Servicio de alimentacion a la carta, servido a la mesa. Es un menú único que debe elergirse con una semana de anticipación. Se sugiere agregar vinos para acompañar la comida\",true,2026-02-19T16:42:08.795Z\r\nITEM_ALMUERZO_O_CENA_A_LA_CARTA_VIP,Almuerzo o cena a la carta VIP,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_ALMUERZO_O_CENA_A_LA_CARTA_VIP,,\"Servicio de alimentacion a la carta, servido a la mesa. Es un menú único que debe elergirse con una semana de anticipación. Se sugiere agregar vinos para acompañar la comida\",true,2026-02-19T16:42:08.795Z\r\nITEM_CENA_O_ALMUERZO_PARRILLA_30_O_MAS_PAX,\"Cena o Almuerzo parrilla, 30 o mas  pax\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CENA_O_ALMUERZO_PARRILLA_30_O_MAS_PAX,,\"Preparacion de carnes de vacuno, cerdo, chorizos y prietas la parrilla,  mas acompañamientos, ensaladas y postre y café.No incluye bebidas ni aperitivos\",true,2026-02-19T16:42:08.795Z\r\nITEM_CENA_O_ALMUERZO_PARRILLA_MENOS_DE_30_PAX,\"Cena o Almuerzo parrilla, menos de 30 pax\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CENA_O_ALMUERZO_PARRILLA_MENOS_DE_30_PAX,,\"Preparacion de carnes, verduras y frutas a la parrilla,  mas acompañamientos, ensaladas y postre y café.No incluye bebidas ni aperitivos\",true,2026-02-19T16:42:08.795Z\r\nITEM_ONCE,Once,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_ONCE,,Bebida o agua con Hamburguesa lechuga tomate y helado.,true,2026-02-19T16:42:08.795Z\r\nITEM_BOX_LUNCH_COMO_UNA_ONCE_EN_CAJITAS_INDIVIDUALES_PARA_QUE_SE_LA_PUEDAN_LLEVAR,Box lunch (Como una Once en cajitas individuales para que se la puedan llevar),CAT_ALIMENTACION_Y_BANQUETERIA,PROF_BOX_LUNCH_COMO_UNA_ONCE_EN_CAJITAS_INDIVIDUALES_PARA_QUE_SE_LA_PUEDAN_LLEVAR,,\"Muffin o dos facturas, hamburguesa, una fruta, 1 bebida\",true,2026-02-19T16:42:08.795Z\r\nITEM_CATA_DE_VINOS_CON_SOMELIER_MINIMO_10_PERSONAS_Y_HASTA_40_DURACION_1_HORA,\"Cata de vinos con somelier, minimo 10 personas y hasta 40.  Duración 1 hora\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CATA_DE_VINOS_CON_SOMELIER_MINIMO_10_PERSONAS_Y_HASTA_40_DURACION_1_HORA,1,\"Cata de 4 vinos  reserva boutique, de la zona, con maridaje de quesos y encurtidos.\",true,2026-02-19T16:42:08.795Z\r\nITEM_PICOTEO_PARRILLANDO_CON_AMIGOS_MINIMO_20_PERSONAS,Picoteo parrillando con amigos: minimo 20 personas,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_PICOTEO_PARRILLANDO_CON_AMIGOS_MINIMO_20_PERSONAS,1,\"Este apertivo consiste en hacer  su propia parrilla modo picoteo.  Podran escoger 2 unidades dentro de las siguientes alternativas: pisco sour, vino, espumpante o cerveza. Duracion 1 hora. No reemplaza  comida\",true,2026-02-19T16:42:08.795Z\r\nITEM_APERITIVO_TEMATICO_JUGANDO_EN_LA_BARRA_MINIMO_20_PERSONAS_MAXIMO_1_5_HORAS,\"Aperitivo tematico: Jugando en la barra, minimo 20 personas. Maximo 1,5 horas\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_APERITIVO_TEMATICO_JUGANDO_EN_LA_BARRA_MINIMO_20_PERSONAS_MAXIMO_1_5_HORAS,1,\"Bar abierto entretenido, donde ellos prepararan sus propios tragos con la ayuda de un bartender profesional. Acompañados con quesos y frutos secos. Duracion 1,5 horas\",true,2026-02-19T16:42:08.795Z\r\nITEM_TABLA_DE_QUESO_6_PAX,Tabla de Queso 6 Pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TABLA_DE_QUESO_6_PAX,,\"Queso mantecoso, queso azul, queso cabra, camembert, esferas queso crema con ciboulette y mix frutos secos.\",true,2026-02-19T16:42:08.795Z\r\nITEM_TABLA_FIAMBRES_6_PAX,Tabla Fiambres 6 Pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TABLA_FIAMBRES_6_PAX,,\"Jamon pierna, jamon serrano, salame, mix frutos secos\",true,2026-02-19T16:42:08.795Z\r\nITEM_TABLA_MIXTA_QUESOS_Y_FIAMBRES_6_PAX,Tabla Mixta Quesos y Fiambres 6 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TABLA_MIXTA_QUESOS_Y_FIAMBRES_6_PAX,,\"Jamon pierna, jamon serrano, salame, queso mantecoso, queso cabra, camembert, esferas queso crema y mix frutos secos.\",true,2026-02-19T16:42:08.795Z\r\nITEM_TABLA_MIX_TAPADITOS_QUICHES_Y_MINI_EMPANADAS_6_PAX,\"Tabla Mix Tapaditos, Quiches y Mini Empanadas 6 pax\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TABLA_MIX_TAPADITOS_QUICHES_Y_MINI_EMPANADAS_6_PAX,,\"6 tapaditos salmon queso crema, 6 tapaditos Jamon serrano pesto aceituna, 6 mini quiches, 6 empanadas mini pino y empanadas napolitana.\",true,2026-02-19T16:42:08.795Z\r\nITEM_TABLA_VEGANA_6_PAX,Tabla vegana 6 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TABLA_VEGANA_6_PAX,,\"1 champiñon relleno, hummus, queso vegano especiado, crudites( bastones de verduras), grissinis de ajo, focaccia palmito, vegetales tempura, 1 brusqueta de rucula con tomate confit.\",true,2026-02-19T16:42:08.795Z\r\nITEM_COCTAIL_BASICO_MINIMO_15_PASAJEROS,\"Coctail basico, minimo 15 pasajeros.\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_COCTAIL_BASICO_MINIMO_15_PASAJEROS,,\"1 Bebestible por persona entre: Pisco sour, espumante, vino,  bebida o cerveza, 1 empanadita, 1 bruscheta queso crema tomate confit y reduccion de aceto, mix de quesos, brusqueta pesto con jamón serrano, queso azul frito con mermelada de frambuesa, y brocheta de fruta .\",true,2026-02-19T16:42:08.795Z\r\nITEM_COCTAIL_CHILENO_MINIMO_15_PASAJEROS,\"Coctail chileno, minimo 15 pasajeros.\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_COCTAIL_CHILENO_MINIMO_15_PASAJEROS,,\"1 Bebestible por persona entre: Pisco sour, espumante, vino,  bebida o cerveza. 1 empanadita de pino y 1 de queso, 1 bruscheta de prieta nogada, 1 mini anticucho, chorizo envuelto en masa de  hoja, chupe de camarón, mix de quesos y frutos secos.\",true,2026-02-19T16:42:08.795Z\r\nITEM_CORDERO_A_LA_ESPADA_CORDERO_CON_PAN_AMASADO_Y_SALSAS_PARA_20_PAX,Cordero a la espada (Cordero con pan amasado y salsas para 20 pax),CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CORDERO_A_LA_ESPADA_CORDERO_CON_PAN_AMASADO_Y_SALSAS_PARA_20_PAX,,\"Cordero a la espada para picoteo, acompañado de panes amasados con distintas salsas tales como pebre, lactonesa ajo merkén y criolla.\",true,2026-02-19T16:42:08.795Z\r\nITEM_PIERNA_DE_CERDO_16_HRS_AL_HORNO_CON_AMASADO_Y_3_SALSAS_PARA_PICOTEO,\"Pierna de cerdo 16 hrs al horno, con amasado y 3 salsas para picoteo\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_PIERNA_DE_CERDO_16_HRS_AL_HORNO_CON_AMASADO_Y_3_SALSAS_PARA_PICOTEO,,Recomendado para  maximo 50 personas,true,2026-02-19T16:42:08.795Z\r\nITEM_EMPANADAS_COCTEL_PINO_QUESO_Y_NAPOLITANA,\"Empanadas coctel( pino, queso y napolitana)\",CAT_ALIMENTACION_Y_BANQUETERIA,PROF_EMPANADAS_COCTEL_PINO_QUESO_Y_NAPOLITANA,,\"Empanada pino, queso, napolitana, valor unitario\",true,2026-02-19T16:42:08.795Z\r\nITEM_SERVICIO_DE_TRASNOCHE_CONSOME_250CC_CON_2_TAPADITOS,Servicio de trasnoche Consome 250cc con 2 tapaditos,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_SERVICIO_DE_TRASNOCHE_CONSOME_250CC_CON_2_TAPADITOS,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_PUNTO_DE_HIDRATACION,Punto de hidratación,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_PUNTO_DE_HIDRATACION,,\"1 barra de ceral, 1 agua mineral y 1 fruta de estación\",true,2026-02-19T16:42:08.795Z\r\nITEM_1_FRUTA_DE_ESTACION,1 fruta de estación,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_1_FRUTA_DE_ESTACION,,,true,2026-02-19T16:42:08.795Z\r\nITEM_1_BARRA_DE_CEREAL,1 barra de cereal,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_1_BARRA_DE_CEREAL,,,true,2026-02-19T16:42:08.795Z\r\nITEM_TORTA_CHOCOLATE_16_PAX,Torta Chocolate 16 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TORTA_CHOCOLATE_16_PAX,,Torta de chocolate envuelta en chips de chocolate.,true,2026-02-19T16:42:08.795Z\r\nITEM_TORTA_CARROTCAKE_14_PAX,Torta Carrotcake 14 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TORTA_CARROTCAKE_14_PAX,,\"Esponjoso de zanahoria nuez, rellena frosting de queso crema\",true,2026-02-19T16:42:08.795Z\r\nITEM_CHEESECAKE_DE_OREO_14_PAX,Cheesecake de Oreo 14 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_CHEESECAKE_DE_OREO_14_PAX,,Imperdible cheesecake Oreo,true,2026-02-19T16:42:08.795Z\r\nITEM_TORTA_SAN_FRANCISCO_MANJAR_NUEZ_15_PAX,Torta San Francisco manjar nuez 15 pax,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TORTA_SAN_FRANCISCO_MANJAR_NUEZ_15_PAX,,Esponjoso de chocolate rellena de dulce de leche y crema chantilly,true,2026-02-19T16:42:08.795Z\r\nITEM_TROZO_DE_TORTA_DE_CHOCOLATE_ESTACION_CAFE_O_TE_EN_COMEDOR,Trozo de torta de Chocolate + estacion cafe o té en comedor,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TROZO_DE_TORTA_DE_CHOCOLATE_ESTACION_CAFE_O_TE_EN_COMEDOR,,Trozo servido a la mesa en el comedor con estacion de té y cafe disponible para autoservicio.,true,2026-02-19T16:42:08.795Z\r\nITEM_TROZO_DE_TORTA_CARROT_CAKE_ESTACION_CAFE_O_TE_EN_COMEDOR,Trozo de torta Carrot Cake + estacion cafe o té en comedor,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TROZO_DE_TORTA_CARROT_CAKE_ESTACION_CAFE_O_TE_EN_COMEDOR,,Trozo servido a la mesa en el comedor con estacion de té y cafe disponible para autoservicio.,true,2026-02-19T16:42:08.795Z\r\nITEM_TROZO_DE_CHEESE_CAKE_OREO_ESTACION_CAFE_O_TE_EN_COMEDOR,Trozo de Cheese Cake Oreo + estacion cafe o té en comedor,CAT_ALIMENTACION_Y_BANQUETERIA,PROF_TROZO_DE_CHEESE_CAKE_OREO_ESTACION_CAFE_O_TE_EN_COMEDOR,,Trozo servido a la mesa en el comedor con estacion de té y cafe disponible para autoservicio.,true,2026-02-19T16:42:08.795Z\r\nITEM_MASAJISTA_EXCLUSIVA_PARA_MASAJES_RELAX_30_MINUTOS,\"Masajista exclusiva, para masajes relax 30 minutos\",CAT_SPA,PROF_MASAJISTA_EXCLUSIVA_PARA_MASAJES_RELAX_30_MINUTOS,,\"Horario de 10:30 a 20:00, puede hacer maximo 10 masajes de relajación por dia.\",true,2026-02-19T16:42:08.795Z\r\nITEM_MASAJES_DE_RELAJACION_DE_MEDIA_HORA,Masajes de relajacion de media hora,CAT_SPA,PROF_MASAJES_DE_RELAJACION_DE_MEDIA_HORA,,Horario de los masajes debe coordinarse previamente al evento. Minimo 3 dias de anticipacion,true,2026-02-19T16:42:08.795Z\r\nITEM_GORROS_DE_PISCINAS_LYCRA,Gorros de piscinas  lycra,CAT_SPA,PROF_GORROS_DE_PISCINAS_LYCRA,,Gorro lycra,true,2026-02-19T16:42:08.795Z\r\nITEM_GORROS_DE_PISCINAS_LATEX,Gorros de piscinas  latex,CAT_SPA,PROF_GORROS_DE_PISCINAS_LATEX,,Gorro Latex,true,2026-02-19T16:42:08.795Z\r\nITEM_PISCINA_TEMPERADA_NOCTURNA_EXCLUSIVA_HASTA_2_HORAS,Piscina temperada nocturna exclusiva hasta 2 horas,CAT_SPA,PROF_PISCINA_TEMPERADA_NOCTURNA_EXCLUSIVA_HASTA_2_HORAS,,Piscina temperada nocturna exclusiva por 1 hora de 20:00 a 21:00,true,2026-02-19T16:42:08.795Z\r\nITEM_HABITACION_SINGLE_HOTEL_B_B,Habitación single hotel B&B,CAT_ALOJAMIENTO,PROF_HABITACION_SINGLE_HOTEL_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_HABITACION_DOBLE_HOTEL_B_B,Habitación Doble hotel B&B,CAT_ALOJAMIENTO,PROF_HABITACION_DOBLE_HOTEL_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_HABITACION_TRIPLE_HOTEL_B_B,Habitación Triple hotel B&B,CAT_ALOJAMIENTO,PROF_HABITACION_TRIPLE_HOTEL_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_HABITACION_CUADRUPLE_HOTEL_B_B,Habitación Cuadruple hotel  B&B,CAT_ALOJAMIENTO,PROF_HABITACION_CUADRUPLE_HOTEL_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_HABITACION_QUINTUPLE_HOTEL_B_B,Habitación Quintuple hotel B&B,CAT_ALOJAMIENTO,PROF_HABITACION_QUINTUPLE_HOTEL_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_VALOR_6_PASAJEROS_EN_CABANA_B_B,\"Valor 6 pasajeros, en cabaña B&B\",CAT_ALOJAMIENTO,PROF_VALOR_6_PASAJEROS_EN_CABANA_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_VALOR_7_PASAJEROS_EN_CABANA_B_B,\"Valor 7 pasajeros, en cabaña B&B\",CAT_ALOJAMIENTO,PROF_VALOR_7_PASAJEROS_EN_CABANA_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_VALOR_8_PASAJEROS_EN_CABANA_B_B,\"Valor 8 pasajeros, en cabaña B&B\",CAT_ALOJAMIENTO,PROF_VALOR_8_PASAJEROS_EN_CABANA_B_B,,\"Desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_VALOR_PAX_ADICIONAL_EN_LA_MISMA_HABITACION,Valor Pax adicional en la misma habitacion,CAT_ALOJAMIENTO,PROF_VALOR_PAX_ADICIONAL_EN_LA_MISMA_HABITACION,,\"Check in de habitaciones desde las 4 PM.Incluye: desayuno, cabalgatas, canopy, kayak, botes, standup paddle, canchas tenis, minigolf, baby, pesca con mosca y piscina temperada\",true,2026-02-19T16:42:08.795Z\r\nITEM_EARLY_CHECK_IN_POR_HABITACION_DE_HOTEL,\"Early check in, por habitacion de hotel\",CAT_ALOJAMIENTO,PROF_EARLY_CHECK_IN_POR_HABITACION_DE_HOTEL,,\"Check in anticipado desde las 12:00, segun disponibilidad.\",true,2026-02-19T16:42:08.795Z\r\nITEM_LATE_CHECK_OUT_POR_HABITACION_DE_HOTEL,\"Late check out, por habitacion de hotel\",CAT_ALOJAMIENTO,PROF_LATE_CHECK_OUT_POR_HABITACION_DE_HOTEL,,\"Check out hasta las 16:00, segun disponibilidad\",true,2026-02-19T16:42:08.795Z\r\nITEM_EARLY_CHECK_IN_POR_CABANA,\"Early check in, por cabaña\",CAT_ALOJAMIENTO,PROF_EARLY_CHECK_IN_POR_CABANA,,\"Check in anticipado desde las 12:00, segun disponibilidad.\",true,2026-02-19T16:42:08.795Z\r\nITEM_LATE_CHECK_OUT_POR_CABANA,\"Late check out, por cabaña\",CAT_ALOJAMIENTO,PROF_LATE_CHECK_OUT_POR_CABANA,,\"Check out hasta las 16:00, segun disponibilidad\",true,2026-02-19T16:42:08.795Z\r\nITEM_TRASLADO_DE_MALETAS_ENTREGA_Y_RETIRO_FUERA_DE_LAS_HABITACIONES_VALOR_POR_PERSONA,\"Traslado de maletas, entrega y retiro fuera de las habitaciones, valor por persona\",CAT_ALOJAMIENTO,PROF_TRASLADO_DE_MALETAS_ENTREGA_Y_RETIRO_FUERA_DE_LAS_HABITACIONES_VALOR_POR_PERSONA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_PRODUCTOS_O_REGALOS_EN_LAS_HABITACIONES_VALOR_POR_PERSONA,\"Productos o regalos en las habitaciones, valor por persona\",CAT_ALOJAMIENTO,PROF_PRODUCTOS_O_REGALOS_EN_LAS_HABITACIONES_VALOR_POR_PERSONA,,\"Regalos, aguas o algun detalle en las habitaciones, precio por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_1_RAMO_DE_FLORES_6_ROSAS_ROJAS_BLANCAS_ROSADAS_AMARILLA,\"1 Ramo de flores, 6 rosas, rojas, blancas, rosadas, amarilla\",CAT_OTROS_ARTICULOS,PROF_1_RAMO_DE_FLORES_6_ROSAS_ROJAS_BLANCAS_ROSADAS_AMARILLA,,encargar hasta 72 horas antes,true,2026-02-19T16:42:08.795Z\r\nITEM_1_CHOCOLATE_SAHNE_NUSS_250G_ESPUMANTE_O_BOTELLA_DE_VINO,1 Chocolate Sahne Nuss 250g + espumante o botella de vino,CAT_OTROS_ARTICULOS,PROF_1_CHOCOLATE_SAHNE_NUSS_250G_ESPUMANTE_O_BOTELLA_DE_VINO,,,true,2026-02-19T16:42:08.795Z\r\nITEM_RESMA_DE_HOJAS,Resma de Hojas,CAT_OTROS_ARTICULOS,PROF_RESMA_DE_HOJAS,,,true,2026-02-19T16:42:08.795Z\r\nITEM_LAPICES_AZUL_PASTA,Lapices azul Pasta,CAT_OTROS_ARTICULOS,PROF_LAPICES_AZUL_PASTA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_CORRECTOR_LAPIZ,Corrector lapiz,CAT_OTROS_ARTICULOS,PROF_CORRECTOR_LAPIZ,,,true,2026-02-19T16:42:08.795Z\r\nITEM_PLUMONES_PERMANENTE,Plumones permanente,CAT_OTROS_ARTICULOS,PROF_PLUMONES_PERMANENTE,,,true,2026-02-19T16:42:08.795Z\r\nITEM_PLUMONES_DE_PIZARRA,Plumones de pizarra,CAT_OTROS_ARTICULOS,PROF_PLUMONES_DE_PIZARRA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_FOTOCOPIAS_O_IMPRESION_COLOR,Fotocopias o impresion color,CAT_OTROS_ARTICULOS,PROF_FOTOCOPIAS_O_IMPRESION_COLOR,,hoja de color tamaño carta,true,2026-02-19T16:42:08.795Z\r\nITEM_FOTOCOPIAS_O_IMPRESION_NEGRO,Fotocopias o impresion negro,CAT_OTROS_ARTICULOS,PROF_FOTOCOPIAS_O_IMPRESION_NEGRO,,hoja en blanco y negro tamaño carta,true,2026-02-19T16:42:08.795Z\r\nITEM_ALMUERZOS_PRODUCTORAS_O_CHOFERES_EN_BUFFET,Almuerzos productoras o choferes en buffet,CAT_OTROS_ARTICULOS,PROF_ALMUERZOS_PRODUCTORAS_O_CHOFERES_EN_BUFFET,,Exclusivo solo a los que traen a las empresas,true,2026-02-19T16:42:08.795Z\r\nITEM_GUIAS_EXCLUSIVOS_PARA_CAMINATAS,Guias exclusivos para caminatas,CAT_ACTIVIDADES,PROF_GUIAS_EXCLUSIVOS_PARA_CAMINATAS,,1 guia cada 20 o 25 personas.( Ideal minimo dos para abrir y cerrar el grupo para caminatas),true,2026-02-19T16:42:08.795Z\r\nITEM_CAMINATA_LA_TENCA_DE_FORMA_EXCLUSIVA_1_5_HORAS,\"Caminata \"\"la tenca\"\" de forma exclusiva, 1,5 horas\",CAT_ACTIVIDADES,PROF_CAMINATA_LA_TENCA_DE_FORMA_EXCLUSIVA_1_5_HORAS,1,\"Caminata por circuito la tenca, entremedio de bosques y arroyos del lugar. Es un recorrido por los alrededores del hotel. Tiene una dificultad baja, duracion 1,5 horas y una distancia de 2,3 kilometros. Incluye un agua por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_CAMINATA_AL_MIRADOR_EXCLUSIVA_DIFICULTAD_MEDIA_DURACION_1_HORA,\"Caminata al mirador exclusiva.  Dificultad media, duracion: 1 hora\",CAT_ACTIVIDADES,PROF_CAMINATA_AL_MIRADOR_EXCLUSIVA_DIFICULTAD_MEDIA_DURACION_1_HORA,1,\"Caminata a un mirador donde se puede observar el valle del aconcagua. Circuito ubicado al frente del hotel y es de dificultad media, dura 1 hora y tiene una distancia de 2 kilometros. Caminata incluyeun agua por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_FOGON_PEQUENO_FOGATA_PEQUENA,Fogon pequeño (Fogata pequeña),CAT_ACTIVIDADES,PROF_FOGON_PEQUENO_FOGATA_PEQUENA,,Fogata chica en calderos o pergola. Duración 2.5 horas.,true,2026-02-19T16:42:08.795Z\r\nITEM_FOGATA_GRANDE,Fogata grande,CAT_ACTIVIDADES,PROF_FOGATA_GRANDE,,Fogata grande en actividad de luz. Duración 2.5 horas.,true,2026-02-19T16:42:08.795Z\r\nITEM_CLASE_DE_PESCA_CON_MOSCA_3_HORAS_9_AM_A_12PM,Clase de pesca con mosca 3 horas(9 am a 12pm),CAT_ACTIVIDADES,PROF_CLASE_DE_PESCA_CON_MOSCA_3_HORAS_9_AM_A_12PM,,,true,2026-02-19T16:42:08.795Z\r\nITEM_ARRIENDO_DE_CANA,Arriendo de Caña,CAT_ACTIVIDADES,PROF_ARRIENDO_DE_CANA,,\"Solo caña  todo el dia, las moscas tienen un valor adicional.\",true,2026-02-19T16:42:08.795Z\r\nITEM_PASEOS_A_CABALLO_EXCLUSIVOS_MINIMO_4_PASAJEROS_DURACION_3_4_HORAS_MAXIMO_20_PERSONAS,\"Paseos a Caballo exclusivos, minimo 4 pasajeros, duracion 3-4 horas. Maximo 20 personas\",CAT_ACTIVIDADES,PROF_PASEOS_A_CABALLO_EXCLUSIVOS_MINIMO_4_PASAJEROS_DURACION_3_4_HORAS_MAXIMO_20_PERSONAS,,\"Paseo comienza con una clinica intruductoria y luego practica, donde conoceran el cajón de san francisco y sus bondades. Paseo incluye un agua por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_PASEO_A_CABALLO_VERTIENTE_DEL_TORO,Paseo a caballo Vertiente del toro,CAT_ACTIVIDADES,PROF_PASEO_A_CABALLO_VERTIENTE_DEL_TORO,,4 horas + induccion Almuerzo+cena+ activiades,true,2026-02-19T16:42:08.795Z\r\nITEM_PASEO_A_CABALLO_ALTOS_DEL_GUINDO,Paseo a caballo Altos del Guindo,CAT_ACTIVIDADES,PROF_PASEO_A_CABALLO_ALTOS_DEL_GUINDO,,5 horas + induccion Almuerzo+cena+ activiades,true,2026-02-19T16:42:08.795Z\r\nITEM_USO_DE_ACTIVIDADES,Uso de actividades,CAT_ACTIVIDADES,PROF_USO_DE_ACTIVIDADES,,\"Cabalgatas, canopy, kayak, botes, stand up paddle, cancha de tenis, minigolf, piscina temperada, piscina exterior, camillas de cuarzo, circuitos de trekking etc..\",true,2026-02-19T16:42:08.795Z\r\nITEM_USO_DE_ACTIVIDADES_POR_CORTESIA,Uso de actividades por cortesía,CAT_ACTIVIDADES,PROF_USO_DE_ACTIVIDADES_POR_CORTESIA,,\"Cabalgatas, canopy, kayak, botes, stand up paddle, cancha de tenis, minigolf, piscina temperada, piscina exterior, camillas de cuarzo, circuitos de trekking etc..\",true,2026-02-19T16:42:08.795Z\r\nITEM_YOGA,Yoga,CAT_ACTIVIDADES,PROF_YOGA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_PAINTBALL,Paintball,CAT_TEAMBUILDING,PROF_PAINTBALL,1,\"Juego de paintball, incluye un agua por persona. Duracion aproximada 2 horas. Inlcuye primera carga de pelotas, con posibilidad de recarga por 15.000+ iva por persona\",true,2026-02-19T16:42:08.795Z\r\nITEM_BUSQUEDA_DE_TESORO,Busqueda de tesoro,CAT_TEAMBUILDING,PROF_BUSQUEDA_DE_TESORO,1,\"duracion actividad 2,5 horas\",true,2026-02-19T16:42:08.795Z\r\nITEM_ACTIVIDAD_DE_LA_LUZ,Actividad de la luz,CAT_TEAMBUILDING,PROF_ACTIVIDAD_DE_LA_LUZ,1,\"duracion actividad 1,5 horas aprox\",true,2026-02-19T16:42:08.795Z\r\nITEM_ALIANZAS,Alianzas,CAT_TEAMBUILDING,PROF_ALIANZAS,1,Duracion 2 horas aprox,true,2026-02-19T16:42:08.795Z\r\nITEM_EL_HERIDO,El herido,CAT_TEAMBUILDING,PROF_EL_HERIDO,1,\"Duracion 2,5 horas aprox\",true,2026-02-19T16:42:08.795Z\r\nITEM_EL_NAUFRAGO,El Naufrago,CAT_TEAMBUILDING,PROF_EL_NAUFRAGO,1,duracion 2 horas aprox,true,2026-02-19T16:42:08.795Z\r\nITEM_EL_NAUFRAGO_FULL,El Naufrago Full,CAT_TEAMBUILDING,PROF_EL_NAUFRAGO_FULL,1,\"Duracion 2,5 horas aprox\",true,2026-02-19T16:42:08.795Z\r\nITEM_CONQUISTANDO_LA_CUMBRE,Conquistando la Cumbre,CAT_TEAMBUILDING,PROF_CONQUISTANDO_LA_CUMBRE,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_TIRO_CON_ARCO,Tiro con Arco,CAT_ACTIVIDADES,PROF_TIRO_CON_ARCO,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_MISION_Y_VISION,Mision y Vision,CAT_TEAMBUILDING,PROF_MISION_Y_VISION,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_FABRICA_DE_SAL,Fabrica de sal,CAT_TEAMBUILDING,PROF_FABRICA_DE_SAL,1,duracion 1 hora aprox,true,2026-02-19T16:42:08.795Z\r\nITEM_LA_PIZZA_NOSTRA_PER_TUTTI,La Pizza Nostra Per Tutti,CAT_TEAMBUILDING,PROF_LA_PIZZA_NOSTRA_PER_TUTTI,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_LA_PIZZA_NOSTRA,La Pizza Nostra,CAT_TEAMBUILDING,PROF_LA_PIZZA_NOSTRA,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_THE_BOSS_GRILL,The Boss Grill,CAT_TEAMBUILDING,PROF_THE_BOSS_GRILL,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_COCINANDO_EQUIPOS,Cocinando Equipos,CAT_TEAMBUILDING,PROF_COCINANDO_EQUIPOS,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_FORMANDO_UN_JINETE,Formando un Jinete,CAT_TEAMBUILDING,PROF_FORMANDO_UN_JINETE,,,true,2026-02-19T16:42:08.795Z\r\nITEM_MASTER_CHEF_CORPORATIVO,Master Chef Corporativo,CAT_TEAMBUILDING,PROF_MASTER_CHEF_CORPORATIVO,1,Cada grupo debe preparar los mejores platos,true,2026-02-19T16:42:08.795Z\r\nITEM_DE_LA_MASA_AL_PLATO,De La Masa Al Plato,CAT_TEAMBUILDING,PROF_DE_LA_MASA_AL_PLATO,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_PARRILLADA_EN_EQUIPO,Parrillada en Equipo,CAT_TEAMBUILDING,PROF_PARRILLADA_EN_EQUIPO,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_TALLER_DE_PIZZA_Y_BIRRA,Taller de Pizza y Birra,CAT_TEAMBUILDING,PROF_TALLER_DE_PIZZA_Y_BIRRA,,,true,2026-02-19T16:42:08.795Z\r\nITEM_KARAOKE_CON_COPAS_Y_TAPAS,Karaoke con copas y tapas,CAT_TEAMBUILDING,PROF_KARAOKE_CON_COPAS_Y_TAPAS,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_TALLER_DE_BRASAS_Y_TINTO_SABORES_AL_FUEGO,Taller de Brasas y Tinto: Sabores al Fuego!,CAT_TEAMBUILDING,PROF_TALLER_DE_BRASAS_Y_TINTO_SABORES_AL_FUEGO,,,true,2026-02-19T16:42:08.795Z\r\nITEM_CORDEROS_VINOS,Corderos & Vinos,CAT_TEAMBUILDING,PROF_CORDEROS_VINOS,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_SAFARI_ECUESTRE,Safari Ecuestre,CAT_ACTIVIDADES,PROF_SAFARI_ECUESTRE,,,true,2026-02-19T16:42:08.795Z\r\nITEM_TREKKING_AL_MIRADOR,Trekking al mirador,CAT_ACTIVIDADES,PROF_TREKKING_AL_MIRADOR,,,true,2026-02-19T16:42:08.795Z\r\nITEM_CATA_DE_VINOS,Cata de Vinos,CAT_ACTIVIDADES,PROF_CATA_DE_VINOS,1,,true,2026-02-19T16:42:08.795Z\r\nITEM_LOS_NEUMATICOS,Los Neumaticos,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_LOS_NEUMATICOS,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_TOTEM,Totem,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_TOTEM,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_LA_ESTRELLA,La estrella,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_LA_ESTRELLA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_TIRAR_LA_CUERDA,Tirar la cuerda,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_TIRAR_LA_CUERDA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_EL_EQUILIBRIO,El equilibrio,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_EL_EQUILIBRIO,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_EL_ENREDO,El Enredo,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_EL_ENREDO,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_BAILE_ENTRETENIDO,Baile Entretenido,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_BAILE_ENTRETENIDO,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_GIMNASIA_DE_PAUSA,Gimnasia de Pausa,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_GIMNASIA_DE_PAUSA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_YOGA_2,Yoga,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_YOGA_2,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_LA_BOLITA,La Bolita,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_LA_BOLITA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_ULA_ULA,Ula Ula,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_ULA_ULA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_CARRERA_DE_SACOS,Carrera de Sacos,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_CARRERA_DE_SACOS,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\nITEM_BOB_ESPONJA,Bob Esponja,CAT_TEAMBUILDING_ACTIVIDADES_DE_PAUSA,PROF_BOB_ESPONJA,1,actividades de pausa de 15- 30 minutos aprox. cada una,true,2026-02-19T16:42:08.795Z\r\n",
  "LINEA_DETALLE": "ID_Linea,ID_Cotizacion,ID_Item,Estado_Linea,Dia_Numero,Hora_Inicio,Override_Pax,Override_Cantidad,Override_Duracion_Min,Comentarios,Updated_At\n",
  "PERFILES_PRECIO": "ID_Perfil_Precio,Nombre,Costo_Base_Fijo,Costo_Unitario_Pax,Costo_Unitario_Tiempo,Costo_Unitario_Item,Activo,Updated_At\nPROF_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS,\"Perfil Salon Chinook uso diurno, hasta 320 personas\",385000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SALON_COHO_USO_DIURNO_HASTA_120_PERSONAS,\"Perfil Salon Coho uso diurno, hasta 120 personas\",330000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SALON_FARIO_USO_DIURNO_HASTA_70_PERSONAS,\"Perfil Salon Fario uso diurno, hasta 70 personas\",242000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SALON_ARCOIRIS_USO_DIURNO_HASTA_70_PERSONAS,\"Perfil Salón Arcoiris uso diurno, hasta 70 personas\",209000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DIRECTORIO_USO_DIURNO_PARA_16_PERSONAS_MESA_IMPERIAL,\"Perfil Directorio uso diurno para 16 personas, mesa imperial\",319000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DOMO_PARA_240_PERSONAS,Perfil Domo para 240 personas,550000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIOS_DE_MONTAJE_CHINOOK_DURANTE_EL_ARRIENDO_DE_SALON,Perfil Cambios de montaje  Chinook durante el arriendo de salon.,150000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIOS_DE_MONTAJE_COHO_DURANTE_EL_ARRIENDO_DE_SALON,Perfil Cambios de montaje Coho durante el arriendo de salon.,100000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIOS_DE_MONTAJE_FARIOS_Y_ARCOIRIS_DURANTE_EL_ARRIENDO_DE_SALON,Perfil Cambios de montaje  Farios y Arcoiris durante el arriendo de salon.,80000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_80_PERSONAS_8_HORAS_USO_DIURNO,Perfil Comedor VIP y terraza (2do piso) para 80 personas 8 horas uso diurno,365000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_8_HORAS_USO_DIURNO,\"Perfil Comedor truchita o ex pool y terraza para 35 personas, 8 horas uso diurno\",250000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_8_HORAS_USO_DIURNO,\"Perfil Arriendo pergola con parrilla para 16 personas, 8 horas uso diurno\",250000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_VIP_Y_TERRAZA_2DO_PISO_PARA_70_PERSONAS_1_5_HRS_AM_O_PM_ALMUERZO_O_CENA,\"Perfil Comedor VIP y terraza (2do piso) para 70 personas 1,5 hrs / AM O PM (ALMUERZO O CENA)\",265000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_1_5_HORAS_AM_O_PM_ALMUERZO_O_CENA,\"Perfil Comedor truchita o ex pool y terraza para 35 personas 1,5 horas / AM O PM (ALMUERZO O CENA)\",150000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ARRIENDO_PERGOLA_CON_PARRILLA_PARA_16_PERSONAS_4_HORAS,\"Perfil Arriendo pergola con parrilla para 16 personas, 4 horas\",150000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ARRIENDO_PERGOLA_PICADERO_SOLO_CON_AUTORIZACION_2_DIAS_ANTES,\"Perfil Arriendo pergola picadero solo con autorizacion, 2 dias antes.\",100000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TECNICA_PARA_SALONES_USO_DIURNO,Perfil Tecnica para salones uso diurno.,165000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_AUDIO_4_HORAS_EN_LA_NOCHE,Perfil Audio 4 horas en la noche,300000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_AMPLIFICACION_EXTERIOR,Perfil Amplificacion exterior,200000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MICROFONO_INALAMBRICO_ADICIONAL,Perfil Microfono inalambrico adicional,50000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MICROFONO_SOLAPA_ADICIONAL,Perfil Microfono solapa adicional,50000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_OPERADOR_PARA_AUDIO_8_HRS,Perfil Operador para audio 8 hrs,140000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PAPELOGRAFO_ADICIONAL_PARA_EL_SALON,Perfil Papelografo adicional para el salon,30000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COFFEE_BASICO,Perfil Coffee Básico,6380,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COFFEE_INTERMEDIO,Perfil Coffee Intermedio,10395,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COFFE_FULL,Perfil Coffe Full,16500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COFFE_LIGHT,Perfil Coffe Light,10395,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ADICIONAR_COFFE_DENTRO_DEL_SALON,Perfil Adicionar coffe dentro del Salon,3500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MAQUINA_CAFE_MILANO_CON_CARGA_PARA_120_CAFES_APP_AUTOSERVICIO,Perfil Maquina Cafe Milano con carga para 120 cafes app. ( autoservicio),200000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_TAPADITO,Perfil 1 tapadito,2500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_MEDIALUNA,Perfil 1 medialuna,1800,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_GALLETAS_DE_MANTEQUILLA_3_POR_PERSONA,Perfil Galletas de mantequilla  3 por persona,1500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAFE_DE_GRANO_O_TE_EN_SALON_8_HRS,Perfil Cafe de grano o te en salon 8 hrs,7500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DISPENSADOR_DE_AGUA_20_LTS_EN_SALON,Perfil Dispensador de agua 20 Lts en salon,60000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_RECARGA_DE_BIDON_DE_20_LTS_PARA_DISPENSADOR_DE_AGUA,Perfil Recarga de bidon de 20 Lts para dispensador de agua,40000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAFE_DE_GRANO_TE_Y_AGUA_FRIA_CALIENTE_EN_SALON_POR_8_HORAS,\"Perfil Cafe de grano, te y agua fria /caliente en salon  por 8 horas.\",10000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LUCES_PERIMETRALES_SALON_CHINOOK_O_VIP,Perfil Luces perimetrales salon chinook o vip,160000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,Perfil DJ y/o Karaoke por 4 hrs para grupos menores 50 Pax,850000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HORA_EXTRA_DJ_Y_O_KARAOKE_POR_4_HRS_PARA_GRUPOS_MENORES_50_PAX,Perfil Hora extra DJ y/o Karaoke por 4 hrs para grupos menores 50 Pax,276250,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,Perfil DJ y/o Karaoke para grupos mayores a 50 Pax,1200000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HORA_EXTRA_DJ_Y_O_KARAOKE_PARA_GRUPOS_MAYORES_A_50_PAX,Perfil Hora extra DJ y/o Karaoke para grupos mayores a 50 Pax,390000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS_4_HORAS_NOCHE,\"Perfil Salon chinook con fogata, hasta 300 personas, 4 horas noche\",500000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS,\"Perfil Salon chinook con fogata, hasta 300 personas\",750000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS_4_HORAS_NOCHE,\"Perfil Comedor VIP con fogata, 2 piso hasta 70 personas, 4 horas noche\",360000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS,\"Perfil Comedor VIP con fogata, 2 piso hasta 70 personas\",540000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ESPACIO_DEL_BAR_PARA_KARAOKE_HASTA_50_PERSONAS_POR_4_HRS_NOCHE,\"Perfil Espacio del Bar para karaoke, hasta 50 personas por 4 hrs noche\",300000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DOMO_PARA_FIESTAS_CON_FOGATA_HASTA_250_PERSONAS_4_HORAS_NOCHE,\"Perfil Domo para fiestas con fogata, hasta 250 personas, 4 horas noche\",600000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LOUNGE_EN_TERRAZAS_SILLONES_MESAS_Y_FOGONES_HASTA_50_PAX_VALOR_PERSONA,\"Perfil Lounge en terrazas (sillones, mesas y fogones), hasta 50 pax. Valor  persona\",0,8000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TICKET_DE_TRAGO,Perfil Ticket de trago,4850,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TICKET_DE_CERVEZA,Perfil Ticket de cerveza,3529,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TICKET_DE_TRAGO_VIP,Perfil Ticket de trago Vip,6800,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAR_ABIERTO_4_HORAS_VALOR_POR_PERSONA,\"Perfil Bar abierto 4 horas, valor por persona\",30800,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HORA_EXTRA_BAR_ABIERTO_POR_PERSONA,Perfil Hora extra Bar abierto por persona,10010,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAR_ABIERTO_SIN_ALCOHOL_4_HORAS_VALOR_POR_PERSONA,\"Perfil Bar abierto sin alcohol 4 horas, valor por persona\",32000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HORA_EXTRA_BAR_ABIERTO_SIN_ALCOHOL_POR_PERSONA,Perfil Hora extra Bar abierto sin alcohol por persona,10400,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAR_ABIERTO_VIP_4_HORAS_VALOR_POR_PERSONA,\"Perfil Bar abierto VIP  4 horas, valor por persona\",38000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HORA_EXTRA_BAR_ABIERTO_VIP_POR_PERSONA,Perfil Hora extra Bar abierto Vip por persona,12350,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_4_HORAS_POR_PERSONA,\"Perfil Bar Abierto de bebidas en vaso por 4 horas, por persona\",12000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAR_ABIERTO_DE_BEBIDAS_EN_VASO_POR_8_HORAS_POR_PERSONA,\"Perfil Bar Abierto de bebidas en vaso por 8 horas, por persona\",20000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BEBIDAS,Perfil Bebidas,1933,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TICKET_DE_BEBIDA_O_AGUA,Perfil Ticket de bebida o agua,1933,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BARRIL_DE_CERVEZA_KUNTSMAN_TOROBAYO_30L,Perfil Barril de cerveza kuntsman torobayo 30L,220000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BEBESTIBLES_ADICIONALES_EN_SALON_BEBIDAS_JUGOS_NATURALES_AGUA_MINERAL,\"Perfil Bebestibles adicionales en Salón (Bebidas, Jugos Naturales, Agua Mineral)\",0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VINO_CASTILLO_MOLINA,Perfil Vino Castillo Molina,13025,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VINO_CASILLERO_DEL_DIABLO_RESERVA_ESPECIAL,Perfil Vino Casillero del diablo Reserva Especial,13445,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VINO_MARQUES_CASA_CONCHA,Perfil Vino Marques Casa Concha,20168,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIO_DE_HORARIO_DEL_DESAYUNO_1_HORA_MINIMO_30_PERSONAS,\"Perfil Cambio de horario del desayuno 1 hora, minimo 30 personas\",6500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIO_DE_HORARIO_DEL_DESAYUNO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,\"Perfil Cambio de horario del desayuno por media hora , minimo 30 personas\",4000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIO_DE_HORARIO_DE_ALMUERZO_POR_MEDIA_HORA_MINIMO_30_PERSONAS,\"Perfil Cambio de horario de almuerzo por media hora, minimo 30 personas\",6500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EXTENSION_MEDIA_HORA_HORARIO_DE_CENA,Perfil Extension media hora horario de cena,8000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMBIO_DE_LUGAR_DE_SERVICIO_DE_ALIMENTACION,Perfil Cambio de lugar de servicio de alimentacion,10000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DESAYUNO,Perfil Desayuno,12500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DESAYUNO_INCLUIDO_POR_ALOJAMIENTO,Perfil Desayuno incluido por alojamiento,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ALMUERZO_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,\"Perfil Almuerzo Sugerencias del chef  en formato Buffet, mas de 30 pasajeros. Menos de 30 es carta\",27311,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CENA_SUGERENCIAS_DEL_CHEF_EN_FORMATO_BUFFET_MAS_DE_30_PASAJEROS_MENOS_DE_30_ES_CARTA,\"Perfil Cena Sugerencias del chef  en formato Buffet, mas de 30 pasajeros. Menos de 30 es carta\",27311,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ALMUERZO_O_CENA_A_LA_CARTA,Perfil Almuerzo o cena a la carta,35000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ALMUERZO_O_CENA_A_LA_CARTA_VIP,Perfil Almuerzo o cena a la carta VIP,45000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CENA_O_ALMUERZO_PARRILLA_30_O_MAS_PAX,\"Perfil Cena o Almuerzo parrilla, 30 o mas  pax\",35000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CENA_O_ALMUERZO_PARRILLA_MENOS_DE_30_PAX,\"Perfil Cena o Almuerzo parrilla, menos de 30 pax\",45000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ONCE,Perfil Once,9800,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BOX_LUNCH_COMO_UNA_ONCE_EN_CAJITAS_INDIVIDUALES_PARA_QUE_SE_LA_PUEDAN_LLEVAR,Perfil Box lunch (Como una Once en cajitas individuales para que se la puedan llevar),12000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CATA_DE_VINOS_CON_SOMELIER_MINIMO_10_PERSONAS_Y_HASTA_40_DURACION_1_HORA,\"Perfil Cata de vinos con somelier, minimo 10 personas y hasta 40.  Duración 1 hora\",300000,24000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PICOTEO_PARRILLANDO_CON_AMIGOS_MINIMO_20_PERSONAS,Perfil Picoteo parrillando con amigos: minimo 20 personas,400000,20000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_APERITIVO_TEMATICO_JUGANDO_EN_LA_BARRA_MINIMO_20_PERSONAS_MAXIMO_1_5_HORAS,\"Perfil Aperitivo tematico: Jugando en la barra, minimo 20 personas. Maximo 1,5 horas\",400000,20000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TABLA_DE_QUESO_6_PAX,Perfil Tabla de Queso 6 Pax,30000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TABLA_FIAMBRES_6_PAX,Perfil Tabla Fiambres 6 Pax,30000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TABLA_MIXTA_QUESOS_Y_FIAMBRES_6_PAX,Perfil Tabla Mixta Quesos y Fiambres 6 pax,30000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TABLA_MIX_TAPADITOS_QUICHES_Y_MINI_EMPANADAS_6_PAX,\"Perfil Tabla Mix Tapaditos, Quiches y Mini Empanadas 6 pax\",60000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TABLA_VEGANA_6_PAX,Perfil Tabla vegana 6 pax,60000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COCTAIL_BASICO_MINIMO_15_PASAJEROS,\"Perfil Coctail basico, minimo 15 pasajeros.\",13200,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COCTAIL_CHILENO_MINIMO_15_PASAJEROS,\"Perfil Coctail chileno, minimo 15 pasajeros.\",15000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CORDERO_A_LA_ESPADA_CORDERO_CON_PAN_AMASADO_Y_SALSAS_PARA_20_PAX,Perfil Cordero a la espada (Cordero con pan amasado y salsas para 20 pax),380000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PIERNA_DE_CERDO_16_HRS_AL_HORNO_CON_AMASADO_Y_3_SALSAS_PARA_PICOTEO,\"Perfil Pierna de cerdo 16 hrs al horno, con amasado y 3 salsas para picoteo\",380000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EMPANADAS_COCTEL_PINO_QUESO_Y_NAPOLITANA,\"Perfil Empanadas coctel( pino, queso y napolitana)\",1000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SERVICIO_DE_TRASNOCHE_CONSOME_250CC_CON_2_TAPADITOS,Perfil Servicio de trasnoche Consome 250cc con 2 tapaditos,50000,10000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PUNTO_DE_HIDRATACION,Perfil Punto de hidratación,6000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_FRUTA_DE_ESTACION,Perfil 1 fruta de estación,1500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_BARRA_DE_CEREAL,Perfil 1 barra de cereal,1500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TORTA_CHOCOLATE_16_PAX,Perfil Torta Chocolate 16 pax,53000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TORTA_CARROTCAKE_14_PAX,Perfil Torta Carrotcake 14 pax,53000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CHEESECAKE_DE_OREO_14_PAX,Perfil Cheesecake de Oreo 14 pax,53000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TORTA_SAN_FRANCISCO_MANJAR_NUEZ_15_PAX,Perfil Torta San Francisco manjar nuez 15 pax,53000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TROZO_DE_TORTA_DE_CHOCOLATE_ESTACION_CAFE_O_TE_EN_COMEDOR,Perfil Trozo de torta de Chocolate + estacion cafe o té en comedor,7983,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TROZO_DE_TORTA_CARROT_CAKE_ESTACION_CAFE_O_TE_EN_COMEDOR,Perfil Trozo de torta Carrot Cake + estacion cafe o té en comedor,7983,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TROZO_DE_CHEESE_CAKE_OREO_ESTACION_CAFE_O_TE_EN_COMEDOR,Perfil Trozo de Cheese Cake Oreo + estacion cafe o té en comedor,7983,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MASAJISTA_EXCLUSIVA_PARA_MASAJES_RELAX_30_MINUTOS,\"Perfil Masajista exclusiva, para masajes relax 30 minutos\",300000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MASAJES_DE_RELAJACION_DE_MEDIA_HORA,Perfil Masajes de relajacion de media hora,25210,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_GORROS_DE_PISCINAS_LYCRA,Perfil Gorros de piscinas  lycra,3782,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_GORROS_DE_PISCINAS_LATEX,Perfil Gorros de piscinas  latex,2101,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PISCINA_TEMPERADA_NOCTURNA_EXCLUSIVA_HASTA_2_HORAS,Perfil Piscina temperada nocturna exclusiva hasta 2 horas,250000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HABITACION_SINGLE_HOTEL_B_B,Perfil Habitación single hotel B&B,120630,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HABITACION_DOBLE_HOTEL_B_B,Perfil Habitación Doble hotel B&B,189219,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HABITACION_TRIPLE_HOTEL_B_B,Perfil Habitación Triple hotel B&B,239712,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HABITACION_CUADRUPLE_HOTEL_B_B,Perfil Habitación Cuadruple hotel  B&B,290206,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_HABITACION_QUINTUPLE_HOTEL_B_B,Perfil Habitación Quintuple hotel B&B,342097,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VALOR_6_PASAJEROS_EN_CABANA_B_B,\"Perfil Valor 6 pasajeros, en cabaña B&B\",393987,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VALOR_7_PASAJEROS_EN_CABANA_B_B,\"Perfil Valor 7 pasajeros, en cabaña B&B\",445870,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VALOR_8_PASAJEROS_EN_CABANA_B_B,\"Perfil Valor 8 pasajeros, en cabaña B&B\",497769,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_VALOR_PAX_ADICIONAL_EN_LA_MISMA_HABITACION,Perfil Valor Pax adicional en la misma habitacion,43908,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EARLY_CHECK_IN_POR_HABITACION_DE_HOTEL,\"Perfil Early check in, por habitacion de hotel\",29412,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LATE_CHECK_OUT_POR_HABITACION_DE_HOTEL,\"Perfil Late check out, por habitacion de hotel\",29412,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EARLY_CHECK_IN_POR_CABANA,\"Perfil Early check in, por cabaña\",46218,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LATE_CHECK_OUT_POR_CABANA,\"Perfil Late check out, por cabaña\",46218,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TRASLADO_DE_MALETAS_ENTREGA_Y_RETIRO_FUERA_DE_LAS_HABITACIONES_VALOR_POR_PERSONA,\"Perfil Traslado de maletas, entrega y retiro fuera de las habitaciones, valor por persona\",5000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PRODUCTOS_O_REGALOS_EN_LAS_HABITACIONES_VALOR_POR_PERSONA,\"Perfil Productos o regalos en las habitaciones, valor por persona\",2000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_RAMO_DE_FLORES_6_ROSAS_ROJAS_BLANCAS_ROSADAS_AMARILLA,\"Perfil 1 Ramo de flores, 6 rosas, rojas, blancas, rosadas, amarilla\",50000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_1_CHOCOLATE_SAHNE_NUSS_250G_ESPUMANTE_O_BOTELLA_DE_VINO,Perfil 1 Chocolate Sahne Nuss 250g + espumante o botella de vino,25000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_RESMA_DE_HOJAS,Perfil Resma de Hojas,12000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LAPICES_AZUL_PASTA,Perfil Lapices azul Pasta,1000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CORRECTOR_LAPIZ,Perfil Corrector lapiz,3500,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PLUMONES_PERMANENTE,Perfil Plumones permanente,1000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PLUMONES_DE_PIZARRA,Perfil Plumones de pizarra,800,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FOTOCOPIAS_O_IMPRESION_COLOR,Perfil Fotocopias o impresion color,600,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FOTOCOPIAS_O_IMPRESION_NEGRO,Perfil Fotocopias o impresion negro,300,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ALMUERZOS_PRODUCTORAS_O_CHOFERES_EN_BUFFET,Perfil Almuerzos productoras o choferes en buffet,16387,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_GUIAS_EXCLUSIVOS_PARA_CAMINATAS,Perfil Guias exclusivos para caminatas,80000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMINATA_LA_TENCA_DE_FORMA_EXCLUSIVA_1_5_HORAS,\"Perfil Caminata \"\"la tenca\"\" de forma exclusiva, 1,5 horas\",300000,10000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CAMINATA_AL_MIRADOR_EXCLUSIVA_DIFICULTAD_MEDIA_DURACION_1_HORA,\"Perfil Caminata al mirador exclusiva.  Dificultad media, duracion: 1 hora\",300000,10000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FOGON_PEQUENO_FOGATA_PEQUENA,Perfil Fogon pequeño (Fogata pequeña),100000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FOGATA_GRANDE,Perfil Fogata grande,250000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CLASE_DE_PESCA_CON_MOSCA_3_HORAS_9_AM_A_12PM,Perfil Clase de pesca con mosca 3 horas(9 am a 12pm),63025,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ARRIENDO_DE_CANA,Perfil Arriendo de Caña,12605,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PASEOS_A_CABALLO_EXCLUSIVOS_MINIMO_4_PASAJEROS_DURACION_3_4_HORAS_MAXIMO_20_PERSONAS,\"Perfil Paseos a Caballo exclusivos, minimo 4 pasajeros, duracion 3-4 horas. Maximo 20 personas\",42017,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PASEO_A_CABALLO_VERTIENTE_DEL_TORO,Perfil Paseo a caballo Vertiente del toro,109000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PASEO_A_CABALLO_ALTOS_DEL_GUINDO,Perfil Paseo a caballo Altos del Guindo,119000,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_USO_DE_ACTIVIDADES,Perfil Uso de actividades,21,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_USO_DE_ACTIVIDADES_POR_CORTESIA,Perfil Uso de actividades por cortesía,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_YOGA,Perfil Yoga,300000,10000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PAINTBALL,Perfil Paintball,1000000,35000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BUSQUEDA_DE_TESORO,Perfil Busqueda de tesoro,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ACTIVIDAD_DE_LA_LUZ,Perfil Actividad de la luz,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ALIANZAS,Perfil Alianzas,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EL_HERIDO,Perfil El herido,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EL_NAUFRAGO,Perfil El Naufrago,1000000,20000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EL_NAUFRAGO_FULL,Perfil El Naufrago Full,1000000,35000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CONQUISTANDO_LA_CUMBRE,Perfil Conquistando la Cumbre,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TIRO_CON_ARCO,Perfil Tiro con Arco,660000,10000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MISION_Y_VISION,Perfil Mision y Vision,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FABRICA_DE_SAL,Perfil Fabrica de sal,500000,15000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LA_PIZZA_NOSTRA_PER_TUTTI,Perfil La Pizza Nostra Per Tutti,575000,55000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LA_PIZZA_NOSTRA,Perfil La Pizza Nostra,575000,30000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_THE_BOSS_GRILL,Perfil The Boss Grill,400000,55000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_COCINANDO_EQUIPOS,Perfil Cocinando Equipos,750000,55000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_FORMANDO_UN_JINETE,Perfil Formando un Jinete,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_MASTER_CHEF_CORPORATIVO,Perfil Master Chef Corporativo,750000,30000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_DE_LA_MASA_AL_PLATO,Perfil De La Masa Al Plato,500000,55000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_PARRILLADA_EN_EQUIPO,Perfil Parrillada en Equipo,500000,65000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TALLER_DE_PIZZA_Y_BIRRA,Perfil Taller de Pizza y Birra,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_KARAOKE_CON_COPAS_Y_TAPAS,Perfil Karaoke con copas y tapas,650000,46800,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TALLER_DE_BRASAS_Y_TINTO_SABORES_AL_FUEGO,Perfil Taller de Brasas y Tinto: Sabores al Fuego!,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CORDEROS_VINOS,Perfil Corderos & Vinos,500000,50000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_SAFARI_ECUESTRE,Perfil Safari Ecuestre,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TREKKING_AL_MIRADOR,Perfil Trekking al mirador,0,0,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CATA_DE_VINOS,Perfil Cata de Vinos,300000,24000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LOS_NEUMATICOS,Perfil Los Neumaticos,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TOTEM,Perfil Totem,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LA_ESTRELLA,Perfil La estrella,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_TIRAR_LA_CUERDA,Perfil Tirar la cuerda,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EL_EQUILIBRIO,Perfil El equilibrio,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_EL_ENREDO,Perfil El Enredo,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BAILE_ENTRETENIDO,Perfil Baile Entretenido,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_GIMNASIA_DE_PAUSA,Perfil Gimnasia de Pausa,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_YOGA_2,Perfil Yoga,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_LA_BOLITA,Perfil La Bolita,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_ULA_ULA,Perfil Ula Ula,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_CARRERA_DE_SACOS,Perfil Carrera de Sacos,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\nPROF_BOB_ESPONJA,Perfil Bob Esponja,150000,3000,0,0,true,2026-02-19T16:42:08.795Z\n",
  "REGLAS_NEGOCIO": "ID_Regla,Nombre,Etapa,Scope,Tipo_Accion,Hook,Condicion_JSON,Payload_JSON,Prioridad,Acumulable,Activo,Updated_At\nR_AUT_0001,\"Maximo 320 pax - Salon Chinook uso diurno, hasta 320 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_CHINOOK_USO_DIURNO_HASTA_320_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},320]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 320 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0002,\"Maximo 120 pax - Salon Coho uso diurno, hasta 120 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_COHO_USO_DIURNO_HASTA_120_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},120]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 120 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0003,\"Maximo 70 pax - Salon Fario uso diurno, hasta 70 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_FARIO_USO_DIURNO_HASTA_70_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},70]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 70 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0004,\"Maximo 70 pax - Salón Arcoiris uso diurno, hasta 70 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_ARCOIRIS_USO_DIURNO_HASTA_70_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},70]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 70 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0005,\"Maximo 35 pax - Comedor truchita o ex pool y terraza para 35 personas, 8 horas uso diurno\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_8_HORAS_USO_DIURNO\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},35]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 35 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0006,\"Maximo 35 pax - Comedor truchita o ex pool y terraza para 35 personas 1,5 horas / AM O PM (ALMUERZO O CENA)\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COMEDOR_TRUCHITA_O_EX_POOL_Y_TERRAZA_PARA_35_PERSONAS_1_5_HORAS_AM_O_PM_ALMUERZO_O_CENA\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},35]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 35 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0007,\"Maximo 300 pax - Salon chinook con fogata, hasta 300 personas, 4 horas noche\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS_4_HORAS_NOCHE\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},300]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 300 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0008,\"Maximo 300 pax - Salon chinook con fogata, hasta 300 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_SALON_CHINOOK_CON_FOGATA_HASTA_300_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},300]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 300 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0009,\"Maximo 70 pax - Comedor VIP con fogata, 2 piso hasta 70 personas, 4 horas noche\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS_4_HORAS_NOCHE\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},70]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 70 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0010,\"Maximo 70 pax - Comedor VIP con fogata, 2 piso hasta 70 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COMEDOR_VIP_CON_FOGATA_2_PISO_HASTA_70_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},70]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 70 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0011,\"Maximo 50 pax - Espacio del Bar para karaoke, hasta 50 personas por 4 hrs noche\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_ESPACIO_DEL_BAR_PARA_KARAOKE_HASTA_50_PERSONAS_POR_4_HRS_NOCHE\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},50]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 50 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0012,\"Maximo 250 pax - Domo para fiestas con fogata, hasta 250 personas, 4 horas noche\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_DOMO_PARA_FIESTAS_CON_FOGATA_HASTA_250_PERSONAS_4_HORAS_NOCHE\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},250]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 250 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0013,\"Maximo 50 pax - Lounge en terrazas (sillones, mesas y fogones), hasta 50 pax. Valor  persona\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LOUNGE_EN_TERRAZAS_SILLONES_MESAS_Y_FOGONES_HASTA_50_PAX_VALOR_PERSONA\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},50]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 50 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0014,\"Minimo 30 pax - Cambio de horario del desayuno 1 hora, minimo 30 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CAMBIO_DE_HORARIO_DEL_DESAYUNO_1_HORA_MINIMO_30_PERSONAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},30]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 30 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0015,\"Minimo 30 pax - Cambio de horario del desayuno por media hora , minimo 30 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CAMBIO_DE_HORARIO_DEL_DESAYUNO_POR_MEDIA_HORA_MINIMO_30_PERSONAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},30]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 30 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0016,\"Minimo 30 pax - Cambio de horario de almuerzo por media hora, minimo 30 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CAMBIO_DE_HORARIO_DE_ALMUERZO_POR_MEDIA_HORA_MINIMO_30_PERSONAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},30]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 30 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0017,\"Minimo 30 pax - Cena o Almuerzo parrilla, 30 o mas  pax\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CENA_O_ALMUERZO_PARRILLA_30_O_MAS_PAX\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},30]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 30 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0018,\"Maximo 29 pax - Cena o Almuerzo parrilla, menos de 30 pax\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CENA_O_ALMUERZO_PARRILLA_MENOS_DE_30_PAX\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},29]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 29 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0019,\"Minimo 10 pax - Cata de vinos con somelier, minimo 10 personas y hasta 40.  Duración 1 hora\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CATA_DE_VINOS_CON_SOMELIER_MINIMO_10_PERSONAS_Y_HASTA_40_DURACION_1_HORA\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},10]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 10 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0020,Minimo 20 pax - Picoteo parrillando con amigos: minimo 20 personas,RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PICOTEO_PARRILLANDO_CON_AMIGOS_MINIMO_20_PERSONAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},20]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 20 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0021,\"Minimo 20 pax - Aperitivo tematico: Jugando en la barra, minimo 20 personas. Maximo 1,5 horas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_APERITIVO_TEMATICO_JUGANDO_EN_LA_BARRA_MINIMO_20_PERSONAS_MAXIMO_1_5_HORAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},20]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 20 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0022,\"Minimo 15 pax - Coctail basico, minimo 15 pasajeros.\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COCTAIL_BASICO_MINIMO_15_PASAJEROS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},15]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 15 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0023,\"Minimo 15 pax - Coctail chileno, minimo 15 pasajeros.\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COCTAIL_CHILENO_MINIMO_15_PASAJEROS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},15]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 15 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0024,\"Maximo 50 pax - Pierna de cerdo 16 hrs al horno, con amasado y 3 salsas para picoteo\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PIERNA_DE_CERDO_16_HRS_AL_HORNO_CON_AMASADO_Y_3_SALSAS_PARA_PICOTEO\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},50]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 50 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0025,\"Precio hibrido detectado - Caminata \"\"la tenca\"\" de forma exclusiva, 1,5 horas\",RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CAMINATA_LA_TENCA_DE_FORMA_EXCLUSIVA_1_5_HORAS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":300,\"\"perPax\"\":10,\"\"source\"\":\"\"300.000+ 10.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0026,\"Precio hibrido detectado - Caminata al mirador exclusiva.  Dificultad media, duracion: 1 hora\",RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CAMINATA_AL_MIRADOR_EXCLUSIVA_DIFICULTAD_MEDIA_DURACION_1_HORA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":300,\"\"perPax\"\":10,\"\"source\"\":\"\"300.000+ 10.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0027,\"Minimo 4 pax - Paseos a Caballo exclusivos, minimo 4 pasajeros, duracion 3-4 horas. Maximo 20 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PASEOS_A_CABALLO_EXCLUSIVOS_MINIMO_4_PASAJEROS_DURACION_3_4_HORAS_MAXIMO_20_PERSONAS\"\"]},{\"\"<\"\":[{\"\"var\"\":\"\"linea._pax\"\"},4]}]}\",\"{\"\"message\"\":\"\"Este item requiere minimo 4 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0028,\"Maximo 20 pax - Paseos a Caballo exclusivos, minimo 4 pasajeros, duracion 3-4 horas. Maximo 20 personas\",RESTRICCION_UI,ITEM,ERROR,,\"{\"\"and\"\":[{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PASEOS_A_CABALLO_EXCLUSIVOS_MINIMO_4_PASAJEROS_DURACION_3_4_HORAS_MAXIMO_20_PERSONAS\"\"]},{\"\">\"\":[{\"\"var\"\":\"\"linea._pax\"\"},20]}]}\",\"{\"\"message\"\":\"\"Este item permite maximo 20 pax.\"\"}\",20,false,true,2026-02-19T23:30:00.000Z\nR_AUT_0029,Precio hibrido detectado - Yoga,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_YOGA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":300,\"\"perPax\"\":10,\"\"source\"\":\"\"300.000 + 10.000 pesos por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0030,Precio hibrido detectado - Paintball,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PAINTBALL\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":1,\"\"perPax\"\":35,\"\"source\"\":\"\"1.000.000+ 35.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0031,Precio hibrido detectado - Busqueda de tesoro,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_BUSQUEDA_DE_TESORO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0032,Precio hibrido detectado - Actividad de la luz,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_ACTIVIDAD_DE_LA_LUZ\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0033,Precio hibrido detectado - Alianzas,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_ALIANZAS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0034,Precio hibrido detectado - El herido,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_EL_HERIDO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0035,Precio hibrido detectado - El Naufrago,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_EL_NAUFRAGO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":1,\"\"perPax\"\":20,\"\"source\"\":\"\"1.000.000 + 20.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0036,Precio hibrido detectado - El Naufrago Full,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_EL_NAUFRAGO_FULL\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":1,\"\"perPax\"\":35,\"\"source\"\":\"\"1.000.000+ 35.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0037,Precio hibrido detectado - Conquistando la Cumbre,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CONQUISTANDO_LA_CUMBRE\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0038,Precio hibrido detectado - Tiro con Arco,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_TIRO_CON_ARCO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":660,\"\"perPax\"\":10,\"\"source\"\":\"\"660.000+ 10.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0039,Precio hibrido detectado - Mision y Vision,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_MISION_Y_VISION\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0040,Precio hibrido detectado - Fabrica de sal,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_FABRICA_DE_SAL\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":15,\"\"source\"\":\"\"500.000+ 15.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0041,Precio hibrido detectado - La Pizza Nostra Per Tutti,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LA_PIZZA_NOSTRA_PER_TUTTI\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":575,\"\"perPax\"\":55,\"\"source\"\":\"\"575.000+55.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0042,Precio hibrido detectado - La Pizza Nostra,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LA_PIZZA_NOSTRA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":575,\"\"perPax\"\":30,\"\"source\"\":\"\"575.000+30.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0043,Precio hibrido detectado - The Boss Grill,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_THE_BOSS_GRILL\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":400,\"\"perPax\"\":55,\"\"source\"\":\"\"400.000 + 55.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0044,Precio hibrido detectado - Cocinando Equipos,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_COCINANDO_EQUIPOS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":750,\"\"perPax\"\":55,\"\"source\"\":\"\"750.000 + 55.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0045,Precio hibrido detectado - Master Chef Corporativo,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_MASTER_CHEF_CORPORATIVO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":750,\"\"perPax\"\":30,\"\"source\"\":\"\"750.000+30.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0046,Precio hibrido detectado - De La Masa Al Plato,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_DE_LA_MASA_AL_PLATO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":55,\"\"source\"\":\"\"500.000+ 55.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0047,Precio hibrido detectado - Parrillada en Equipo,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_PARRILLADA_EN_EQUIPO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":65,\"\"source\"\":\"\"500.000+ 65.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0048,Precio hibrido detectado - Karaoke con copas y tapas,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_KARAOKE_CON_COPAS_Y_TAPAS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":650,\"\"perPax\"\":46.8,\"\"source\"\":\"\"650.000+ 46.800 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0049,Precio hibrido detectado - Corderos & Vinos,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CORDEROS_VINOS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":500,\"\"perPax\"\":50,\"\"source\"\":\"\"500.000+ 50.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0050,Precio hibrido detectado - Cata de Vinos,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CATA_DE_VINOS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":300,\"\"perPax\"\":24,\"\"source\"\":\"\"300.000+ 24.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0051,Precio hibrido detectado - Los Neumaticos,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LOS_NEUMATICOS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0052,Precio hibrido detectado - Totem,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_TOTEM\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0053,Precio hibrido detectado - La estrella,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LA_ESTRELLA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0054,Precio hibrido detectado - Tirar la cuerda,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_TIRAR_LA_CUERDA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0055,Precio hibrido detectado - El equilibrio,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_EL_EQUILIBRIO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0056,Precio hibrido detectado - El Enredo,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_EL_ENREDO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0057,Precio hibrido detectado - Baile Entretenido,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_BAILE_ENTRETENIDO\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0058,Precio hibrido detectado - Gimnasia de Pausa,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_GIMNASIA_DE_PAUSA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0059,Precio hibrido detectado - Yoga,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_YOGA_2\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0060,Precio hibrido detectado - La Bolita,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_LA_BOLITA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0061,Precio hibrido detectado - Ula Ula,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_ULA_ULA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0062,Precio hibrido detectado - Carrera de Sacos,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_CARRERA_DE_SACOS\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\nR_AUT_0063,Precio hibrido detectado - Bob Esponja,RESTRICCION_UI,ITEM,WARNING,,\"{\"\"===\"\":[{\"\"var\"\":\"\"linea.ID_Item\"\"},\"\"ITEM_BOB_ESPONJA\"\"]}\",\"{\"\"message\"\":\"\"Precio base + pax detectado y migrado a perfil de precio\"\",\"\"base\"\":150,\"\"perPax\"\":3,\"\"source\"\":\"\"150.000 + 3.000 por persona\"\"}\",200,true,true,2026-02-19T23:30:00.000Z\n"
};

// ============================================================================
// GENERIC DATABASE LAYER (IStore + GasSheetStore + ModelFactory)
// ============================================================================

class IStore {
  all() {
    throw new Error('Not implemented');
  }

  where(_predicate) {
    throw new Error('Not implemented');
  }

  find(_predicate) {
    throw new Error('Not implemented');
  }

  insert(_data) {
    throw new Error('Not implemented');
  }

  update(_data) {
    throw new Error('Not implemented');
  }

  deleteById(_id) {
    throw new Error('Not implemented');
  }

  truncate() {
    throw new Error('Not implemented');
  }

  getColumns() {
    throw new Error('Not implemented');
  }

  getByRowIndex(_rowIndex) {
    throw new Error('Not implemented');
  }
}




function ensureSpreadsheetApp() {
  if (typeof SpreadsheetApp === 'undefined') {
    throw new Error('GasSheetStore requires Google Apps Script runtime (SpreadsheetApp global missing).');
  }
}

class GasSheetStore extends IStore {
  constructor({ spreadsheetId, tableName, columns = [] }) {
    super();
    ensureSpreadsheetApp();
    this.tableName = tableName;
    this.columns = columns;
    this.primaryKey = (columns.find((c) => String(c.type || '').includes('PK')) || {}).name || '_id';

    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    this.sheet = this.spreadsheet.getSheetByName(tableName);

    if (!this.sheet) {
      throw new Error(`Sheet not found: ${tableName}`);
    }

    this.headerCache = null;
  }

  _getHeaders() {
    if (this.headerCache) return this.headerCache;
    const lastColumn = this.sheet.getLastColumn();
    this.headerCache = this.sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return this.headerCache;
  }

  _rowToObject(row, headers) {
    const out = {};
    headers.forEach((header, index) => {
      out[header] = row[index];
    });
    return out;
  }

  _objectToRow(record, headers) {
    return headers.map((header) => record[header] ?? '');
  }

  all() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return [];

    const lastColumn = this.sheet.getLastColumn();
    const rows = this.sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    const headers = this._getHeaders();

    return rows.map((row) => this._rowToObject(row, headers));
  }

  where(predicate) {
    return this.all().filter((record) => predicate(record));
  }

  find(predicate) {
    const records = this.where(predicate);
    return records.length > 0 ? records[0] : null;
  }

  insert(data) {
    const headers = this._getHeaders();
    const row = this._objectToRow(data, headers);
    this.sheet.appendRow(row);
    return { ...data };
  }

  update(data) {
    const id = data[this.primaryKey];
    if (id === undefined || id === null || id === '') {
      throw new Error(`Missing primary key "${this.primaryKey}" for table "${this.tableName}"`);
    }

    const allRows = this.all();
    const headers = this._getHeaders();
    const index = allRows.findIndex((row) => String(row[this.primaryKey]) === String(id));

    if (index === -1) {
      throw new Error(`Record not found in "${this.tableName}" for id "${id}"`);
    }

    const sheetRow = index + 2;
    const rowValues = this._objectToRow(data, headers);
    this.sheet.getRange(sheetRow, 1, 1, headers.length).setValues([rowValues]);
    return { ...data };
  }

  deleteById(id) {
    const allRows = this.all();
    const index = allRows.findIndex((row) => String(row[this.primaryKey]) === String(id));
    if (index === -1) return false;

    const sheetRow = index + 2;
    this.sheet.deleteRow(sheetRow);
    return true;
  }

  truncate() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow > 1) {
      this.sheet.deleteRows(2, lastRow - 1);
    }
  }

  getColumns() {
    return this._getHeaders();
  }

  getByRowIndex(rowIndex) {
    const allRows = this.all();
    if (rowIndex < 0 || rowIndex >= allRows.length) return null;
    return allRows[rowIndex];
  }
}


function inferPrimaryKey(columns) {
  const pkColumn = columns.find((column) => String(column.type || '').includes('PK'));
  return pkColumn ? pkColumn.name : '_id';
}

function buildModel({ tableName, schema, store }) {
  const columns = schema.columns || [];
  const primaryKey = inferPrimaryKey(columns);

  return {
    tableName,
    schema,
    primaryKey,

    all() {
      return store.all();
    },

    where(predicate) {
      return store.where(predicate);
    },

    find(predicate) {
      return store.find(predicate);
    },

    findById(id) {
      return store.find((record) => String(record[primaryKey]) === String(id));
    },

    create(data) {
      return store.insert(data);
    },

    update(data) {
      return store.update(data);
    },

    deleteById(id) {
      return store.deleteById(id);
    },

    truncate() {
      return store.truncate();
    },

    getColumns() {
      return store.getColumns();
    }
  };
}

class ModelFactory {
  static createModels({ schema, storeFactory }) {
    const models = {};

    for (const [tableName, tableSchema] of Object.entries(schema)) {
      const store = storeFactory({
        tableName,
        schema: tableSchema,
        columns: tableSchema.columns || []
      });

      models[tableName] = buildModel({
        tableName,
        schema: tableSchema,
        store
      });
    }

    return models;
  }
}


// ============================================================================
// DATABASE RUNTIME (shared GAS model routing)
// ============================================================================





const runtimeCache = new Map();

function buildGasModels(spreadsheetId) {
  if (!spreadsheetId) {
    throw new Error('Missing spreadsheetId for GAS runtime');
  }

  return ModelFactory.createModels({
    schema: SHEET_SCHEMA,
    storeFactory: ({ tableName, columns }) => {
      return new GasSheetStore({
        spreadsheetId,
        tableName,
        columns
      });
    }
  });
}

function getGasModels(spreadsheetId) {
  if (!runtimeCache.has(spreadsheetId)) {
    runtimeCache.set(spreadsheetId, buildGasModels(spreadsheetId));
  }

  return runtimeCache.get(spreadsheetId);
}

function clearGasModelsCache() {
  runtimeCache.clear();
}


// ============================================================================
// INITIALIZATION SERVICE
// ============================================================================

/**
 * Database Initialization Service
 *
 * Creates and initializes all Google Sheets tables with proper schema and seed data.
 * Call initializeSheetDb() from GAS editor console (one-time setup).
 */




class InitializeService {
  /**
   * Initialize the entire SheetDB
   *
   * Creates all sheets with proper columns and seed data.
   * Run this ONCE from the Apps Script editor console:
   * > initializeSheetDb()
   *
   * This is the entry point for GAS deployment.
   */
  static initializeSheetDb() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();

      Logger.log('=== Starting SheetDB Initialization ===');

      // Create sheets and add headers
      for (const [tableName, tableSchema] of Object.entries(SHEET_SCHEMA)) {
        const columns = tableSchema.columns;
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('✅ Created sheet: ' + tableName);
        } else {
          Logger.log('⚠️  Sheet already exists: ' + tableName);
        }

        // Set headers (row 1)
        const headerNames = columns.map(col => col.name);
        sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);
        sheet.setFrozenRows(1);
        Logger.log('   Headers set for: ' + tableName);
      }

      // Populate with seed data
      clearGasModelsCache();
      this.populateSeedData(ss.getId());

      Logger.log('✅ Database initialization complete!');
      return { success: true, mensaje: 'Database initialized successfully' };
    } catch (error) {
      Logger.log('❌ Error during initialization: ' + error.toString());
      throw error;
    }
  }

  /**
   * Populate seed data into sheets
   * @private
   */
  static populateSeedData(spreadsheetId) {
    const now = new Date().toISOString();
    const models = getGasModels(spreadsheetId);

    // Seed PERFILES_PRECIO
    const perfiles = models.PERFILES_PRECIO;
    if (perfiles.all().length === 0) {
      perfiles.create({ ID_Perfil_Precio: 'PROF_COFFEE', Nombre: 'Coffee Intermedio', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 5500, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      perfiles.create({ ID_Perfil_Precio: 'PROF_SALON', Nombre: 'Salón Standard', Costo_Base_Fijo: 220000, Costo_Unitario_Pax: 0, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      perfiles.create({ ID_Perfil_Precio: 'PROF_ALMUERZOS', Nombre: 'Almuerzos Buffet', Costo_Base_Fijo: 0, Costo_Unitario_Pax: 15000, Costo_Unitario_Tiempo: 0, Costo_Unitario_Item: 0, Activo: true, Updated_At: now });
      Logger.log('✅ Seeded PERFILES_PRECIO');
    }

    // Seed CATEGORIAS
    const categorias = models.CATEGORIAS;
    if (categorias.all().length === 0) {
      categorias.create({ ID_Categoria: 'CAT_CAFE', Nombre: 'Cafés', ID_Perfil_Precio_Default: 'PROF_COFFEE', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: false, Def_Duracion_Min: 0, Def_Unidades_Por_Pax: 1, Icono_UI: '☕', Activo: true, Updated_At: now });
      categorias.create({ ID_Categoria: 'CAT_SALONES', Nombre: 'Salones', ID_Perfil_Precio_Default: 'PROF_SALON', Def_Requiere_Pax: false, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 240, Def_Unidades_Por_Pax: 1, Icono_UI: '🏛️', Activo: true, Updated_At: now });
      categorias.create({ ID_Categoria: 'CAT_COMIDAS', Nombre: 'Comidas', ID_Perfil_Precio_Default: 'PROF_ALMUERZOS', Def_Requiere_Pax: true, Def_Requiere_Cant: false, Def_Requiere_Tiempo: false, Def_Requiere_Hora: true, Def_Duracion_Min: 120, Def_Unidades_Por_Pax: 1, Icono_UI: '🍽️', Activo: true, Updated_At: now });
      Logger.log('✅ Seeded CATEGORIAS');
    }

    // Seed ITEM_CATALOGO
    const items = models.ITEM_CATALOGO;
    if (items.all().length === 0) {
      items.create({ ID_Item: 'ITEM_COFFEE_INT', Nombre: 'Coffee Intermedio', ID_Categoria: 'CAT_CAFE', ID_Perfil_Precio_Override: '', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      items.create({ ID_Item: 'ITEM_SALON_FARIO', Nombre: 'Salón Fario', ID_Categoria: 'CAT_SALONES', ID_Perfil_Precio_Override: 'PROF_SALON', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      items.create({ ID_Item: 'ITEM_ALMUERZO_PARRILLA', Nombre: 'Almuerzos Buffet Parrilla', ID_Categoria: 'CAT_COMIDAS', ID_Perfil_Precio_Override: 'PROF_ALMUERZOS', Def_Unidades_Por_Pax_Override: '', Activo: true, Updated_At: now });
      Logger.log('✅ Seeded ITEM_CATALOGO');
    }

    // CLIENTES and COTIZACIONES are empty (users create them)
    Logger.log('✅ CLIENTES sheet ready (empty)');
    Logger.log('✅ COTIZACIONES sheet ready (empty)');
    Logger.log('✅ LINEA_DETALLE sheet ready (empty)');
  }

  /**
   * Delete only schema-managed sheets and recreate with headers.
   * Preserves non-database tabs in the spreadsheet.
   */
  static cleanAllTables(schema) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      Logger.log('=== Cleaning Database Tables ===');

       const schemaTableNames = Object.keys(schema || {});
       const schemaTableSet = new Set(schemaTableNames);

      // Delete only sheets that belong to schema tables.
      // Preserve non-schema tabs (dashboards, notes, manual tabs, etc).
      const allSheets = ss.getSheets();
      for (let i = allSheets.length - 1; i >= 0; i--) {
        const sheet = allSheets[i];
        const sheetName = sheet.getName();
        const isSchemaSheet = schemaTableSet.has(sheetName);
        if (!isSchemaSheet) {
          continue;
        }

        const remainingSheets = ss.getSheets().length;
        if (remainingSheets === 1) {
          // Google Sheets requires at least one tab at all times.
          // Clear if this is the only tab and it belongs to schema.
          sheet.clear();
          Logger.log('Cleared first sheet (keeping minimum 1 sheet)');
        } else {
          ss.deleteSheet(sheet);
          Logger.log('Deleted sheet: ' + sheetName);
        }
      }

      // Now recreate all sheets with headers
      Logger.log('Recreating all sheets...');
      for (const [tableName, tableSchema] of Object.entries(schema || {})) {
        const columns = tableSchema.columns;
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('Created sheet: ' + tableName);
        }

        // Clear any existing data
        sheet.clear();

        // Set headers (row 1)
        const headerNames = columns.map(col => col.name);
        sheet.getRange(1, 1, 1, headerNames.length).setValues([headerNames]);
        sheet.setFrozenRows(1);
        Logger.log('Headers set for: ' + tableName);
      }

      Logger.log('✅ All tables cleaned and recreated!');
      return { success: true, mensaje: 'All tables cleaned and recreated successfully' };
    } catch (error) {
      Logger.log('❌ Error during cleanup: ' + error.toString());
      throw error;
    }
  }

  /**
   * Validate that all sheets exist and have correct columns
   * Useful for debugging after deployment
   */
  static validateSheetDb() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const results = [];

      for (const [tableName, tableSchema] of Object.entries(SHEET_SCHEMA)) {
        const sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          results.push('❌ ' + tableName + ': MISSING');
          continue;
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const expectedColumns = tableSchema.columns.map(col => col.name);
        const columnsMatch = JSON.stringify(headers) === JSON.stringify(expectedColumns);

        if (columnsMatch) {
          results.push('✅ ' + tableName + ': OK (' + headers.length + ' columns)');
        } else {
          results.push('⚠️  ' + tableName + ': Column mismatch');
          results.push('   Expected: ' + expectedColumns.join(', '));
          results.push('   Actual: ' + headers.join(', '));
        }
      }

      Logger.log('=== SheetDB Validation Results ===');
      results.forEach(r => Logger.log(r));
      return results;
    } catch (error) {
      Logger.log('❌ Error during validation: ' + error.toString());
      return ['Error: ' + error.toString()];
    }
  }

  /**
   * Initialize from CSV data map
   * Alternative to initializeSheetDb() for data migration
   *
   * @param {Object} csvDataMap - { tableName: csvDataString }
   * @param {Object} schema - SHEET_SCHEMA with table definitions
   * @param {Object} columnMappings - Optional: { tableName: { csvCol: schemaCol } }
   * @returns {Object} { success, results, warnings, stats }
   */
  static initializeFromCsv(csvDataMap, schema, columnMappings = {}) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const results = {};
      const warnings = [];
      const stats = { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 };

      Logger.log('=== Starting CSV-based Database Initialization ===');

      // Create sheets with headers from schema
      for (const [tableName, tableSchema] of Object.entries(schema)) {
        let sheet = ss.getSheetByName(tableName);

        if (!sheet) {
          sheet = ss.insertSheet(tableName);
          Logger.log('✅ Created sheet: ' + tableName);
          stats.tablesCreated++;
        } else {
          Logger.log('⚠️  Sheet already exists: ' + tableName);
        }

        // Set headers
        const columnNames = tableSchema.columns.map(col => col.name);
        sheet.getRange(1, 1, 1, columnNames.length).setValues([columnNames]);
        sheet.setFrozenRows(1);

        // Migrate and insert CSV data if available
        if (csvDataMap[tableName]) {
          try {
            const migration = this._migrateFromCsv(
              csvDataMap[tableName],
              tableSchema,
              columnMappings[tableName] || {}
            );

            if (migration.success && migration.rows.length > 0) {
              // Insert data
              const dataRows = migration.rows.map(row =>
                columnNames.map(col => row[col] || '')
              );
              sheet.getRange(2, 1, dataRows.length, columnNames.length)
                .setValues(dataRows);

              stats.rowsMigrated += migration.rows.length;

              results[tableName] = {
                success: true,
                rowsMigrated: migration.rows.length,
                message: 'Imported ' + migration.rows.length + ' rows',
                issues: migration.issues
              };

              Logger.log('   Imported ' + migration.rows.length + ' rows');
            } else {
              results[tableName] = {
                success: migration.success,
                rowsMigrated: 0,
                message: migration.issues.length > 0 ? migration.issues[0] : 'No valid data',
                issues: migration.issues
              };

              stats.rowsSkipped += migration.stats.skipped;
            }

            if (migration.issues.length > 0) {
              warnings.push(tableName + ': ' + migration.issues.length + ' issues');
            }
          } catch (error) {
            results[tableName] = {
              success: false,
              rowsMigrated: 0,
              message: error.toString(),
              issues: [error.toString()]
            };
            Logger.log('   Error: ' + error.toString());
          }
        } else {
          results[tableName] = {
            success: true,
            rowsMigrated: 0,
            message: 'Sheet created (no CSV provided)'
          };
        }
      }

      Logger.log('✅ CSV-based initialization complete!');
      Logger.log('   Tables: ' + stats.tablesCreated + ', Rows: ' + stats.rowsMigrated);

      return { success: stats.tablesCreated > 0, results, warnings, stats };
    } catch (error) {
      Logger.log('❌ Error: ' + error.toString());
      return { success: false, results: {}, warnings: [error.toString()], stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 } };
    }
  }

  /**
   * Helper: Migrate CSV data to schema
   * @private
   */
  static _migrateFromCsv(csvData, schemaTable, columnMapping) {
    const issues = [];
    const stats = { total: 0, migrated: 0, skipped: 0 };

    // Parse CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, rows: [], issues: ['No data rows'], stats };
    }

    // Parse headers
    const csvHeaders = this._parseCSVLine(lines[0]);
    const schemaColumns = schemaTable.columns.map(col => col.name);
    const mapping = this._buildColumnMapping(csvHeaders, schemaColumns, columnMapping);

    // Parse data
    const rows = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      stats.total++;

      try {
        const csvValues = this._parseCSVLine(line);
        const row = {};

        // Map columns
        schemaTable.columns.forEach(schemaCol => {
          let value = '';
          const csvHeader = Object.keys(mapping).find(h => mapping[h].schemaCol === schemaCol.name);

          if (csvHeader && mapping[csvHeader].idx < csvValues.length) {
            value = csvValues[mapping[csvHeader].idx];
          }

          // Apply defaults
          if (!value || value === '') {
            if (schemaCol.name === 'Updated_At') {
              value = now;
            } else if (schemaCol.type === 'PK') {
              value = null; // Will skip
            }
          }

          row[schemaCol.name] = value;
        });

        // Validate PK
        const pkCol = schemaTable.columns.find(c => c.type === 'PK');
        if (!pkCol || !row[pkCol.name]) {
          stats.skipped++;
          continue;
        }

        rows.push(row);
        stats.migrated++;
      } catch (error) {
        issues.push('Row ' + i + ': ' + error.toString());
        stats.skipped++;
      }
    }

    return { success: stats.migrated > 0, rows, issues, stats };
  }

  /**
   * Helper: Parse CSV line
   * @private
   */
  static _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Helper: Build column mapping
   * @private
   */
  static _buildColumnMapping(csvHeaders, schemaColumns, customMapping) {
    const mapping = {};

    csvHeaders.forEach((csvHeader, idx) => {
      if (customMapping[csvHeader]) {
        mapping[csvHeader] = { schemaCol: customMapping[csvHeader], idx };
        return;
      }

      if (schemaColumns.includes(csvHeader)) {
        mapping[csvHeader] = { schemaCol: csvHeader, idx };
      }
    });

    return mapping;
  }
}

function initializeSheetDb() {
  if (typeof INIT_CSV_DATA_MAP !== 'undefined' && INIT_CSV_DATA_MAP) {
    return InitializeService.initializeFromCsv(INIT_CSV_DATA_MAP, SHEET_SCHEMA, {});
  }

  return InitializeService.initializeSheetDb();
}

function validateSheetDb() {
  return InitializeService.validateSheetDb();
}

/**
 * Clean and recreate all tables wrapper
 * For use in GAS environment
 */
function cleanAllTables(schema) {
  return InitializeService.cleanAllTables(schema);
}

/**
 * CSV-based initialization wrapper
 * For use in GAS environment
 */
function initializeFromCsvFiles(csvDataMap, schema, columnMappings = {}) {
  // Import locally to avoid circular dependencies
  // This is called from GAS which will have csvMigrationService available
  try {
    return InitializeService.initializeFromCsv(csvDataMap, schema, columnMappings);
  } catch (error) {
    Logger.log('Error during CSV initialization: ' + error.toString());
    return {
      success: false,
      results: {},
      warnings: [error.toString()],
      stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 }
    };
  }
}

/**
 * Initialize from bundled init CSV map when available (GAS build artifact).
 */
function initializeSheetDbFromInitCsv() {
  if (typeof INIT_CSV_DATA_MAP === 'undefined' || !INIT_CSV_DATA_MAP) {
    return {
      success: false,
      results: {},
      warnings: ['INIT_CSV_DATA_MAP is not available in this runtime'],
      stats: { tablesCreated: 0, rowsMigrated: 0, rowsSkipped: 0 }
    };
  }

  return InitializeService.initializeFromCsv(INIT_CSV_DATA_MAP, SHEET_SCHEMA, {});
}


// ============================================================================
// CATALOG SERVICE
// ============================================================================

/**
 * Catalog Service
 *
 * High-level business logic for catalog operations.
 * Uses GasSheetStore as the backing store.
 */



class CatalogService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModels() {
    return getGasModels(this.spreadsheetId);
  }

  /**
   * Get all catalog items with full pricing information
   *
   * Returns array of items with:
   * - ID_Item, Nombre
   * - Category info (ID_Categoria, Nombre)
   * - Price profile info (ID_Perfil_Precio, Nombre, Costo_Base_Fijo, etc.)
   * - Active status
   *
   * @returns {Array<Object>} Items with pricing details
   */
  getCatalogo() {
    try {
      const models = this._getModels();
      const items = models.ITEM_CATALOGO.all();
      const categories = models.CATEGORIAS.all();
      const profiles = models.PERFILES_PRECIO.all();

      const catMap = this._buildMapFromRecords(categories, 'ID_Categoria');
      const priceMap = this._buildMapFromRecords(profiles, 'ID_Perfil_Precio');

      // Build items with enriched data
      const out = [];
      for (const item of items) {
        const current = { ...item };

        // Only include active items
        if (current.Activo === false) continue;

        // Enrich with category info
        const categoria = catMap[current.ID_Categoria];
        if (categoria) {
          current._categoria = {
            ID_Categoria: categoria.ID_Categoria,
            Nombre: categoria.Nombre,
            Icono_UI: categoria.Icono_UI
          };
        }

        // Enrich with price profile
        // Use override if present, otherwise use category default
        const priceProfileId = current.ID_Perfil_Precio_Override || (categoria && categoria.ID_Perfil_Precio_Default);
        const priceProfile = priceMap[priceProfileId];
        if (priceProfile) {
          current._precioProfile = {
            ID_Perfil_Precio: priceProfile.ID_Perfil_Precio,
            Nombre: priceProfile.Nombre,
            Costo_Base_Fijo: priceProfile.Costo_Base_Fijo,
            Costo_Unitario_Pax: priceProfile.Costo_Unitario_Pax,
            Costo_Unitario_Tiempo: priceProfile.Costo_Unitario_Tiempo,
            Costo_Unitario_Item: priceProfile.Costo_Unitario_Item
          };

          // Calculate base price for display (simplified: just base cost)
          current.Precio_Base = priceProfile.Costo_Base_Fijo || 0;
        }

        out.push(current);
      }

      return out;
    } catch (error) {
      Logger.log('Error in getCatalogo: ' + error.toString());
      return [];
    }
  }

  /**
   * Get single item by ID with full enrichment
   * @param {string} itemId
   * @returns {Object|null}
   */
  getItemById(itemId) {
    const items = this.getCatalogo();
    return items.find(item => item.ID_Item === itemId) || null;
  }

  /**
   * Search items by name (case-insensitive)
   * @param {string} query
   * @returns {Array<Object>}
   */
  searchItems(query) {
    const q = (query || '').toLowerCase();
    const items = this.getCatalogo();
    return items.filter(item =>
      item.Nombre.toLowerCase().includes(q) ||
      (item._categoria && item._categoria.Nombre.toLowerCase().includes(q))
    );
  }

  /**
   * Returns raw reference tables required by pricing/XState runtime.
   *
   * This is used by frontend runtime hydration so catalog UI and pricing
   * resolve items/categories/profiles from the same source.
   *
   * @returns {{ITEM_CATALOGO:Array, CATEGORIAS:Array, PERFILES_PRECIO:Array, COMPOSICION_KIT:Array, REGLAS_NEGOCIO:Array}}
   */
  getPricingReferenceData() {
    try {
      const models = this._getModels();
      return {
        ITEM_CATALOGO: models.ITEM_CATALOGO.all(),
        CATEGORIAS: models.CATEGORIAS.all(),
        PERFILES_PRECIO: models.PERFILES_PRECIO.all(),
        COMPOSICION_KIT: models.COMPOSICION_KIT ? models.COMPOSICION_KIT.all() : [],
        REGLAS_NEGOCIO: models.REGLAS_NEGOCIO ? models.REGLAS_NEGOCIO.all() : []
      };
    } catch (error) {
      Logger.log('Error in getPricingReferenceData: ' + error.toString());
      return {
        ITEM_CATALOGO: [],
        CATEGORIAS: [],
        PERFILES_PRECIO: [],
        COMPOSICION_KIT: [],
        REGLAS_NEGOCIO: []
      };
    }
  }

  /**
   * Helper: build map from array by primary key
   * @private
   */
  _buildMapFromRecords(records, pkColumn) {
    const map = {};

    for (const record of records) {
      const pk = record[pkColumn];
      if (!pk) continue;

      map[String(pk)] = record;
    }

    return map;
  }
}

function createCatalogService(spreadsheetId) {
  return new CatalogService(spreadsheetId);
}


// ============================================================================
// CLIENT SERVICE
// ============================================================================

/**
 * Client Service
 *
 * High-level business logic for client operations.
 * Uses Google Sheets as the backing store.
 */



class ClientService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModel() {
    const models = getGasModels(this.spreadsheetId);
    return models.CLIENTES;
  }

  /**
   * Search clients by name (case-insensitive substring match)
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching clients
   */
  searchClients(query) {
    try {
      const q = (query || '').toLowerCase();
      const model = this._getModel();

      return model.where((client) => {
        const nombre = String(client.Nombre_Empresa || '').toLowerCase();
        return nombre.includes(q);
      });
    } catch (error) {
      Logger.log('Error in searchClients: ' + error.toString());
      return [];
    }
  }

  /**
   * Find client by RUT
   * @param {string} rut
   * @returns {Object|null}
   */
  findClientByRut(rut) {
    try {
      const model = this._getModel();
      return model.find((client) => String(client.RUT) === String(rut));
    } catch (error) {
      Logger.log('Error in findClientByRut: ' + error.toString());
      return null;
    }
  }

  /**
   * Create a new client or return existing if RUT already exists
   * @param {Object} data - { nombre, rut, email, telefono }
   * @returns {Object} Created or existing client
   */
  createOrGetClient(data) {
    try {
      const model = this._getModel();

      // Check if client exists
      const existing = this.findClientByRut(data.rut);
      if (existing) {
        return existing;
      }

      // Create new client
      const clientId = 'CLI_' + Utilities.getUuid().substring(0, 8).toUpperCase();
      const now = new Date().toISOString();

      return model.create({
        ID_Cliente: clientId,
        Nombre_Empresa: data.nombre || '',
        RUT: data.rut || '',
        Email: data.email || '',
        Telefono: data.telefono || '',
        Updated_At: now
      });
    } catch (error) {
      Logger.log('Error in createOrGetClient: ' + error.toString());
      throw error;
    }
  }

  /**
   * Get client by ID
   * @param {string} clientId
   * @returns {Object|null}
   */
  getClientById(clientId) {
    try {
      const model = this._getModel();
      return model.findById(clientId);
    } catch (error) {
      Logger.log('Error in getClientById: ' + error.toString());
      return null;
    }
  }
}

function createClientService(spreadsheetId) {
  return new ClientService(spreadsheetId);
}


// ============================================================================
// QUOTATION SERVICE
// ============================================================================

/**
 * Quotation Service
 *
 * High-level business logic for quotation operations.
 * Manages COTIZACIONES and LINEA_DETALLE sheets.
 */



class QuotationService {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
  }

  _getModels() {
    return getGasModels(this.spreadsheetId);
  }

  /**
   * Create a new quotation with line items
   *
   * @param {Object} quotationData
   *   - ID_Cliente: string (FK to CLIENTES)
   *   - Fecha_Evento: string (YYYY-MM-DD)
   *   - Duracion_Dias: number
   *   - Pax_Global: number
   * @param {Array<Object>} lineItems
   *   - ID_Item: string (FK to ITEM_CATALOGO)
   *   - Dia_Numero: number (1..N)
   *   - Hora_Inicio: string (HH:MM)
   *   - Override_Pax: number (optional)
   *   - Override_Cantidad: number (optional)
   *   - Override_Duracion_Min: number (optional)
   *   - Comentarios: string (optional)
   * @returns {Object} { success: true, cotizacionId, mensaje }
   */
  createQuotation(quotationData, lineItems = []) {
    try {
      const models = this._getModels();
      const cotModel = models.COTIZACIONES;
      const lineaModel = models.LINEA_DETALLE;

      const cotizacionId = 'COT_' + Math.floor(Date.now() / 1000);
      const now = new Date().toISOString();

      // Add quotation header
      cotModel.create({
        ID_Cotizacion: cotizacionId,
        ID_Cliente: quotationData.ID_Cliente || '',
        Estado: quotationData.Estado || 'Borrador',
        Fecha_Evento: quotationData.Fecha_Evento || new Date().toISOString().split('T')[0],
        Duracion_Dias: quotationData.Duracion_Dias || 1,
        Pax_Global: quotationData.Pax_Global || 1,
        Updated_At: now
      });

      // Add line items with CORRECT column order
      // Order: ID_Linea, ID_Cotizacion, ID_Item, Estado_Linea, Dia_Numero, Hora_Inicio,
      //        Override_Pax, Override_Cantidad, Override_Duracion_Min, Comentarios, Updated_At
      for (let i = 0; i < lineItems.length; i++) {
        const linea = lineItems[i];
        const lineaId = cotizacionId + '_L' + (i + 1);

        lineaModel.create({
          ID_Linea: lineaId,
          ID_Cotizacion: cotizacionId,
          ID_Item: linea.ID_Item || '',
          Estado_Linea: linea.Estado_Linea || 'ACTIVA',
          Dia_Numero: linea.Dia_Numero || 1,
          Hora_Inicio: linea.Hora_Inicio || '09:00',
          Override_Pax: linea.Override_Pax || '',
          Override_Cantidad: linea.Override_Cantidad || '',
          Override_Duracion_Min: linea.Override_Duracion_Min || '',
          Comentarios: linea.Comentarios || '',
          Updated_At: now
        });
      }

      return {
        success: true,
        cotizacionId: cotizacionId,
        mensaje: 'Cotización guardada correctamente'
      };
    } catch (error) {
      Logger.log('Error in createQuotation: ' + error.toString());
      return {
        success: false,
        mensaje: error.toString()
      };
    }
  }

  /**
   * Load a quotation with all its line items and client info
   * @param {string} cotizacionId
   * @returns {Object} { success, cliente, quotation, lineas, ... }
   */
  loadQuotation(cotizacionId) {
    try {
      const models = this._getModels();

      // Find quotation
      const cotizacion = models.COTIZACIONES.findById(cotizacionId);

      if (!cotizacion) {
        return { success: false, mensaje: 'Cotización no encontrada' };
      }

      // Find client
      const cliente = models.CLIENTES.findById(cotizacion.ID_Cliente);

      // Find line items
      const lineas = models.LINEA_DETALLE.where((linea) => linea.ID_Cotizacion === cotizacionId);

      return {
        success: true,
        cotizacion: cotizacion,
        cliente: cliente,
        lineas: lineas
      };
    } catch (error) {
      Logger.log('Error in loadQuotation: ' + error.toString());
      return { success: false, mensaje: error.toString() };
    }
  }

  /**
   * Add a line item to an existing quotation
   * @param {string} cotizacionId
   * @param {Object} lineData
   * @returns {Object} { success, lineaId, mensaje }
   */
  addLineItem(cotizacionId, lineData) {
    try {
      const models = this._getModels();

      const lineaId = cotizacionId + '_L' + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();

      models.LINEA_DETALLE.create({
        ID_Linea: lineaId,
        ID_Cotizacion: cotizacionId,
        ID_Item: lineData.ID_Item || '',
        Estado_Linea: lineData.Estado_Linea || 'ACTIVA',
        Dia_Numero: lineData.Dia_Numero || 1,
        Hora_Inicio: lineData.Hora_Inicio || '09:00',
        Override_Pax: lineData.Override_Pax || '',
        Override_Cantidad: lineData.Override_Cantidad || '',
        Override_Duracion_Min: lineData.Override_Duracion_Min || '',
        Comentarios: lineData.Comentarios || '',
        Updated_At: now
      });

      return {
        success: true,
        lineaId: lineaId,
        mensaje: 'Línea agregada correctamente'
      };
    } catch (error) {
      Logger.log('Error in addLineItem: ' + error.toString());
      return { success: false, mensaje: error.toString() };
    }
  }

}

function createQuotationService(spreadsheetId) {
  return new QuotationService(spreadsheetId);
}


// ============================================================================
// GAS FUNCTIONS EXPORTED TO FRONTEND
// ============================================================================

// Helper: Get spreadsheet ID
function getSpreadsheetId() {
  if (typeof SpreadsheetApp !== 'undefined') {
    return SpreadsheetApp.getActiveSpreadsheet().getId();
  }
  return null;
}

// --- INITIALIZATION ---
// Run once from Apps Script editor console:
// > initializeSheetDb()

// --- CATALOG API ---

/**
 * Get all catalog items with pricing
 * Called by: frontend cargarCatalogo()
 */
function getCatalogo() {
  const service = new CatalogService(getSpreadsheetId());
  return service.getCatalogo();
}

/**
 * Search catalog items
 */
function searchCatalogo(query) {
  const service = new CatalogService(getSpreadsheetId());
  return service.searchItems(query);
}

/**
 * Get raw pricing reference tables for runtime hydration
 */
function getPricingReferenceData() {
  const service = new CatalogService(getSpreadsheetId());
  return service.getPricingReferenceData();
}

// --- CLIENT API ---

/**
 * Search clients by name
 */
function buscarCliente(query) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.searchClients(query);
  } catch (error) {
    Logger.log('Error in buscarCliente: ' + error);
    throw error;
  }
}

/**
 * Create or get existing client
 */
function crearOObtenerCliente(data) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.createOrGetClient(data);
  } catch (error) {
    Logger.log('Error in crearOObtenerCliente: ' + error);
    throw error;
  }
}

/**
 * Get client by ID
 */
function obtenerCliente(clientId) {
  try {
    const service = new ClientService(getSpreadsheetId());
    return service.getClientById(clientId);
  } catch (error) {
    Logger.log('Error in obtenerCliente: ' + error);
    return null;
  }
}

// --- QUOTATION API ---

/**
 * Save a new quotation
 */
function guardarCotizacion(quotationData, lineItems) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.createQuotation(quotationData, lineItems);
  } catch (error) {
    Logger.log('Error in guardarCotizacion: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

/**
 * Load a quotation
 */
function cargarCotizacion(cotizacionId) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.loadQuotation(cotizacionId);
  } catch (error) {
    Logger.log('Error in cargarCotizacion: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

/**
 * Add a line item to quotation
 */
function agregarLineaDetalle(cotizacionId, lineData) {
  try {
    const service = new QuotationService(getSpreadsheetId());
    return service.addLineItem(cotizacionId, lineData);
  } catch (error) {
    Logger.log('Error in agregarLineaDetalle: ' + error);
    return { success: false, mensaje: error.toString() };
  }
}

// --- UTILITIES ---

/**
 * Generate PDF for a quotation (placeholder)
 */
function generarPDF(cotizacionId) {
  try {
    return 'https://example.com/pdf/' + cotizacionId;
  } catch (error) {
    Logger.log('Error in generarPDF: ' + error);
    throw error;
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
