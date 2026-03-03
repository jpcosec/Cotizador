# Item Playground Implementation Plan

Date: 2026-03-03
Scope: `apps/sandbox/routes/step-03b` and `packages/components/item/*`

## Step 1 — Orchestrator Boundary

### Context (what)

Current `step-03b` behavior is not a real factory->catalog->basket orchestration. We need a parent coordinator that owns shared context and actor registries.

### Objective and how

Build a single orchestrator component that is the only place that:

- keeps global context,
- stores factory definitions,
- creates/destroys catalog actors,
- creates/destroys basket actors,
- broadcasts context updates to all actors.

### Detailed instructions

1. Replace `createItemMultiComponent.js` with a parent Alpine component that owns:
   - `factoryEntries[]`
   - `catalogEntries[]`
   - `basketEntries[]`
   - `globalContext`
2. Add actor lifecycle helpers:
   - `createEntry(column, resolvedDef, seedMode)`
   - `destroyEntry(column, entryId)`
   - `broadcastContext()`
3. Ensure each entry has its own actor, own subscription, and clean shutdown.

### How to test if ready

- Add/remove entries repeatedly without console errors.
- No stale updates after removal.
- No recursion or call-stack errors.

### Documentation/changelog updates

- Update `packages/components/item/README.md` architecture section.
- Add a changelog entry describing orchestrator adoption.

---

## Step 2 — Factory Model (DB + Custom Resolver)

### Context (what)

Playground requires an item factory that can:

- queue DB items,
- queue custom resolver-generated items,
- ship items to runtime columns.

### Objective and how

Create a unified factory entry contract that stores `resolvedDef` regardless of source.

### Detailed instructions

1. Load DB seeds via `loadSeedFromCsvUrl`.
2. Resolve DB items via `resolveItemDefinition(itemId, db)`.
3. Add a modal resolver form that creates a valid `ResolvedItemDefinition`-compatible object.
4. Insert both DB and custom items into the same `factoryEntries[]` list.

### How to test if ready

- Add DB item to factory and ship it.
- Create custom item in modal and ship it.
- Both should render valid catalog and basket cards.

### Documentation/changelog updates

- Add contract notes in `packages/components/item/STATE_CONTRACT.md` for factory-created definitions.
- Record custom resolver support in changelog.

---

## Step 3 — Shipping Creates Two Separate Entities

### Context (what)

Required behavior: shipping from factory creates two independent entities (catalog + basket), not mode-toggling one actor.

### Objective and how

On `ship`, spawn two actors from the same source definition and context snapshot:

- catalog actor (`mode: catalog`)
- basket actor (`mode: basket`)

### Detailed instructions

1. Build seed with `Item.fromDefinition(resolvedDef, { externalContext }).toSeed()`.
2. Clone seed for both actors and set mode per column.
3. Store each actor as independent entry with unique id.

### How to test if ready

- Shipping one factory entry increases both columns by one.
- Removing catalog entry does not remove basket sibling.
- Updating basket override does not affect catalog entry state.

### Documentation/changelog updates

- Add explicit note in `packages/components/item/EXPECTED_BEHAVIOR.md`:
  shipping creates independent entities.
- Record in changelog.

---

## Step 4 — Global Context Propagation with Override Semantics

### Context (what)

Global context must affect both columns, but basket overrides must lock line quantity until reset.

### Objective and how

Use only `SET_CONTEXT` machine event for context updates and keep quantity precedence untouched.

### Detailed instructions

1. Add context controls (`paxGlobal`, `hora`, `duracionMin`, `dia`) in dedicated column.
2. On any change, call `broadcastContext()` to all actors.
3. Keep basket controls using `SET_OVERRIDE`, `CLEAR_OVERRIDE`, `RESET_OVERRIDES`.

### How to test if ready

- Non-overridden basket lines change when `paxGlobal`/duration change.
- Overridden basket lines keep manual value.
- After reset override, line reacts to context again.

### Documentation/changelog updates

- Update `LOGIC.md` and `EXPECTED_BEHAVIOR.md` with explicit propagation matrix.
- Record in changelog.

---

## Step 5 — Rule Indicators in Both Columns

### Context (what)

User needs the same rule-affected signal in catalog and basket.

### Objective and how

Render indicators from each actor snapshot (`available`, `ruleErrors`, `ruleWarnings`, `appliedRules`).

### Detailed instructions

1. Add a shared status chip component pattern per card.
2. Show status color and counters:
   - blocked/error
   - warning
   - ok
3. Include tooltip/popover with applied rule messages.

### How to test if ready

- Trigger warning rules and verify both columns show warning.
- Trigger error rules and verify both columns show blocked state.
- Rule counts/messages match actor snapshot.

### Documentation/changelog updates

- Add behavior notes in `RULES_EXECUTION.md` or new `RULE_INDICATORS.md`.
- Record in changelog.

---

## Step 6 — Playwright Acceptance Flows

### Context (what)

Need deterministic browser checks for target behavior.

### Objective and how

Create repeatable Playwright flows for factory, shipping, context changes, overrides, and rule indicators.

### Detailed instructions

1. Flow A: DB item -> factory -> ship -> visible in both columns.
2. Flow B: custom item via modal -> ship -> visible in both columns.
3. Flow C: global context change updates non-overridden basket line.
4. Flow D: override basket quantity then change global context -> basket line unchanged.
5. Flow E: reset override -> basket line updates again.
6. Flow F: trigger rule state and verify indicator parity in catalog and basket.

### How to test if ready

- All flows pass without console errors.
- No route crash and no Alpine call-stack errors.

### Documentation/changelog updates

- Add a short QA script to `packages/components/item/tests/README.md`.
- Record acceptance flow coverage in changelog.
