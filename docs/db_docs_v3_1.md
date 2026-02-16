# Diccionario de Datos y Entidades: SF Lodge v3.1 (Planning)

**Versión:** 3.1 (Planificación)  
**Estado:** Diseño objetivo (Motor de Reglas Unificado por Etapas)  
**Propósito:** Definir un modelo unificado para cálculo, restricciones, ajustes e impuestos.

---

## 1. Principios del Modelo

1. Entidades base: `ITEM_CATALOGO`, `CLIENTES`.
2. Un ítem puede pertenecer a una `CATEGORIA`.
3. Un ítem puede contener otros ítems vía `COMPOSICION_KIT`.
4. La fórmula base trabaja con `P` (pax), `Q` (cantidad), `T` (duración).
5. Cada ítem seleccionado crea una `LINEA_DETALLE`.
6. La línea parte con defaults y permite override de usuario.
7. Las reglas se aplican por etapa y retornan resultados accionables en UI.

---

## 2. Datos Maestros

### 2.1. CLIENTES (`CLIENTES`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cliente` | PK | Identificador. |
| `Nombre_Empresa` | TEXT | Razón social. |
| `RUT` | TEXT | Identificador fiscal. |
| `Email` | TEXT | Contacto principal. |
| `Telefono` | TEXT | Contacto. |

---

### 2.2. CATEGORÍAS (`CATEGORIAS`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Categoria` | PK | Identificador categoría. |
| `Nombre` | TEXT | Nombre visible. |
| `Comportamiento_Base` | ENUM | `SERVICIO`, `PRODUCTO`, `ESPACIO`, `PERSONAL`. |
| `Def_Impuesto_ID` | FK | Impuesto sugerido por defecto. |
| `Activo` | BOOLEAN | Vigencia. |

---

### 2.3. CATÁLOGO DE ITEMS (`ITEM_CATALOGO`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Item` | PK | SKU único. |
| `Nombre` | TEXT | Nombre comercial. |
| `ID_Categoria` | FK | Categoría base del ítem. |
| `Activo` | BOOLEAN | Borrado lógico. |

---

### 2.4. COMPOSICIÓN (`COMPOSICION_KIT`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Composicion` | PK | ID de relación padre/hijo. |
| `ID_Item_Padre` | FK | Ítem comercial (pack/kit). |
| `ID_Item_Hijo` | FK | Ítem operativo. |
| `Cantidad` | DECIMAL | Multiplicador. |
| `Tipo_Precio` | ENUM | `ABSORBIDO`, `SUMAR`. |

**Regla de negocio clave:** El ítem composición no tiene precio propio obligatorio, pero sí puede tener reglas.

---

### 2.5. REGLAS DE NEGOCIO UNIFICADAS (`REGLAS_NEGOCIO`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Regla` | PK | Identificador único de la regla. |
| `Nombre` | TEXT | Nombre legible en administración/UI. |
| `Etapa` | ENUM | `CANTIDAD_DEFAULT`, `RESTRICCION_UI`, `PRECIO_BASE`, `AJUSTE_LINEA`, `AJUSTE_GLOBAL`, `IMPUESTO`. |
| `Scope` | ENUM | `LINEA`, `ITEM`, `CATEGORIA`, `COTIZACION`, `CLIENTE`, `COMPOSICION`. |
| `Tipo_Accion` | ENUM | `SET_VALUE`, `MULTIPLY`, `ADD_FIXED`, `ADD_ITEM`, `INVALIDATE_BASKET`, `WARNING`, `ERROR`, `SET_TAX`. |
| `Condicion_JSON` | JSON | Predicado (pax/hora/categoría/cantidad/cliente/pack, etc.). |
| `Payload_JSON` | JSON | Datos para ejecutar acción (factor, monto, item a agregar, mensaje, etc.). |
| `Prioridad` | INTEGER | Orden de ejecución dentro de la etapa. |
| `Acumulable` | BOOLEAN | Si puede convivir con otras reglas de la misma etapa. |
| `Severidad` | ENUM | `INFO`, `WARNING`, `ERROR` (para salida UI). |
| `Activo` | BOOLEAN | Vigencia. |

