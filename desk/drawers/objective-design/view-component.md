# Reusable `View` Component

## Why

The future product map is no longer a single quotation flow with a side admin area. It is a set of outer-layer views with internal stage progression:

- `Home`
- `Nueva Cotizacion`
- `Editor Cotizacion`
- `Validador`
- `Formulario Generico DB`
- `Formulario Especifico DB`

That means the shell needs a reusable way to model:

- a view as a first-class unit
- its internal stage progression
- the units active in each stage
- the allowed transitions between stages
- the capabilities visible in that view

## Proposed Role

`View` should be a reusable meta-component that models an outer-layer surface.

It is not a business component like `Basket` or `Catalog`.
It is a composition component responsible for:

- owning a `view_id`
- owning a `stage_id`
- exposing visible units for the current stage
- handling transitions within the view flow
- providing a common contract for shell navigation

But in the original architecture idea it is more than navigation glue:

- `View` is the first orchestration layer above containers
- it receives persistence/output capabilities from upper boundaries
- it pushes state mutations and data-store interactions into containers
- it aggregates child state upward for projection

## Contract

### Inputs

- route or navigation intent
- current app context
- feature/capability flags
- child-unit registration
- persistence/export capabilities
- store access boundary

### Outputs

- current `view`
- current `stage`
- visible units for the stage
- navigation actions
- transition signals
- aggregated view state
- child-container projections

## Suggested Shape

```yaml
View:
  id: editor_cotizacion
  stages:
    - sidebar_catalogo
    - selector_dia
    - editor_tiempo
    - editor_canasta
    - acciones_item
  units:
    - Catalog
    - DaySelector
    - TimelineEditor
    - Basket
  transitions:
    - from: sidebar_catalogo
      to: editor_tiempo
    - from: editor_tiempo
      to: editor_canasta
```

## Why It Helps

- makes outer-layer navigation explicit instead of implicit shell glue
- lets every product surface use the same composition model
- separates `view/stage orchestration` from domain units like `Basket` or `Item`
- gives the final product a reusable way to represent flows without inventing a new shell per screen family
- preserves the original idea that the view is a runtime abstraction, not just a route label

## Current Reach

This can be introduced mostly by regrouping what already exists:

- current quotation stages already behave like a view-flow
- modals, sidebar, timeline, item list, validator, editor forms can be re-grouped under explicit views
- the shell can become `AppShell -> View -> Units` instead of ad-hoc screen wiring

## Boundary Rule

`View` should not own pricing, persistence, or store logic.

It should only:

- coordinate which units are visible/active
- manage stage transitions
- pass signals between shell and child units
- aggregate child state for UI projection

Business truth remains in the domain/runtime units.

Related note:

- item pricing is computed locally at item level
- quantities and rules flow up and down through the hierarchy
- upper layers collect totals/results, not replace local item computation
