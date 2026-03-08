# App Flow Screen-by-Screen Spec

## Scope

Documento de trabajo para definir el flujo funcional de cotizacion separando:

- pantalla (UI visible),
- estado (etapa del flujo),
- evento/accion (disparador de transicion o efecto).

Fecha: 2026-03-07

---

## Flujo base acordado

```text
Entry page -> database_browser / New_quotation / load_previous_quotation
database_browser -> table_selector
New_quotation -> select_client / new_client -> quotation
quotation -> save / validate
validate -> print -> save
```

---

## Mapeo de nodos: pantalla vs estado vs evento

| Nodo | Clasificacion principal | Estado sugerido |
|---|---|---|
| `Entry page` | Pantalla | `HOME` |
| `database_browser` | Pantalla | `DB_BROWSING` |
| `table_selector` | Subpantalla/componente de UI | interno de `DB_BROWSING` |
| `New_quotation` | Evento de navegacion | `HOME -> NEW_QUOTATION_INIT` |
| `load_previous_quotation` | Evento de navegacion | `HOME -> LOAD_PREVIOUS` |
| `select_client` | Pantalla/modal | `CLIENT_SELECTION` |
| `new_client` | Pantalla/modal | `CLIENT_CREATION` |
| `quotation` | Pantalla | `QUOTATION_EDITING` |
| `validate` | Pantalla | `QUOTATION_VALIDATING` |
| `print` | Accion (o pantalla opcional) | `PRINT_PREVIEW` (opcional) |
| `save` | Accion/efecto | `SAVE_EXECUTED` (logico/transitorio) |

---

## Catalogo de estados recomendado

Estados principales:

- `HOME`
- `DB_BROWSING`
- `NEW_QUOTATION_INIT`
- `LOAD_PREVIOUS`
- `CLIENT_SELECTION`
- `CLIENT_CREATION`
- `QUOTATION_EDITING`
- `QUOTATION_VALIDATING`

Estados opcionales (si se quiere explicitar en la maquina):

- `PRINT_PREVIEW`
- `SAVE_EXECUTED`

---

## Pantalla 1: Entry page

```text
+------------------------------------------------------+
| Cotizador Lodge                                      |
|------------------------------------------------------|
| [ Nueva cotizacion ]                                 |
| [ Cargar cotizacion previa ]                         |
| [ Database Browser ]                                 |
+------------------------------------------------------+
```

- Estado: `HOME`
- Objetivo: entrada unica a los tres caminos funcionales.
- Entrada: boot o reset.
- Salida:
  - `CLICK_DATABASE_BROWSER` -> `DB_BROWSING`
  - `CLICK_NEW_QUOTATION` -> `NEW_QUOTATION_INIT`
  - `CLICK_LOAD_PREVIOUS` -> `LOAD_PREVIOUS`

---

## Pantalla 2: Database Browser

```text
+----------------------------------------------------------------------------------+
| Database Browser                                              [Back to Home]     |
|----------------------------------------------------------------------------------|
| Table Selector                  | Table Grid                                    |
|---------------------------------|-----------------------------------------------|
| CLIENTES                        | rows... cols...                                |
| ITEM_CATALOGO                   |                                                |
| CATEGORIAS                      | [Add Row] [Edit Cell] [Save] [Cancel]         |
| REGLAS                          |                                                |
+----------------------------------------------------------------------------------+
```

- Estado: `DB_BROWSING`
- Objetivo: exploracion y edicion de tablas.
- Subpantalla interna: `table_selector`.
- Eventos:
  - `SELECT_TABLE` (no cambia estado global)
  - `EDIT_CELL`, `ADD_ROW`, `SAVE_ROW`, `CANCEL_EDIT`
  - `BACK_HOME` -> `HOME`
- Regla: no persistir si validacion de fila falla.

---

## Pantalla 3: New quotation (launcher)

```text
+------------------------------------------------------+
| Nueva Cotizacion                                     |
|------------------------------------------------------|
| [ Seleccionar cliente existente ]                    |
| [ Crear cliente nuevo ]                              |
| [ Volver ]                                           |
+------------------------------------------------------+
```

