# Primitiva: Categoria

## Idea

`Categoria` es la capa comercial de organizacion del catalogo.

No define la estructura operacional del item.
Su funcion es agrupar, nombrar y presentar familias de items dentro del cotizador.

## Pregunta que responde

**Como se presenta esta familia de items dentro del catalogo comercial?**

## Regla clave

La estructura del item no nace en `Categoria`.

La estructura nace de la combinacion de dos propiedades base:

- `Area`
- `CategoriaOperacional`

La `Categoria` comercial solo contextualiza esa combinacion para el catalogo.

## Que hace una Categoria

- agrupa items comercialmente
- referencia un `Area`
- restringe o habilita `CategoriaOperacional`
- propone naming comercial
- puede proponer defaults comerciales

## Lo que no hace

- no crea propiedades estructurales nuevas
- no define pricing por si sola
- no define ruling por si sola

## Relacion con pricing y ruling

- `Pricing` se resuelve desde combinaciones de propiedades
- `Ruling` puede emerger desde cualquier propiedad relevante
- `Categoria` solo puede modular o contextualizar, no reemplazar la logica base
