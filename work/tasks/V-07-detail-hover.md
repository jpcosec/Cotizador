---
id: V-07
name: Detail Hover
domain: quality
status: open
priority: p2
depends_on: []
pills:
  - pill-rules-hover
commit_messages:
  - feat: implement hover details in validator
  - test: verify hover in user_flow
---

# V-07: Detail Hover

## Goal
Show catalog details/rules on hover in the validator table.

## What This Produces
| Artifact | Location |
|----------|----------|
| UI Component | `packages/components/item/ui/playgroundItemSections.js` |
| E2E Step | `user_flow.json` |

## Phase 01: Tooltip/Hover UI
- [ ] Implement a tooltip or detail-box component for catalog rules.

## Phase 02: Data Wiring
- [ ] Bind hover events to catalog rule data.

## Phase 03: Validation
- [ ] Add `hover_verify_rules` step to `user_flow.json`.
- [ ] Run `userFlowRunner.mjs`.
