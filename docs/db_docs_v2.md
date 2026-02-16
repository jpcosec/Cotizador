# Diccionario de Datos y Entidades: SF Lodge v2.4

**Versión:** 2.4
**Estado:** Definición para Implementación (Completo con Categorías Inteligentes)
**Propósito:** Describir cada entidad del sistema, sus campos y su función dentro de la arquitectura de Repositorios.

> Nota: este documento describe el baseline v2.4. Para el estado actual de esquema con cascada de defaults (v3), usar `src/Config/Config_Schema.js` y `docs/quotation-pipeline-flow-v3.md`.

---

## 1. Datos Maestros (Mundo Real)
**Características:** Datos estáticos o de referencia.
**Estrategia Técnica:** `isMasterData = true`.

### 1.1. REGLAS DE PRECIO (`REGLA_PRECIO`)
**Descripción:** Define cómo se cobra algo (la fórmula matemática).
**Uso:** Un Item apunta a una Regla.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Regla` | PK (String) | Identificador único (ej: `R-FIXED`, `R-PAX-SIMPLE`). |
| `Nombre_Formula` | String | Nombre descriptivo (ej: "Costo Fijo", "Por Pax + Base"). |
| `Costo_Base_Fijo` | Money | Monto fijo base. |
| `Costo_Unitario_Pax` | Money | Monto por persona. |
| `Costo_Unitario_Tiempo` | Money | Monto por duración. |
| `Costo_Unitario_Item` | Money | Monto por cantidad. |
| `Formula_Legible` | String | Texto humano para UI. |

---

### 1.2. CATÁLOGO DE ITEMS (`ITEM_CATALOGO`)
**Descripción:** Inventario de servicios y productos.
**Uso:** El usuario selecciona estos elementos. Hereda comportamientos de su `CATEGORIA`.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Item` | PK (String) | Identificador único (ej: `ITM-001`). |
| `Nombre` | String | Nombre comercial. |
| `ID_Categoria` | FK (String) | **NUEVO:** Relación con `CATEGORIAS` (define comportamiento base). |
| `ID_Regla` | FK (String) | Relación con `REGLA_PRECIO`. |
| `ID_Impuesto` | FK (String) | Relación con `REGLAS_IMPUESTO` (override opcional del default de categoría). |
| `Precio_Base_Ref` | Money | Valor referencial. |
| `Permite_Override_Pax` | Bool | `TRUE` si este ítem específico permite cambiar pax (override). |
| `Activo` | Bool | Borrado lógico. |

---

### 1.3. RESTRICCIONES DE NEGOCIO (`RESTRICCION`)
**Descripción:** Reglas de validación (Incompatibilidades, Mínimos).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Restriccion` | PK (String) | Identificador único. |
| `ID_Item_Trigger` | FK (String) | Ítem que activa la regla. |
| `Tipo_Restriccion` | Enum | `MIN_PAX`, `REQUIERE`, `EXCLUYE`, etc. |
| `ID_Item_Target` | FK (String) | Ítem objetivo. |
| `Valor_Limite` | Number | Valor umbral. |
| `Nivel_Severidad` | Enum | `ERROR`, `WARNING`. |

---

### 1.4. CLIENTES (`CLIENTES`)
**Descripción:** Base de datos de clientes.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cliente` | PK (String) | Identificador único. |
| `Nombre_Empresa` | String | Razón social. |
| `RUT` | String | Identificador tributario. |
| `Email` | Email | Contacto. |
| `Telefono` | String | Contacto. |

---

### 1.5. COMPOSICIÓN DE KITS (`COMPOSICION_KIT`)
**Descripción:** Estructura jerárquica (Padre/Hijo).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Composicion` | PK (String) | Identificador único. |
| `ID_Item_Padre` | FK (String) | Item comercial (Pack). |
| `ID_Item_Hijo` | FK (String) | Item operativo. |
| `Cantidad` | Decimal | Cantidad incluida. |
| `Tipo_Precio` | Enum | `ABSORBIDO`, `SUMAR`. |

---

### 1.6. REGLAS DE DESCUENTO (`REGLAS_DESCUENTO`)
**Descripción:** Rebajas automáticas o manuales.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Descuento` | PK (String) | Identificador único. |
| `Nombre` | String | Nombre visible. |
| `Origen` | Enum | `SISTEMA`, `MANUAL`. |
| `Trigger_Item` | FK (String) | Gatillador (si es Sistema). |
| `Tipo_Calculo` | Enum | `POR_PAX`, `FIJO`, `PORCENTAJE`. |
| `Valor` | Money | Monto. |
| `Permite_Editar_Valor` | Bool | Si es editable por vendedor. |
| `Requiere_Aprobacion` | Bool | Si requiere validación admin. |
| `Acumulable` | Bool | Combinable. |

---

