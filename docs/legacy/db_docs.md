# Diccionario de Datos y Entidades: SF Lodge v2.3

**Versión:** 2.3
**Estado:** Definición para Implementación (Completo con Precios, Descuentos e Impuestos)
**Propósito:** Describir cada entidad del sistema, sus campos y su función dentro de la arquitectura de Repositorios.

---

## 1. Datos Maestros (Mundo Real)
**Características:** Datos estáticos o de referencia. Representan entidades que existen independientemente de las ventas.
**Estrategia Técnica:** `isMasterData = true`. Se cargan en memoria (caché) al iniciar la ejecución.

### 1.1. REGLAS DE PRECIO (`REGLA_PRECIO`)
**Descripción:** Define *cómo* se cobra algo, separando la matemática del producto.
**Uso:** Un Item apunta a una Regla. El sistema lee la regla para saber qué fórmula aplicar.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Regla` | PK (String) | Identificador único (ej: `R-FIXED`, `R-PAX-SIMPLE`). |
| `Nombre_Formula` | String | Nombre descriptivo (ej: "Costo Fijo", "Por Pax + Base"). |
| `Costo_Base_Fijo` | Money | Monto que se cobra siempre, independiente de pax/tiempo. |
| `Costo_Unitario_Pax` | Money | Monto que se multiplica por la cantidad de asistentes. |
| `Costo_Unitario_Tiempo` | Money | Monto que se multiplica por la duración (horas/días). |
| `Costo_Unitario_Item` | Money | Monto que se multiplica por la cantidad de unidades del ítem. |
| `Formula_Legible` | String | Texto humano para mostrar en UI (ej: "$5000 x Persona"). |

---

### 1.2. CATÁLOGO DE ITEMS (`ITEM_CATALOGO`)
**Descripción:** Inventario de servicios, espacios y productos disponibles para la venta.
**Uso:** El usuario selecciona estos elementos para agregarlos a una cotización.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Item` | PK (String) | Identificador único (ej: `ITM-001`). |
| `Nombre` | String | Nombre comercial del servicio o producto. |
| `Categoria` | String | Agrupación visual (ej: "Banquetera", "Audio"). |
| `Categoria_Tipo` | Enum | `SERVICIO`, `SALON`, `PRODUCTO`. |
| `ID_Regla` | FK (String) | Relación con `REGLA_PRECIO`. |
| `ID_Impuesto` | FK (String) | **NUEVO:** Relación con `REGLAS_IMPUESTO` (ej: `IMP-IVA`, `IMP-EXENTO`). |
| `Precio_Base_Ref` | Money | Valor referencial (para mostrar en listas antes de calcular). |
| `Permite_Override_Pax` | Bool | `TRUE` si este ítem puede tener pax distinto al global. |
| `Duracion_Default_Min` | Int | Duración predeterminada en minutos. |
| `Activo` | Bool | Si `FALSE`, no aparece en el selector (borrado lógico). |

---

### 1.3. RESTRICCIONES DE NEGOCIO (`RESTRICCION`)
**Descripción:** Reglas de validación que impiden combinaciones inválidas.
**Uso:** El `ConstraintValidator` lee esta tabla para aprobar o rechazar una cotización.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Restriccion` | PK (String) | Identificador único. |
| `ID_Item_Trigger` | FK (String) | El ítem que "gatilla" la revisión (o `*` para todos). |
| `Tipo_Restriccion` | Enum | `MIN_PAX`, `MAX_PAX`, `REQUIERE`, `EXCLUYE`, `MIN_VENTA`. |
| `ID_Item_Target` | FK (String) | El ítem objetivo (solo para reglas REQUIERE/EXCLUYE). |
| `Valor_Limite` | Number | El valor umbral (ej: 50 para min_pax). |
| `Mensaje_Error` | String | Texto para mostrar al usuario si se rompe la regla. |
| `Nivel_Severidad` | Enum | `ERROR` (impide guardar) o `WARNING` (solo avisa). |

---

### 1.4. CLIENTES (`CLIENTES`)
**Descripción:** Base de datos de empresas y personas naturales.
**Uso:** Entidad a la cual se le asigna la cotización.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cliente` | PK (String) | Identificador único (ej: `CLI-0050`). |
| `Nombre_Empresa` | String | Razón social o nombre completo. |
| `RUT` | String | Identificador tributario único (validado). |
| `Email` | Email | Correo de contacto principal. |
| `Telefono` | String | Teléfono de contacto. |
| `Contacto_Nombre` | String | Nombre de la persona de contacto. |

