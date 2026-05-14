# Operaciones: Pricing y Ruling

## Pricing

`Pricing` es una operacion de `CategoriaCatalogo`.

### Input

- `PropiedadesEfectivas`

### Regla

- usa propiedades efectivas runtime
- no vive en el item
- no vive en la linea

## Ruling

`Ruling` es una operacion de `CategoriaCatalogo`.

### Input

- `PropiedadesEfectivas`
- `QuoteContext`

### Regla

- puede validar compatibilidades, restricciones y dependencias
- no vive en el item
- no vive en la linea

## Formula resumida

- `Pricing = CategoriaCatalogo.pricing(PropiedadesEfectivas)`
- `Ruling = CategoriaCatalogo.ruling(PropiedadesEfectivas, QuoteContext)`
