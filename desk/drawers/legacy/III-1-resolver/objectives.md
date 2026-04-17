# III-1 Resolver Panel — Objectives

**Prerequisite:** I-1 (Database Playground) must be complete.

**References:**
- `plan/III-1-resolver/field_contracts.md` (resolver output contract)
- `plan/III-1-resolver/html_resolver_panel_draft.html` (resolver panel draft)

## What it is

The Resolver is a read-only side panel attached to the DB viewer that lets users
select an item from `ITEM_CATALOGO` and inspect its fully-resolved definition —
including inherited category profile, applied pricing rules, and computed defaults.

It answers the question: *"Given this item as stored in the DB, what would the
pricing engine actually compute?"*

## Goals

- Select any row from `ITEM_CATALOGO` via a dropdown (or row click) in the DB viewer
- Display the output of `resolveItemDefinition(itemId)` in a structured panel
- Show inheritance chain: item fields → category profile → global defaults
- Show which rules apply to this item (RESTRICCION_UI scope)
- No write operations — read-only diagnostic view

## Out of scope (for III-1)

- Editing resolved values (that's the normal DB edit flow in I-1)
- Live recalculation with user-supplied pax/cantidad (that's the Item playground, I-2)

## Machine additions (extends I-1)

Two new context fields on the existing browsing state:

```
resolverItemId   string | null   — item currently selected in resolver dropdown
resolvedItem     object | null   — output of resolveItemDefinition(resolverItemId)
```

One new transition:

| From | Event | Guard | To |
|------|-------|-------|----|
| browsing | SELECT_RESOLVER_ITEM | — | browsing (updates resolverItem context) |

Alpine connection:

```
Resolver dropdown  → actor.send({ type: 'SELECT_RESOLVER_ITEM', itemId })
Panel visible      ← resolvedItem !== null
```
