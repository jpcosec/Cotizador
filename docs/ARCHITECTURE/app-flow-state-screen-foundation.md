# App Flow Foundation: Estado vs Pantalla

## Objetivo

Dejar una base comun de lenguaje para el flujo de cotizacion, separando claramente:

- Pantalla (lo que el usuario ve)
- Estado (situacion del flujo)
- Evento/accion (lo que dispara transiciones)

Fecha: 2026-03-07

---

## Definiciones acordadas

- Pantalla: vista o modal visible para el usuario.
- Estado: etapa del flujo de negocio que habilita/restringe acciones.
- Evento/accion: disparador que mueve el estado o ejecuta efectos (save, print, etc.).

---

## Clasificacion de nodos actuales

| Nodo | Tipo principal | Nota |
|---|---|---|
| `Entry page` | Pantalla | Inicio del flujo |
| `database_browser` | Pantalla | Modulo de navegacion de tablas |
| `table_selector` | Subpantalla/componente UI | Parte interna de `database_browser` |
| `New_quotation` | Evento/accion | Dispara inicio de nueva cotizacion |
| `load_previous_quotation` | Evento/accion | Carga cotizacion previa (puede abrir selector) |
| `select_client` | Pantalla/modal | Seleccion de cliente existente |
| `new_client` | Pantalla/modal | Alta de cliente nuevo |
| `quotation` | Pantalla | Edicion principal |
| `validate` | Pantalla | Revision previa a salida/finalizacion |
| `print` | Accion (o pantalla opcional) | Puede ser `PrintPreview` si se vuelve vista explicita |
| `save` | Accion | Persistencia de cotizacion |

---

## Flujo acordado

```text
Entry page -> database_browser / New_quotation / load_previous_quotation
database_browser -> table_selector
New_quotation -> select_client / new_client -> quotation
quotation -> save / validate
validate -> print -> save
```

---

## Estados base sugeridos para AppFlow

- `HOME`
- `DB_BROWSING`
- `CLIENT_SELECTION`
- `CLIENT_CREATION`
- `QUOTATION_EDITING`
- `QUOTATION_VALIDATING`

Opcionales futuros:

- `PRINT_PREVIEW`
- `QUOTATION_SAVED`

---

## Siguiente paso

Detallar cada pantalla con:

1. objetivo de negocio,
2. data de entrada/salida,
3. eventos permitidos,
4. transiciones validas,
5. componentes involucrados.
