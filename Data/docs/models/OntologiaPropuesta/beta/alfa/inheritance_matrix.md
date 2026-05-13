# Matriz de herencia

## Regla general

- `Propiedad` se hereda desde `OP_CLASS`
- `Ruling` se compone desde `Area + OP_CLASS + Categoria`
- `Pricing` se compone desde `OP_CLASS + Categoria`
- `ItemCatalogo` solo instancia y overridea localmente

## Quien aporta que

| Capa | Propiedades | Ruling | Pricing | Naming/Contexto | Composicion |
|---|---|---|---|---|---|
| `Area` | No | Si, de dominio | No directo | Si, semantico | No |
| `OP_CLASS` | Si, estructurales | Si, patron base | Si, patron base | No | Si |
| `Categoria` | No | Si, modulador | Si, modulador | Si, comercial | No |
| `ContratoItem` | Resultado | Resultado | Resultado | Resultado | Resultado |
| `ItemCatalogo` | Instancia valores | Override local opcional | Override local opcional | Nombre comercial | Instancia final |

## Traduccion operativa

### `Area`

Aporta:

- reglas del dominio
- lenguaje del dominio
- restricciones generales del area

### `OP_CLASS`

Aporta:

- propiedades requeridas
- estructura de cuantificacion
- patron de pricing
- patron de ruling
- politica de composicion

### `Categoria`

Aporta:

- nombre comercial de la familia
- op_classes permitidas
- moduladores de pricing
- moduladores de ruling
- presentacion y navegacion

### `ItemCatalogo`

Aporta:

- nombre final vendible
- valores concretos para propiedades
- overrides locales permitidos
