# T-002 - Home View Beautification Plan

## Status

- status: open
- priority: medium
- domain: quotation/ui

## Objective

Upgrade the quotation home view from a utilitarian button panel into a more intentional landing screen while preserving the current GAS flow, actions, and mobile usability.

## Current State

The active home screen is the `browse/client` stage block in `gas/Quotation_App.html`.

Current traits:

- one centered `.panel.home-panel`
- plain title and helper text
- flat action button row
- manual load row underneath
- selected client and error text as loose lines

Current styling is minimal and mostly driven by these selectors in `src/components/quotation/ui/theme.css`:

- `.home-panel`
- `.home-actions`
- `.load-actions`

## Problem Statement

The current home is functional but visually weak.

- weak hierarchy between primary and secondary actions
- no real sense of entry point or product identity
- no visual grouping for create/load/admin actions
- selected client and load state feel appended rather than designed
- layout reads like a tool strip instead of a landing screen

## Design Direction

Keep the current green Lodge-adjacent palette, but make the screen feel more deliberate.

Target feel:

- calm editorial landing panel
- stronger hero/header
- clearer action hierarchy
- soft depth and background atmosphere
- explicit sections for start, resume, and admin
- good mobile stacking

## Proposed Structure

```text
Home stage
  -> hero header
  -> primary action cards
  -> resume/load strip
  -> contextual status area
```

### 1. Hero Header

Replace the plain heading block with:

- branded title
- short supporting copy
- small contextual badges or summary chips

Possible content:

- product name
- runtime mode/capabilities indicators
- selected client summary when present

### 2. Primary Actions As Cards

Replace the flat action row with distinct action cards or large buttons:

- `Start Quotation` -> primary, most visually prominent
- `Select Client` -> secondary but still first-class
- `Buscar cotizacion` -> secondary/resume action
- `Edit Database` -> tertiary/admin utility

Goal:

- the user can read the surface as create / resume / maintain

### 3. Resume / Manual Load Section

Turn the manual quotation ID row into a compact dedicated section:

- label it clearly as resume/load existing quotation
- integrate loading state and field/button as one unit
- visually separate it from the main create actions

### 4. Context / Feedback Strip

Place dynamic context in a designed block:

- selected client
- persistence error
- maybe helper hint about next action

This avoids loose text floating below the actions.

## Visual Moves

### Layout

- widen the home panel slightly
- introduce internal sections with spacing rhythm
- use a layered background or soft gradient in the home region
- use responsive grid for action cards

### Typography

- make title larger and more expressive
- keep the existing font stack unless a broader design pass changes it globally
- use compact uppercase eyebrow labels where helpful

### Surfaces

- give the hero or action area subtle contrast from the panel body
- use cards with stronger radius, border, and hover state
- preserve current green palette instead of inventing a new theme

### Motion

- optional: subtle load-in reveal or hover transitions only
- avoid adding fragile JS-only animation dependencies

## Implementation Scope

### In Scope

- update `gas/Quotation_App.html` home-stage markup
- update `src/components/quotation/ui/theme.css` home-stage styles
- preserve all existing actions and wiring
- ensure the screen works on desktop and mobile

### Out Of Scope

- changing quotation runtime behavior
- changing stage transitions
- changing modal logic
- redesigning basket/validation stages
- rewriting the home into a new runtime component architecture

## Suggested Markup Changes

Files:

- `gas/Quotation_App.html`
- `src/components/quotation/ui/theme.css`

Suggested additions:

- hero container
- action grid
- action card/button variants
- dedicated resume block
- status/context block

Suggested preservation rules:

- keep existing Alpine handlers intact:
  - `startQuotation()`
  - `openClientModal()`
  - `openQuotationSearchModal()`
  - `openDatabaseEditor()`
  - `loadQuotationById()`

## Acceptance Criteria

- the home view feels like a designed landing screen, not a utility panel
- primary and secondary actions are visually distinct
- manual load has a clearer dedicated treatment
- selected client and error states are integrated into the layout
- no behavior regression in the browse/client stage
- mobile layout remains usable
- `npm run build` succeeds
- local GAS preview still renders the home view correctly

## Recommended First Pass

1. redesign the home markup structure in `gas/Quotation_App.html`
2. add scoped home styles in `src/components/quotation/ui/theme.css`
3. rebuild with `npm run build`
4. verify locally at `http://localhost:8082`

## References

- `gas/Quotation_App.html`
- `src/components/quotation/ui/theme.css`
- `gas/scripts/createQuotationFlowComponent.js`
- `desk/tasks/T-001-generic-viewbase-ui-migration.md`
