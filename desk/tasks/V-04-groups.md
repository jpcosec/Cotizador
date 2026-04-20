---
id: V-04
name: Groups / Packs Logic
domain: quotation
status: open
priority: p1
depends_on: []
pills:
  - pill-kits-logic
commit_messages:
  - feat: implement kit/group support in basket state
  - feat: implement kit UI in basket
  - test: verify kit behavior in user_flow
---

# V-04: Groups / Packs Logic

## Goal
Support "kits" or grouped items that move and are priced together.

## What This Produces
| Artifact | Location |
|----------|----------|
| State update | `src/state/createQuotationInternalRuntime.js` |
| UI Component | `src/components/item/ui/playgroundItemSections.js` |
| E2E Step | `user_flow.json` |

## Phase 01: State Support
- [ ] Add `groupId` or `kitId` support to basket items.
- [ ] Implement group-based actions (move together, remove together).

## Phase 02: UI Implementation
- [ ] Render grouped items as a single unit or with clear visual grouping in the basket.
- [ ] Implement kit-specific UI controls.

## Phase 03: Validation
- [ ] Add `add_pack_to_basket` step to `user_flow.json`.
- [ ] Run `userFlowRunner.mjs`.
