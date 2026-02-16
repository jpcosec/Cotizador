# Diccionario de Datos y Entidades: SF Lodge v3.0.1

**Versión:** 3.0.1  
**Estado:** Definición para Implementación (Cascada de Defaults + Sobreturno)  
**Fuente de Verdad:** `src/Config/Config_Schema.js`

> Nota de transición: para la planificación vigente del motor unificado por etapas, revisar `docs/db_docs_v3_1.md`.

---

## 1. Datos Maestros
**Características:** Datos estáticos o de referencia.  
**Estrategia Técnica:** `isMasterData = true`.

### 1.1. REGLAS DE CÁLCULO DE CANTIDAD (`REGLAS_CALCULO_CANTIDAD`)
**Descripción:** Motor de estimación de cantidades (defaults inteligentes).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Regla_Cant` | PK | Identificador (ej: `CANT-VINO`). |
| `Nombre` | TEXT | Descripción (ej: 1 botella cada 3 pax). |
| `Modo_Calculo` | ENUM | `FIJO`, `POR_PAX`, `FACTOR_PAX`, `POR_TIEMPO`. |
| `Factor_Default` | DECIMAL | Número base de la regla (ej: `0.33`). |

---

### 1.2. CATEGORÍAS (`CATEGORIAS`)
**Descripción:** ADN del ítem; define comportamiento y defaults de Nivel 1.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Categoria` | PK | Identificador (ej: `CAT-DJ`). |
| `Nombre` | TEXT | Nombre visible. |
| `Comportamiento_Base` | ENUM | `SERVICIO`, `PRODUCTO`, `ESPACIO`, `PERSONAL`. |
| `Def_Requiere_Hora` | BOOLEAN | UI: mostrar selectores de hora. |
| `Def_Requiere_Cant` | BOOLEAN | UI: mostrar input de cantidad. |
| `Def_Usa_Pax` | BOOLEAN | Lógica: costo suele depender de pax. |
| `ID_Regla_Cant_Default` | FK -> `REGLAS_CALCULO_CANTIDAD` | Regla base de cantidad. |
| `Factor_Cant_Default` | DECIMAL | Factor base de cantidad (si aplica). |
| `ID_Regla_Precio_Default` | FK -> `REGLA_PRECIO` | Fórmula de cobro sugerida. |
| `Def_Impuesto_ID` | FK -> `REGLAS_IMPUESTO` | Impuesto sugerido. |
| `Def_Duracion_Min` | INTEGER | Minutos default. |
| `Max_Pax_Default` | INTEGER | Capacidad máxima sugerida. |
| `Icono_UI` | TEXT | Nombre de icono (mdi). |

---

### 1.3. REGLA DE PRECIO (`REGLA_PRECIO`)
**Descripción:** Motor matemático desacoplado, con soporte de sobreturno/tiered pricing.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Regla` | PK | ID de fórmula. |
| `Nombre_Formula` | TEXT | Descripción humana. |
| `Costo_Base_Fijo` | MONEY | Costo fijo. |
| `Costo_Unitario_Pax` | MONEY | Costo por persona. |
| `Costo_Unitario_Tiempo` | MONEY | Costo por tiempo (h/d). |
| `Tiempo_Base_Incluido` | INTEGER | Minutos cubiertos por costo base. |
| `Costo_Unitario_Tiempo_Extra` | MONEY | Costo por minuto/hora adicional. |
| `Costo_Unitario_Item` | MONEY | Costo por unidad. |
| `Formula_Legible` | TEXT | Explicación visual para UI. |

---

### 1.4. REGLAS DE IMPUESTO (`REGLAS_IMPUESTO`)
**Descripción:** Tasas impositivas flexibles.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Impuesto` | PK | ID impuesto (ej: `IMP-IVA`). |
| `Nombre` | TEXT | Nombre legal. |
| `Tasa` | DECIMAL | Factor (ej: `0.19`). |
| `Activo` | BOOLEAN | Vigencia. |

---

