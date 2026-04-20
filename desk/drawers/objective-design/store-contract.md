# Store Contract

## Role

`Store` is a bounded access layer.

It is **not**:

- a raw DB dump
- a whole-dataset dependency
- a passive schema bucket

It **is**:

- a selective query interface
- a persistence boundary
- an initialization and on-demand loading boundary

## Load Policy

The store loads from lower-level persistence only in two occasions:

1. upon initialization
2. when explicitly asked to

## Query Rule

Consumers should not ask for the whole store by default.

They should ask for:

- one entity
- many entities by id
- one family/group/category
- one quotation
- one filtered result set

## Minimum API Shape

```text
initialize()
getClient(id)
getClients(filter)
getItem(id)
getItems(ids)
getFamily(id)
getCategory(id)
getQuotation(id)
searchQuotations(filter)
persistQuotation(payload)
persistEntity(type, payload)
deleteEntity(type, id)
```

## Runtime Relationship

- `View` can talk to `Store`
- `Container` can talk to `Store`
- `Item` may talk to `Store` only for resolved definitions or explicitly injected lookup needs

Preferred rule:

- lookups should be resolved as high as practical
- item-level store access should stay narrow and explicit

## Architectural Goal

The current codebase has store-like behavior split across:

- resolver/database modules
- persistence adapters
- serialization/hydration helpers

The target is a clearer single bounded facade that still delegates internally.
