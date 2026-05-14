# Sistema Tipado Propuesto

## Formula central

`ITEM_CATALOGO = CLASE_CATALOGO + overrides`

`CLASE_CATALOGO = AREA + TIPO_ITEM + SUBTIPO_ITEM? + FACETAS + DIMENSIONES_DEFAULT + PRECIO_BASE + REGLAS_BASE`

## Capas

### 1. Area

Responde: **de que dominio del negocio viene la oferta**.

Ejemplos:

- `cocina`
- `bebidas_bar`
- `alojamiento`
- `spa_wellness`
- `teambuilding`
- `infraestructura`
- `operacional`

### 2. Tipo item

Responde: **que clase operativa de cosa es**.

Tipos base propuestos:

- `servicio`
- `producto`
- `recurso`
- `compuesto`

Definiciones:

- `servicio`: item cuantificable que usa personal o atencion de alguna area; puede asignarse a locacion y puede consumir productos.
- `producto`: item cuantificable que debe poder descontarse o administrarse como consumo/inventario.
- `recurso`: pieza operativa reusable; puede ser `personal`, `equipamiento` o `locacion`.
- `compuesto`: item orquestador que agrupa servicios, productos y recursos. Aqui viven `evento`, `pack` o `programa`.

### 3. Subtipo item

Responde: **que variante operativa toma el tipo item**.

Ejemplos:

- para `recurso`: `personal`, `equipamiento`, `locacion`
- para `compuesto`: `evento`, `pack`, `programa`
- para `producto`: `consumible`, `inventariable`
- para `servicio`: `agendable`, `acceso`, `atencion`, `experiencia`

### 4. Clase de catalogo

Responde: **que patron reusable del negocio estoy instanciando**.

Ejemplos:

- `Sandwich`
- `BuffetDesayuno`
- `BarAbierto`
- `HabitacionHotel`
- `Masaje30Min`
- `TeambuildingGuiado`

Esta capa permite crear muchos items concretos sin redefinir facetas,
dimensiones, reglas y defaults cada vez.

### 5. Facetas

Responde: **como se comporta en el sistema**.

Ejemplos:

- `Vendible`
- `Agendable`
- `Consumible`
- `RequiereLocacion`
- `RequiereHorario`
- `RequierePax`
- `RequiereInfra`
- `TienePrecio`
- `TieneReglas`
- `EsUnitario`
- `EsServicioCompuesto`
- `EsAddon`

### 6. Dimensiones

Responde: **con que ejes se configura**.

- `TIPO_CLIENTE`
- `LOCACION`
- `HORARIO`
- `TIPO_VALORIZACION`
- `INFRA`

### 7. Comportamiento

Responde: **como se calcula y valida**.

- `PERFIL_PRECIO`
- `REGLA_NEGOCIO`

## Ejemplos rapidos

- `buffet = cocina | servicio`
- `sandwich = cocina | producto`
- `masaje = spa_wellness | servicio`
- `gorro piscina = spa_wellness | producto`
- `salon Chinook = infraestructura | recurso | locacion`
- `teambuilding Naufrago = teambuilding | compuesto | evento`

## Regla de diseno

- Las categorias comerciales no son clases base.
- Las categorias comerciales son vistas de navegacion del catalogo.
- La base semantica real vive en `AREA + TIPO_ITEM + SUBTIPO_ITEM?`.
- La capa reusable que conversa con la categoria comercial vive en `CLASE_CATALOGO`.
- El comportamiento transversal vive en `FACETA`.
- Los `ITEM_CATALOGO` concretos heredan defaults desde `CLASE_CATALOGO` y solo overridean lo necesario.