- Estado: `NEW_QUOTATION_INIT`
- Objetivo: decidir origen de cliente antes de editar la cotizacion.
- Eventos:
  - `GO_SELECT_CLIENT` -> `CLIENT_SELECTION`
  - `GO_NEW_CLIENT` -> `CLIENT_CREATION`
  - `CANCEL_TO_HOME` -> `HOME`
- Regla: no pasar a `QUOTATION_EDITING` sin cliente.

---

## Pantalla 4: Select client

```text
+----------------------------------------------------------------+
| Seleccionar Cliente                               [Cerrar]      |
|----------------------------------------------------------------|
| Buscar: [____________________________]                         |
|                                                                |
| Cliente A  RUT  correo                        [Seleccionar]    |
| Cliente B  RUT  correo                        [Seleccionar]    |
|                                                                |
| [ Crear cliente nuevo ]                                        |
+----------------------------------------------------------------+
```

- Estado: `CLIENT_SELECTION`
- Objetivo: elegir cliente existente.
- Eventos:
  - `SEARCH_CLIENT` (mismo estado)
  - `SELECT_CLIENT` -> `QUOTATION_EDITING`
  - `GO_NEW_CLIENT` -> `CLIENT_CREATION`
  - `CLOSE` -> `HOME` (si no hay cliente) o `QUOTATION_EDITING` (si ya existe cliente activo)

---

## Pantalla 5: New client

```text
+----------------------------------------------------------------+
| Nuevo Cliente                                     [Cancelar]    |
|----------------------------------------------------------------|
| Empresa:   [____________________]                              |
| RUT:       [____________________]                              |
| Email:     [____________________]                              |
| Telefono:  [____________________]                              |
| Contacto:  [____________________]                              |
|                                                                |
| [ Guardar cliente ]                             [Volver]        |
+----------------------------------------------------------------+
```

- Estado: `CLIENT_CREATION`
- Objetivo: alta de cliente dentro del flujo.
- Eventos:
  - `SET_FIELD` (mismo estado)
  - `SUBMIT_NEW_CLIENT` -> `QUOTATION_EDITING` (cliente autoseleccionado)
  - `CANCEL` -> `CLIENT_SELECTION`
- Validacion minima sugerida: `empresa` y `rut` requeridos.

---

## Pantalla 6: Quotation

```text
+------------------------------------------------------------------------------------------------+
| Cliente X | Fecha Inicio | Dias | Pax Global                             [Guardar] [Validar]  |
|------------------------------------------------------------------------------------------------|
| Catalogo (izquierda)                              | Basket por Dia (derecha)                    |
| Buscar categoria/item                              | Tabs: Dia 1 Dia 2 Dia 3                     |
| Categoria A -> Item 1 [Agregar]                   | Lineas del dia: item, pax, cant, hora, $     |
| Categoria B -> Item 2 [Agregar]                   | [editar override] [mover] [duplicar]         |
|                                                    | Subtotal / Total                              |
+------------------------------------------------------------------------------------------------+
```

- Estado: `QUOTATION_EDITING`
- Objetivo: construir la cotizacion por dias y entradas.
- Eventos:
  - `SET_SETTINGS`
  - `SHIP_ITEM`
  - `SET_ENTRY_OVERRIDE`, `CLEAR_OVERRIDE`, `RESET_OVERRIDES`
  - `MOVE_ENTRY`, `COPY_ENTRY`, `DUPLICATE_ENTRY`
  - `SELECT_DAY`
  - `SAVE_QUOTATION`
  - `GO_VALIDATE` -> `QUOTATION_VALIDATING`
- Guardas:
  - para editar/guardar/validar debe existir cliente seleccionado
  - `GO_VALIDATE` requiere al menos una entrada en basket

---

## Pantalla 7: Validate

```text
+----------------------------------------------------------------------------------+
| Validacion Cotizacion                               [Volver a Cotizacion]        |
|----------------------------------------------------------------------------------|
| Cliente | Fecha | Pax                                                         |
| Tabla resumen por dia/item                                                    |
| Subtotal | IVA | Total                                                        |
|----------------------------------------------------------------------------------|
| [Imprimir]                                                    [Guardar]         |
+----------------------------------------------------------------------------------+
```