### 1.7. REGLAS DE IMPUESTO (`REGLAS_IMPUESTO`)
**Descripción:** Tasas impositivas.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Impuesto` | PK (String) | Identificador (ej: `IMP-IVA`). |
| `Nombre` | String | Nombre legal. |
| `Tasa` | Decimal | Factor (ej: `0.19`). |
| `Activo` | Bool | Vigencia. |

---

### 1.8. CATEGORÍAS (`CATEGORIAS`)
**Descripción:** **NUEVA TABLA.** Define tipologías y comportamientos por defecto. Agrupa ítems con lógica similar.
**Uso:** Al crear un ítem, se asigna una categoría. El frontend usa esto para saber qué campos mostrar.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Categoria` | PK (String) | Identificador (ej: `CAT-AUDIO`, `CAT-BEBIDAS`). |
| `Nombre` | String | Nombre visible (ej: "Audio e Iluminación", "Banquetería"). |
| `Comportamiento_Base` | Enum | **CORE LOGIC:** `SERVICIO` (usa tiempo), `PRODUCTO` (usa stock/cant), `ESPACIO` (usa bloques/días), `PERSONAL` (usa turnos). |
| `Def_Requiere_Hora` | Bool | Si los ítems de esta categoría piden hora inicio/fin por defecto. |
| `Def_Requiere_Cant` | Bool | Si piden selector de cantidad numérica por defecto. |
| `Def_Usa_Pax` | Bool | Si el costo suele depender de los pax (para pre-checkear overrides). |
| `Def_Impuesto_ID` | FK (String) | Impuesto sugerido para ítems nuevos de esta categoría (ej: Alcoholes -> ILA). |
| `Def_Duracion_Min` | Int | Duración sugerida en minutos (ej: DJs -> 240 min). |
| `Icono_UI` | String | Identificador de ícono para el frontend (ej: `mdi-speaker`). |

---

## 2. Datos Transaccionales (Lógica/Proceso)
**Características:** Datos dinámicos generados por la operación.
**Estrategia Técnica:** `isMasterData = false`.

### 2.1. ENCABEZADO DE COTIZACIÓN (`COTIZACIONES`)
**Descripción:** Contexto global del evento.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cotizacion` | PK (String) | Identificador único. |
| `ID_Cliente` | FK (String) | Cliente. |
| `Estado` | Enum | `Borrador`, `Enviada`, `Pendiente_Aprobacion`, `Aprobada`, `Finalizada`. |
| `Pax_Global` | Int | Pax base. |
| `Total_Neto` | Money | Neto. |
| `Total_IVA` | Money | IVA. |
| `Total_Impuestos_Adic` | Money | Otros impuestos. |
| `Total_Final` | Money | Total a pagar. |
| `Desglose_Impuestos` | JSON | Resumen de impuestos. |

---

### 2.2. LÍNEA DE DETALLE (`LINEA_DETALLE`)
**Descripción:** Instancia de venta.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Linea` | PK (String) | Identificador. |
| `ID_Cotizacion` | FK (String) | Cotización. |
| `ID_Item` | FK (String) | Item. |
| `Es_Descuento` | Bool | Flag descuento. |
| `Dia_Numero` | Int | Día del evento. |
| `Hora_Inicio` | Time | Hora inicio. |
| `Hora_Termino` | Time | **NUEVO:** Hora término (calculado: Inicio + Duración). |
| `Input_Cantidad` | Int | Cantidad. |
| `Input_Pax` | Int | Pax de línea. |
| `Precio_Total_Linea` | Money | Precio final. |
| `Impuesto_Monto` | Money | Monto impuesto. |
| `Impuesto_Tasa_Snapshot` | Decimal | Tasa aplicada. |
| `Comentarios` | Text | Observaciones. |

---

### 2.3. HISTORIAL DE CAMBIOS (`HISTORIAL_COTIZACION`)
**Descripción:** Registro de auditoría (Log).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Log` | PK (String) | Identificador del evento de log. |
| `ID_Cotizacion` | FK (String) | Cotización afectada. |
| `Timestamp` | DateTime | Fecha y hora exacta del cambio. |
| `Usuario` | String | Email del usuario que hizo el cambio. |
| `Accion` | String | `CREAR`, `MODIFICAR_ITEM`, `CAMBIAR_ESTADO`. |
| `Detalle_Cambio` | Text/JSON | Descripción legible. |

---

## 3. Resumen de Relaciones

1. **Cotización** TIENE MUCHAS **Líneas de Detalle**.
2. **Línea de Detalle** USA UN **Item de Catálogo**.
3. **Item de Catálogo** OBEDECE UNA **Regla de Precio**.
4. **Item de Catálogo** PERTENECE A UNA **Categoría**.
5. **Categoría** DEFINE COMPORTAMIENTOS POR DEFECTO PARA **Items de Catálogo**.
6. **Item de Catálogo** PUEDE APLICAR UNA **Regla de Impuesto** (o heredar la sugerida por categoría).
7. **Cotización** PERTENECE A UN **Cliente**.
8. **Restricción** CONTROLA UNO O MÁS **Items de Catálogo**.
9. **Composición** VINCULA UN **Item Padre** CON MUCHOS **Items Hijo**.
10. **Regla de Descuento** SE ACTIVA POR UN **Item de Catálogo** (trigger) O POR UN **Vendedor** (manual).
11. **Cotización** PUEDE TENER MUCHOS **Registros de Historial**.