### 1.5. CATÁLOGO DE ITEMS (`ITEM_CATALOGO`)
**Descripción:** Inventario vendible con overrides de Nivel 2 sobre categoría.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Item` | PK | SKU único. |
| `Nombre` | TEXT | Nombre comercial. |
| `ID_Categoria` | FK -> `CATEGORIAS` | Herencia de comportamiento/defaults. |
| `ID_Regla_Cant_Override` | FK -> `REGLAS_CALCULO_CANTIDAD` | Regla de cantidad específica del ítem. |
| `Factor_Cant_Override` | DECIMAL | Factor de cantidad específico. |
| `ID_Regla_Precio` | FK -> `REGLA_PRECIO` | Fórmula de cobro del ítem. |
| `ID_Impuesto` | FK -> `REGLAS_IMPUESTO` | Override de impuesto. |
| `Precio_Base_Ref` | MONEY | Referencia visual. |
| `Default_Cantidad` | INTEGER | Variable `Q` inicial. |
| `Default_Duracion_Min` | INTEGER | Variable `T` inicial (minutos). |
| `Capacidad_Max_Pax` | INTEGER | Override de capacidad. |
| `Permite_Editar_Cantidad` | BOOLEAN | Usuario puede editar `Q`. |
| `Permite_Editar_Duracion` | BOOLEAN | Usuario puede editar `T`. |
| `Permite_Override_Pax` | BOOLEAN | Usuario puede editar `P`. |
| `Default_Glosa` | TEXT | Texto sugerido para comentarios. |
| `Activo` | BOOLEAN | Borrado lógico. |

---

### 1.6. COMPOSICIÓN DE KITS (`COMPOSICION_KIT`)
**Descripción:** Estructura recursiva Padre-Hijo.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Composicion` | PK | ID relación. |
| `ID_Item_Padre` | FK -> `ITEM_CATALOGO` | Ítem pack. |
| `ID_Item_Hijo` | FK -> `ITEM_CATALOGO` | Ítem componente. |
| `Cantidad` | DECIMAL | Multiplicador. |
| `Tipo_Precio` | ENUM | `ABSORBIDO`, `SUMAR`. |

---

### 1.7. REGLAS DE DESCUENTO (`REGLAS_DESCUENTO`)
**Descripción:** Rebajas automáticas y manuales.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Descuento` | PK | ID único. |
| `Nombre` | TEXT | Etiqueta en cotización. |
| `Origen` | ENUM | `SISTEMA`, `MANUAL`. |
| `Trigger_Item` | FK -> `ITEM_CATALOGO` | Gatillador para origen sistema. |
| `Tipo_Calculo` | ENUM | `POR_PAX`, `FIJO`, `PORCENTAJE`. |
| `Valor` | MONEY | Monto o porcentaje base. |
| `Permite_Editar_Valor` | BOOLEAN | Vendedor puede editar monto. |
| `Requiere_Aprobacion` | BOOLEAN | Gatilla flujo admin. |
| `Acumulable` | BOOLEAN | Acumulable con otros descuentos. |

---

### 1.8. RESTRICCIÓN (`RESTRICCION`)
**Descripción:** Reglas de negocio y validaciones.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Restriccion` | PK | ID regla. |
| `ID_Item_Trigger` | FK -> `ITEM_CATALOGO` | Ítem trigger. |
| `Tipo_Restriccion` | ENUM | `MIN_PAX`, `REQUIERE`, `EXCLUYE`, `MIN_VENTA`. |
| `ID_Item_Target` | FK -> `ITEM_CATALOGO` | Ítem objetivo. |
| `Valor_Limite` | DECIMAL | Umbral numérico. |
| `Nivel_Severidad` | ENUM | `ERROR`, `WARNING`. |

---

