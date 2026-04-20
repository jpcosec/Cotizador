---
id: R-05
name: Refactor App Orchestrator
domain: quotation
status: open
priority: p1
depends_on: [R-01, R-02, R-03, R-04]
pills:
  - pill-modular-composition
---

## Goal
Clean the "Monster" monolithic file and turn it into a thin orchestrator of components.

## What This Produces
| Artifact | Location |
|----------|----------|
| Clean Orchestrator | `gas/scripts/createQuotationFlowComponent.js` |
| Global Theme | `src/components/common/styles/theme-quotation.css` |

## Phase 01: CSS Cleanup
- [ ] Move all `<style>` content from `gas/scripts/createQuotationFlowComponent.js` to `src/components/common/styles/theme-quotation.css`.
- [ ] Link the CSS in the main GAS index or include it as a separate template.

## Phase 02: Template Refactor
- [ ] Rewrite `gas/scripts/createQuotationFlowComponent.js` to be < 100 lines.
- [ ] Use `<?!= include('Sidebar'); ?>`, `<?!= include('Timeline'); ?>`, etc., for the `basket` stage.
- [ ] Ensure `stage` and `mainTab` state management remains clean at the top level.

## Phase 03: Build Sync
- [ ] Ensure `reset_gas_workspace.mjs` correctly handles the new 5-part composition.
- [ ] Run `npm run build` and verify E2E flow.
