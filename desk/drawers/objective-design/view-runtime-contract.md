# View Runtime Contract

## Original Intended Abstraction

`View` is a real code abstraction, not just a documentation grouping.

The intended chain is:

```text
DatabasePersistence / ExportToPdf
  -> initializes and gives persistence to
View
  -> applies state mutations and data-store interaction to
Container
  -> applies state mutations and data-store interaction to
Item
```

Where:

- `View` is the outer composition/runtime surface
- `Container` means structures like `Basket` and `Catalog`
- `Item` is the atomic commercial/pricing unit

## Responsibility By Layer

### DatabasePersistence / ExportToPdf

- initialize the view runtime when needed
- provide persistence/output capabilities to the view
- stay outside the business editing units

### View

- own outer-layer stage/view state
- coordinate the visible containers
- receive and route state mutations
- talk to the data store boundary
- aggregate state from lower layers
- expose a projection surface to the UI

### Container

- hold groups of items in a meaningful editing structure
- examples: `Basket`, `Catalog`
- receive state mutations from the view
- propagate relevant context to items
- collect item-level results upward

Containers are recursive.

- a container can contain items
- a container can also contain other containers

Example:

```text
Catalog
  -> Category
    -> Item
```

So `Container` should be understood as a compositional layer, not only a flat list holder.

### Item

- own quantity-level and rule-level logic inputs
- mutate local state from signals coming from container/view
- compute local pricing from quantities
- emit rule activations, quantities, and totals upward

## Flow Semantics

### Rules

Rules flow both upward and downward.

- downward:
  - higher layers pass context, enabled rules, or triggering conditions into children
- upward:
  - children emit rule activations, warnings, errors, or effects back to upper layers

Each component receives rules as signals and executes them through pricing/rule logic.

### Quantities

Quantities also flow both upward and downward.

- downward:
  - global context, day context, parent context, or overrides affect item quantities
- upward:
  - item quantity results are collected by container/view layers

### Pricing

Pricing is local-first.

- each `Item` calculates its own pricing from its quantities
- upper layers do not directly price the whole system first
- upper layers collect totals upward from item results

So the intended flow is:

```text
context/rules/quantity signals down
pricing/rule activations/totals up
```

## Architectural Reading

This implies a strongly recursive design:

- a `View` coordinates `Containers`
- a `Container` coordinates `Containers` and/or `Items`
- each layer mutates local state and aggregates child state

And also a strict pricing rule:

- pricing belongs to the item-level computation boundary
- aggregation belongs to upper layers

## Code Consequence

If implemented faithfully, the shell should read like:

```text
AppShell
  -> View
    -> Container
      -> Item
```

with side boundaries:

```text
Persistence / Export / Store
Pricing / Rules
```

That means `View` is not just a route wrapper. It is the first orchestration unit above containers.