---

### 1.5. COMPOSICIÓN DE KITS (`COMPOSICION_KIT`)
**Descripción:** Define la estructura jerárquica de ítems complejos (Menús, Packs, Kits).
**Uso:** El `CompositionService` usa esto para "explotar" un ítem padre.
**Detalle:** Ver `composition_logic.md` para algoritmo recursivo y estrategias de precio.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Composicion` | PK (String) | Identificador único de la relación. |
| `ID_Item_Padre` | FK (String) | El ítem comercial que selecciona el cliente (ej: `PACK-GOLD`). |
| `ID_Item_Hijo` | FK (String) | El componente operativo (ej: `SALON-MAIN`). |
| `Cantidad` | Decimal | Multiplicador de cantidad (ej: 1 Pack = 2 Parlantes). |
| `Tipo_Precio` | Enum | `ABSORBIDO` (Hijo vale $0) o `SUMAR` (Padre suma costo hijos). |
| `Es_Opcional` | Bool | (Futuro) Si el usuario puede desmarcar este componente. |

---

### 1.6. REGLAS DE DESCUENTO (`REGLAS_DESCUENTO`)
**Descripción:** Condiciones para aplicar rebajas automáticas O manuales.
**Uso:** El `DiscountService` revisa estas reglas.
**Detalle:** Ver `discount-bundles-engine-design-v2-1.md` para algoritmo y casos de uso.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Descuento` | PK (String) | Identificador único (ej: `DESC-MENU-GOLD`, `DESC-MANUAL`). |
| `Nombre` | String | Nombre que aparecerá en la cotización. |
| `Origen` | Enum | `SISTEMA` (Automático) o `MANUAL` (Vendedor). |
| `Trigger_Item` | FK (String) | El ítem que activa el descuento (Solo para `Origen=SISTEMA`). |
| `Tipo_Calculo` | Enum | `POR_PAX`, `FIJO`, `PORCENTAJE`. |
| `Valor` | Money | El monto a descontar (si es fijo). |
| `Permite_Editar_Valor` | Bool | `TRUE` si el vendedor puede escribir el monto. |
| `Requiere_Aprobacion` | Bool | `TRUE` si gatilla estado `Pendiente_Aprobacion`. |
| `Acumulable` | Bool | `TRUE` si se puede combinar con otros descuentos. |

---

