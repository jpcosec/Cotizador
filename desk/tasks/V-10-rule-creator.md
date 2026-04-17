---
id: V-10
name: Rule Creator UI
domain: database
status: open
priority: p3
depends_on: [V-09]
pills:
  - pill-rule-creator-ui
commit_messages:
  - feat: implement Rule Creator UI
  - test: verify custom rule creation in user_flow
---

# V-10: Rule Creator UI

## Goal
Advanced form for creating complex business rules.

## What This Produces
| Artifact | Location |
|----------|----------|
| UI Component | `apps/sandbox/routes/rule-creator.html` |
| E2E Step | `user_flow.json` |

## Phase 01: Form Design
- [ ] Implement a complex form for business rule creation.

## Phase 02: Persistence
- [ ] Bind to the rules database service.

## Phase 03: Validation
- [ ] Add `create_custom_rule` step to `user_flow.json`.
- [ ] Run `userFlowRunner.mjs`.
