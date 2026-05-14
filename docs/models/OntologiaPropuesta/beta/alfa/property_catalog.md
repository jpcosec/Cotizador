# Catalogo de propiedades

## Idea

No todas las propiedades juegan el mismo rol.

Hay dos grupos:

- `activas`: alimentan `pricing` y/o `ruling` dentro de la cotizacion
- `descriptivas`: describen el item o la linea, pero por ahora no cambian calculo ni validacion

Ademas, `Area` y `CategoriaOperacional` tambien deben entenderse como propiedades estructurales base del item.

## Regla de override

- `CategoriaOperacional` define la existencia estructural de la propiedad
- `Categoria` puede contextualizar o proponer defaults
- `ItemCatalogo` puede preconfigurar valores concretos
- `LineaCotizada` puede materializar valores runtime

Lo que se overridea es normalmente el **valor**, no la existencia estructural de la propiedad.

## Modos de override

- `fixed`: no se cambia libremente
- `category_default`: categoria puede proponer default
- `item_default`: item de catalogo puede proponer default
- `quote_runtime`: linea cotizada fija valor efectivo
- `derived_only`: se calcula, no se edita manualmente

## Tabla alfa de propiedades

| Propiedad | Tipo | Clase | Representa | Interactua con | Origen estructural | Overrideable en | Modo override |
|---|---|---|---|---|---|---|---|
| `area` | `string_enum` | estructural | dominio de negocio del item | semantica, ruling | `BaseItem` | no aplica | `fixed` |
| `categoria_operacional` | `string_enum` | estructural | tipo operacional del item | propiedades, pricing, ruling | `BaseItem` | no aplica | `fixed` |
| `pax` | `int` | activa | cantidad de personas afectadas por la linea | `pricing`, `ruling`, `cotizacion` | `CategoriaOperacional` | `LineaCotizada` | `quote_runtime` |
| `cantidad` | `int` | activa | numero de unidades compradas o usadas | `pricing`, `ruling` | `CategoriaOperacional` | `ItemCatalogo`, `LineaCotizada` | `item_default`, `quote_runtime` |
| `duracion` | `duration_minutes` | activa | tiempo operativo de ejecucion o uso | `pricing`, `ruling` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo`, `LineaCotizada` | `category_default`, `item_default`, `quote_runtime` |
| `hora_inicio` | `time` | activa | hora concreta de inicio | `ruling`, `cotizacion` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo`, `LineaCotizada` | `category_default`, `item_default`, `quote_runtime` |
| `fecha` | `date` | activa | fecha de ejecucion de la linea | `ruling`, `cotizacion` | `LineaCotizada` | `LineaCotizada` | `quote_runtime` |
| `bloque_horario` | `string_enum` | activa | bloque o franja operacional | `pricing`, `ruling` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo`, `LineaCotizada` | `category_default`, `item_default`, `quote_runtime` |
| `locacion_id` | `string_ref` | activa | locacion concreta usada por la linea | `ruling`, `pricing`, `composicion` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo`, `LineaCotizada` | `category_default`, `item_default`, `quote_runtime` |
| `capacidad_min` | `int` | activa | minimo permitido para operar | `ruling` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `capacidad_max` | `int` | activa | maximo permitido para operar | `ruling` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `anticipacion_min` | `duration_hours` | activa | anticipacion minima requerida | `ruling` | `Area` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `formato_servicio` | `string_enum` | activa | modalidad efectiva del servicio | `ruling`, `pricing` | `CategoriaOperacional` | `Categoria`, `ItemCatalogo`, `LineaCotizada` | `category_default`, `item_default`, `quote_runtime` |
| `componentes` | `json_list` | activa | subitems de un item compuesto | `pricing`, `ruling`, `composicion` | `CategoriaOperacional` | `ItemCatalogo`, `LineaCotizada` | `item_default`, `quote_runtime` |
| `subtipo_recurso` | `string_enum` | activa | variante operacional de recurso | `ruling`, `composicion` | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `unidad` | `string_enum` | descriptiva | unidad operativa de medida | `pricing` indirecto, UI | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `sku` | `string` | descriptiva | identificador de inventario o producto | inventario / ops | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `capacidad_unidad` | `string_enum` | descriptiva | unidad en que se expresa capacidad | `ruling` indirecto | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `nivel_servicio` | `string_enum` | descriptiva | variante comercial o cualitativa | UI, naming | `Categoria/Item` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `temperatura_servicio` | `string_enum` | descriptiva | condicion esperada del producto | operacion | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `bodega_origen` | `string_ref` | descriptiva | origen logistico del producto | operacion | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `equipo_asignado` | `string_ref` | descriptiva | personal/equipo asociado por defecto | operacion, planning | `CategoriaOperacional` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `locacion_fisica` | `string_ref` | descriptiva | ubicacion base del recurso | operacion | `CategoriaOperacional` | `ItemCatalogo` | `item_default` |
| `requiere_reserva` | `bool` | activa | si exige reserva o bloqueo previo | `ruling` | `Area/CategoriaOperacional` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `requiere_autorizacion` | `bool` | activa | si necesita aprobacion externa | `ruling` | `Area` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `incluye` | `json_list` | descriptiva | componentes incluidos sin cotizarse aparte | UI, operacion | `Categoria/Item` | `ItemCatalogo` | `item_default` |
| `ratio_operacional` | `string_pattern` | activa | proporcion operativa recomendada/obligatoria | `ruling`, `composicion` | `Area` | `Categoria`, `ItemCatalogo` | `category_default`, `item_default` |
| `precio_base_ref` | `money` | derivada | componente fijo del pricing resuelto | `pricing` | `Pricing` | `LineaCotizada` | `derived_only` |
| `precio_variable_ref` | `money` | derivada | componente variable del pricing resuelto | `pricing` | `Pricing` | `LineaCotizada` | `derived_only` |
| `notas_operativas` | `text` | descriptiva | texto libre util para operacion | UI / backoffice | `Categoria/Item` | `ItemCatalogo`, `LineaCotizada` | `item_default`, `quote_runtime` |