### 1.7. REGLAS DE IMPUESTO (`REGLAS_IMPUESTO`)
**Descripción:** **NUEVA TABLA.** Define las tasas de impuestos aplicables. Permite flexibilidad ante cambios legales o impuestos específicos (Alcoholes, Lujo, etc.).
**Uso:** El `PricingEngine` consulta esta tabla al calcular el total de cada línea.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Impuesto` | PK (String) | Identificador único (ej: `IMP-IVA-19`, `IMP-ILA-VINOS`, `IMP-EXENTO`). |
| `Nombre` | String | Nombre legal (ej: "IVA Débito Fiscal", "Impuesto Adicional Alcoholes"). |
| `Tasa` | Decimal | Factor multiplicador (ej: 0.19 para 19%, 0.00 para exento). |
| `Codigo_Contable` | String | (Opcional) Código para integración futura con ERP/Softland. |
| `Activo` | Bool | Si el impuesto está vigente. |

---

## 2. Datos Transaccionales (Lógica/Proceso)
**Características:** Datos dinámicos generados por la operación.
**Estrategia Técnica:** `isMasterData = false`. Lectura bajo demanda (`findById`) y escritura optimizada (`append`).

### 2.1. ENCABEZADO DE COTIZACIÓN (`COTIZACIONES`)
**Descripción:** El contenedor principal que agrupa un evento. Define el contexto global.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Cotizacion` | PK (String) | Identificador único (ej: `COT-2024-001`). |
| `ID_Cliente` | FK (String) | Relación con el cliente. |
| `Estado` | Enum | `Borrador`, `Enviada`, `Pendiente_Aprobacion`, `Aprobada`, `Finalizada`. |
| `Fecha_Emision` | Date | Fecha de creación del documento. |
| `Fecha_Evento` | Date | Día de inicio del evento principal. |
| `Duracion_Dias` | Int | Cuántos días dura el evento. |
| `Pax_Global` | Int | Cantidad de asistentes base. |
| `Total_Neto` | Money | Suma de todas las líneas (Antes de impuestos). |
| `Total_IVA` | Money | Monto específico de IVA (19%). |
| `Total_Impuestos_Adic` | Money | **NUEVO:** Suma de otros impuestos (ej: ILA). |
| `Total_Final` | Money | Neto + IVA + Otros Impuestos. |
| `Desglose_Impuestos` | JSON | **NUEVO:** Objeto resumen (ej: `{"IVA": 1900, "ILA": 200}`). |
| `Version` | Int | Número de versión. |

---

### 2.2. LÍNEA DE DETALLE (`LINEA_DETALLE`)
**Descripción:** La instancia específica de un ítem vendido. Aquí se calculan precios e impuestos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `ID_Linea` | PK (String) | Identificador único de la línea. |
| `ID_Cotizacion` | FK (String) | A qué cotización pertenece. |
| `ID_Item` | FK (String) | Qué servicio/producto se está vendiendo. |
| `Es_Descuento` | Bool | `TRUE` si es línea de descuento. |
| `ID_Regla_Descuento` | FK (String) | Referencia a `REGLAS_DESCUENTO`. |
| `Dia_Numero` | Int | Día relativo del evento. |
| `Hora_Inicio` | Time | Hora de inicio del servicio. |
| `Input_Cantidad` | Int | Cantidad de unidades. |
| `Input_Pax` | Int | Pax específico para esta línea. |
| `Precio_Unitario_Calc` | Money | Precio unitario neto calculado. |
| `Precio_Total_Linea` | Money | Precio Total Neto (Unitario * Cantidad). |
| `Impuesto_Monto` | Money | **NUEVO:** Monto calculado de impuesto para esta línea. |
| `Impuesto_Tasa_Snapshot` | Decimal | **NUEVO:** Tasa usada en el momento (ej: 0.19). Para auditoría. |
| `Comentarios` | Text | Instrucciones especiales. |
| `Config_JSON` | JSON | Detalles técnicos. |

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

1.  **Cotización** TIENE MUCHAS **Líneas de Detalle**.
2.  **Línea de Detalle** USA UN **Item de Catálogo**.
3.  **Item de Catálogo** OBEDECE UNA **Regla de Precio**.
4.  **Item de Catálogo** APLICA UNA **Regla de Impuesto**.
5.  **Cotización** PERTENECE A UN **Cliente**.
6.  **Restricción** CONTROLA UNO O MÁS **Items de Catálogo**.
7.  **Composición** VINCULA UN **Item Padre** CON MUCHOS **Items Hijo** (recursivo).
8.  **Regla de Descuento** SE ACTIVA POR UN **Item de Catálogo** (Trigger) O POR UN **Vendedor** (Manual).
9.  **Línea de Detalle** PUEDE REFERENCIAR UNA **Regla de Descuento** (si `Es_Descuento = TRUE`).