- Estado: `QUOTATION_VALIDATING`
- Objetivo: revision final previa a impresion y guardado.
- Eventos:
  - `BACK_TO_QUOTATION` -> `QUOTATION_EDITING`
  - `PRINT_QUOTATION` -> `PRINT_PREVIEW` (si existe como estado)
  - `SAVE_QUOTATION` -> `SAVE_EXECUTED`
- Regla: no recalcular negocio aqui; solo proyeccion final.

---

## Pantalla 8: Print (opcional como pantalla)

```text
+----------------------------------------------------------------------------------+
| Print Preview                                              [Imprimir] [Cerrar]   |
|----------------------------------------------------------------------------------|
| Documento imprimible (cliente, items, totales)                                  |
+----------------------------------------------------------------------------------+
```

- Estado: `PRINT_PREVIEW` (opcional)
- Objetivo: confirmar salida de impresion/PDF.
- Eventos:
  - `CONFIRM_PRINT` (accion)
  - `SAVE_AFTER_PRINT` -> `SAVE_EXECUTED`
  - `CLOSE_PRINT` -> `QUOTATION_VALIDATING`

---

## Pantalla 9: Load previous quotation

```text
+--------------------------------------------------------------------+
| Cargar Cotizacion Previa                              [Cerrar]      |
|--------------------------------------------------------------------|
| Buscar por cliente/rut/folio: [____________________]               |
|                                                                    |
| Folio 1023 | Cliente A | Fecha | Estado              [Abrir]       |
| Folio 1024 | Cliente B | Fecha | Estado              [Abrir]       |
+--------------------------------------------------------------------+
```

- Estado: `LOAD_PREVIOUS`
- Objetivo: buscar y abrir cotizacion existente.
- Eventos:
  - `SEARCH_QUOTATION`
  - `OPEN_QUOTATION` -> `QUOTATION_EDITING`
  - `CLOSE` -> `HOME`
- Regla: `OPEN_QUOTATION` debe hidratar cliente, settings, basket y contexto antes de mostrar edicion.

---

## Matriz corta de transiciones

| Desde | Evento | Hacia |
|---|---|---|
| `HOME` | `CLICK_DATABASE_BROWSER` | `DB_BROWSING` |
| `HOME` | `CLICK_NEW_QUOTATION` | `NEW_QUOTATION_INIT` |
| `HOME` | `CLICK_LOAD_PREVIOUS` | `LOAD_PREVIOUS` |
| `NEW_QUOTATION_INIT` | `GO_SELECT_CLIENT` | `CLIENT_SELECTION` |
| `NEW_QUOTATION_INIT` | `GO_NEW_CLIENT` | `CLIENT_CREATION` |
| `CLIENT_SELECTION` | `SELECT_CLIENT` | `QUOTATION_EDITING` |
| `CLIENT_SELECTION` | `GO_NEW_CLIENT` | `CLIENT_CREATION` |
| `CLIENT_CREATION` | `SUBMIT_NEW_CLIENT` | `QUOTATION_EDITING` |
| `LOAD_PREVIOUS` | `OPEN_QUOTATION` | `QUOTATION_EDITING` |
| `QUOTATION_EDITING` | `GO_VALIDATE` | `QUOTATION_VALIDATING` |
| `QUOTATION_VALIDATING` | `BACK_TO_QUOTATION` | `QUOTATION_EDITING` |
| `QUOTATION_VALIDATING` | `PRINT_QUOTATION` | `PRINT_PREVIEW` |
| `PRINT_PREVIEW` | `SAVE_AFTER_PRINT` | `SAVE_EXECUTED` |

---

## Criterio de implementacion

Al implementar `AppFlow`, cada pantalla debe declarar:

1. datos de entrada,
2. eventos permitidos,
3. guardas,
4. efectos,
5. transiciones de salida.

Este documento funciona como base de contratos para ese trabajo.