---

## 3. Datos Transaccionales

### 3.1. COTIZACIONES (`COTIZACIONES`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cotizacion` | PK | Folio. |
| `ID_Cliente` | FK | Cliente dueño de la cotización. |
| `Estado` | ENUM | `Borrador`, `Enviada`, `Pendiente_Aprobacion`, `Aprobada`, `Finalizada`. |
| `Fecha_Evento` | DATE | Fecha de inicio. |
| `Duracion_Dias` | INTEGER | Duración global. |
| `Pax_Global` | INTEGER | Pax base del evento. |
| `Total_Neto` | MONEY | Neto consolidado. |
| `Total_Impuestos` | MONEY | Suma de impuestos. |
| `Total_Final` | MONEY | Total final. |
| `Desglose_Impuestos` | JSON | Resumen por tipo de impuesto. |

---

### 3.2. LÍNEA DE DETALLE (`LINEA_DETALLE`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Linea` | PK | ID de línea. |
| `ID_Cotizacion` | FK | Cotización padre. |
| `ID_Item` | FK/NULL | Ítem de catálogo (puede ser null para ajustes globales). |
| `Es_Ajuste` | BOOLEAN | Marca líneas de ajuste/descuento/sobreprecio. |
| `Regla_Origen_ID` | FK/NULL | Regla que originó la línea o ajuste. |
| `Dia_Numero` | INTEGER | Día relativo del evento. |
| `Hora_Inicio` | TIME/NULL | Hora inicio si aplica. |
| `Input_Pax` | INTEGER | Pax final aplicado en línea (snapshot). |
| `Input_Cantidad` | DECIMAL | Cantidad final aplicada (snapshot). |
| `Input_Duracion_Min` | INTEGER | Duración final aplicada (snapshot). |
| `Precio_Unitario_Calc` | MONEY | Precio unitario neto final. |
| `Precio_Total_Linea` | MONEY | Precio total neto (incluye ajustes de línea). |
| `Impuesto_ID_Snapshot` | FK/NULL | Impuesto aplicado en cálculo final. |
| `Impuesto_Tasa_Snapshot` | DECIMAL | Tasa usada. |
| `Impuesto_Monto` | MONEY | Monto impuesto. |
| `Comentarios` | TEXT | Comentarios/justificación comercial. |
| `Config_JSON` | JSON | Metadata técnica (traza de reglas aplicadas, inputs originales). |

---

### 3.3. HISTORIAL (`HISTORIAL_COTIZACION`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Log` | PK | ID evento. |
| `ID_Cotizacion` | FK | Cotización afectada. |
| `Timestamp` | DATETIME | Momento del cambio. |
| `Usuario` | TEXT | Usuario actor. |
| `Accion` | TEXT | Acción realizada. |
| `Detalle_Cambio` | JSON | Snapshot de cambio/auditoría. |

---

## 4. Herencia y Precedencia de Reglas

**Fuentes de reglas**: `CATEGORIA -> COMPOSICION -> ITEM -> USUARIO`.

**Precedencia para override efectivo**: `USUARIO > ITEM > COMPOSICION > CATEGORIA`.

Esto permite heredar base por categoría y resolver override final en línea.

---

## 5. Resultado de Reglas para UI

Cada regla ejecutada debe poder producir salida accionable:

- `type`: `ERROR`, `WARNING`, `INFO`, `APPLIED_ADJUSTMENT`, `AUTO_ADDED_ITEM`.
- `ruleId`: identificador de regla aplicada.
- `stage`: etapa de pipeline.
- `target`: `LINEA`, `COTIZACION`, `ITEM`.
- `message`: mensaje mostrado en UI.
- `delta`: cambio aplicado (precio, cantidad, item agregado, invalidación, etc.).

---

## 6. Nota de Transición

`docs/db_docs_v3.md` describe el esquema actual de transición.  
Este documento (`v3.1`) define el objetivo de unificación que guiará próximas migraciones de schema y servicios.
