# Aggregation Rules

## Core Rule

Pricing is local-first. Aggregation is upward.

## Item Rule

- each `Item` computes pricing from its own quantities
- each `Item` evaluates its own rules from context, quantities, and pricing
- each `Item` emits its resulting snapshot upward

## Container Rule

- a `Container` does not replace item-level pricing
- a `Container` collects child outputs and aggregates them
- a `Container` may aggregate:
  - totals
  - warnings/errors
  - availability
  - grouped quantities

## View Rule

- a `View` does not price items directly
- a `View` coordinates containers and collects container projections
- a `View` can create stage-level summaries from lower-level aggregates

## Flow Rule

Downward flow:

- context
- mutations
- selected rules/constraints
- stage/view conditions

Upward flow:

- quantities
- totals
- rule activations
- warnings/errors
- availability
- projections

## Anti-Pattern

Avoid this:

```text
View -> computes all prices directly
Container -> mutates item totals directly
```

Prefer this:

```text
View -> coordinates
Container -> aggregates
Item -> computes
```