### 1.9. CLIENTES (`CLIENTES`)
**Descripción:** Base de datos de clientes.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cliente` | PK | Identificador. |
| `Nombre_Empresa` | TEXT | Razón social. |
| `RUT` | TEXT | Identificador fiscal. |
| `Email` | TEXT | Contacto principal. |
| `Telefono` | TEXT | Contacto. |

---

## 2. Datos Transaccionales
**Características:** Datos dinámicos de operación.  
**Estrategia Técnica:** `isMasterData = false`.

### 2.1. COTIZACIONES (`COTIZACIONES`)
**Descripción:** Encabezado de venta.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cotizacion` | PK | Folio. |
| `ID_Cliente` | FK -> `CLIENTES` | Cliente. |
| `Estado` | ENUM | `Borrador`, `Enviada`, `Pendiente_Aprobacion`, `Aprobada`, `Finalizada`. |
| `Fecha_Evento` | DATE | Día inicio evento. |
| `Duracion_Dias` | INTEGER | Extensión del evento. |
| `Pax_Global` | INTEGER | Invitados base. |
| `Total_Neto` | MONEY | Suma sin impuestos. |
| `Total_IVA` | MONEY | IVA calculado. |
| `Total_Impuestos_Adic` | MONEY | Impuestos adicionales. |
| `Total_Final` | MONEY | Total a pagar. |
| `Desglose_Impuestos` | JSON | Snapshot de impuestos. |

---

### 2.2. LÍNEA DE DETALLE (`LINEA_DETALLE`)
**Descripción:** Ítems vendidos por cotización.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Linea` | PK | ID único. |
| `ID_Cotizacion` | FK -> `COTIZACIONES` | Cotización padre. |
| `ID_Item` | FK -> `ITEM_CATALOGO` | Producto/servicio. |
| `Es_Descuento` | BOOLEAN | Flag tipo línea. |
| `ID_Regla_Descuento` | FK -> `REGLAS_DESCUENTO` | Origen de descuento. |
| `Dia_Numero` | INTEGER | Día relativo (1..N). |
| `Hora_Inicio` | TIME | Inicio servicio. |
| `Input_Duracion_Min` | INTEGER | Duración final de la línea (override de `T`). |
| `Input_Cantidad` | INTEGER | Unidades (editable según item). |
| `Input_Pax` | INTEGER | Pax por línea (override). |
| `Precio_Unitario_Calc` | MONEY | Unitario neto. |
| `Precio_Total_Linea` | MONEY | Neto final (puede ser negativo). |
| `Impuesto_Monto` | MONEY | Monto de impuesto línea. |
| `Impuesto_Tasa_Snapshot` | DECIMAL | Tasa usada en cálculo. |
| `Comentarios` | TEXT | Observaciones/justificación. |
| `Config_JSON` | JSON | Metadata técnica. |

---

### 2.3. HISTORIAL DE COTIZACIÓN (`HISTORIAL_COTIZACION`)
**Descripción:** Auditoría de cambios.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Log` | PK | ID evento. |
| `ID_Cotizacion` | FK -> `COTIZACIONES` | Target. |
| `Timestamp` | DATETIME | Cuándo ocurrió. |
| `Usuario` | TEXT | Quién ejecutó el cambio. |
| `Accion` | TEXT | Qué acción realizó. |
| `Detalle_Cambio` | JSON | Valores anterior/nuevo. |

---

## 3. Relaciones Clave

1. `ITEM_CATALOGO` pertenece a `CATEGORIAS`.
2. `ITEM_CATALOGO` usa `REGLA_PRECIO` por `ID_Regla_Precio` (override de ítem).
3. `CATEGORIAS` define regla de precio default por `ID_Regla_Precio_Default`.
4. `ITEM_CATALOGO` define override de cantidad por `ID_Regla_Cant_Override`.
5. `CATEGORIAS` define default de cantidad por `ID_Regla_Cant_Default`.
6. `ITEM_CATALOGO` y `CATEGORIAS` pueden apuntar a `REGLAS_IMPUESTO`.
7. `COMPOSICION_KIT` modela relación padre-hijo entre ítems.
8. `COTIZACIONES` tiene muchas `LINEA_DETALLE`.
9. `LINEA_DETALLE` puede referenciar `REGLAS_DESCUENTO`.
10. `COTIZACIONES` tiene muchos registros en `HISTORIAL_COTIZACION`.
