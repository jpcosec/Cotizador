# Matriz de CategoriaOperacional

## Regla

`CategoriaOperacional` define las propiedades estructurales del contrato.

`Area` contextualiza esas propiedades y `Categoria` las modula comercialmente.

## Tabla

| CategoriaOperacional | Que representa | Propiedades activas minimas | Propiedades descriptivas comunes | Pricing tipico por propiedades | Ruling tipico por propiedades | Composicion |
|---|---|---|---|---|---|---|
| `servicio` | prestacion cuantificable ejecutada en un momento | `pax`, `duracion`, `hora_inicio`, `locacion_id?`, `bloque_horario?`, `formato_servicio?` | `nivel_servicio`, `equipo_asignado`, `notas_operativas` | por `pax`, `duracion`, bloque, locacion | capacidad, ventana horaria, anticipacion, formato | puede consumir productos y recursos |
| `producto` | item de consumo o inventario | `cantidad`, `pax?`, `bloque_horario?` | `unidad`, `sku`, `temperatura_servicio`, `bodega_origen`, `notas_operativas` | por `cantidad`, combinaciones comerciales | stock, ratio, minimos | puede ser parte de servicio o compuesto |
| `recurso` | pieza operativa reusable | `subtipo_recurso`, `duracion?`, `locacion_id?`, `capacidad_min?`, `capacidad_max?`, `requiere_reserva?` | `capacidad_unidad`, `locacion_fisica`, `equipo_asignado`, `notas_operativas` | por tiempo, uso, bloque o asignacion | disponibilidad, exclusividad, capacidad, dependencia | puede ser asignado a servicios o compuestos |
| `compuesto` | item orquestador que agrupa otros items | `componentes`, `pax`, `duracion`, `locacion_id`, `bloque_horario?` | `nivel_servicio`, `notas_operativas` | por combinacion de componentes y contexto | dependencias, ratio, seguridad, agenda, capacidad | agrupa servicios, productos y recursos |
