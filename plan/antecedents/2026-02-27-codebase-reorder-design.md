# Codebase Reorder Design

**Date:** 2026-02-27
**Status:** Approved
**Scope:** `claps_codelab_rebuild_components`

---

## Goal

Rebuild the SF Lodge quotation system component by component, each one standalone and testable by a human in isolation. The reference for the complete app is `claps_codelab` — the same functionality, rebuilt with each component separate, autonomous, and individually verifiable.

The problem that led here: Steps 1–3 followed the plan correctly. Steps 4/5 jumped ahead and assembled the full quotation flow before the intermediate components (Category, Catalog, Basket) were individually built and verified. The plan also never made explicit that the step-by-step sequence would culminate in a complete app.

---

## Development Strategy

- **Incremental + always-green**: each step leaves tests passing before the next begins
- **Approach**: structural cleanup first, then spec + build each component
- **No premature evaluation**: existing quotation flow code in `apps/quotation/` is not judged now — when each component's turn comes, we compare it to the spec and decide then

---

## Prerequisite: Structural Cleanup

Before any component work begins, the codebase must clearly separate **verified components** (`packages/`) from **app-level reference material** (`apps/`).

**Actions:**

1. Delete the three thin wrapper files in `apps/quotation/`:
   - `apps/quotation/state/AppStateMachine.js` (literal alias, zero logic)
   - `apps/quotation/components/HomePage.js` (thin wrapper)
   - `apps/quotation/components/ClientSelector.js` (thin wrapper)

2. Redirect their test files to import from `packages/` directly:
   - `apps/quotation/state/appStateMachine.test.js`
   - `apps/quotation/components/home.test.js`
   - `apps/quotation/components/clientSelector.test.js`

3. Promote the rich `apps/quotation/components/ClientSelector.html` into `packages/components/quotation/modals/ClientSelector.html`, replacing the 10-line stub there.

4. Move `packages/components/quotation/` → `apps/quotation/` — the entire quotation flow (modals, views, logic, AppState) is app-level assembly, not a standalone reusable component. It does not belong in `packages/` until its constituent components are individually verified.

**After cleanup:**
- `packages/` contains only individually built and verified components
- `apps/` contains sandbox routes + the reference quotation flow draft

---

## Two Macro Phases

### Phase I — Basics (data-grounded)

Goal: solid domain foundation where nothing is hardcoded or assumed. No UI composition work. Each step ends with passing tests and a human-testable playground.

```
Step 1  Database         Review real schema → verify DB adapter →
                         document what each table provides to each component

Step 2  Item (rebased)   Align item to real DB field names and shapes.
                         Verify pricing / rules / defaults / inheritance
                         against actual data, not hardcoded seeds.

Step 3  Item container   Category component: receives context from above,
                         holds items, aggregates totals, inherits and
                         propagates rules.
```

### Phase II — UI + Compositions (leaf to root)

Goal: compose verified Phase I components into the full quotation UI. Only begins once Phase I is solid.

```
Step 4  Kit              Item variant: group of items sold as a unit
Step 5  Catalog          Browsable grid of items from real DB, emits "add" events
Step 6  Day / Basket     Day → Categories → Items tree.
                         Context flows down, totals aggregate up.
Step 7  App assembly     Full quotation flow assembled from verified pieces.
                         Here we evaluate the existing apps/quotation/ reference
                         component by component against the specs.
```

---

## Artifacts Per Step

Every step produces exactly three artifacts before moving on:

```
1. Domain logic + tests          Component works correctly in code
2. Sandbox route + playground    A human can test it interactively
3. Internal/external state spec  Agreed contract, written before building
```

---

## Playground Pattern

All playgrounds follow the same three-zone layout (reference: `ItemStandalone.html`):

```
┌─────────────────────────────────────────────┐
│  External State Panel                        │
│  Manual controls simulating what a parent    │
│  container or the DB would push down         │
├─────────────────────────────────────────────┤
│  Component Display                           │
│  The component itself, live and interactive  │
├─────────────────────────────────────────────┤
│  Debug / Inspection Panels                   │
│  Internal state, calculations, rule results, │
│  aggregated totals                           │
└─────────────────────────────────────────────┘
```

---

## State Contract (Per Component)

Before building each component, we agree on:

| Question | What it defines |
|---|---|
| What is the **external state**? | What flows in from outside (DB data, parent context, configuration) |
| What is the **internal state**? | What the component owns and manages itself |

The database step is first because it defines the actual shape of external state for every subsequent component — eliminating all hardcoded assumptions from the codebase.

---

## Why Database First

The current Item component was built with assumptions about field names, data shapes, and rule structures that may not match the real schema in `Config_Schema.js`. Every component built after it inherited those assumptions. Starting with a verified database adapter and documented field-level contracts ensures all subsequent components are built on reality, not seeds.
