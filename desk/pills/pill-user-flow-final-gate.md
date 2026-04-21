---
id: pill-user-flow-final-gate
type: guardrail
scope: global
language: en
nature: context
status: active
depends_on: []
---

## What
`user_flow.json` is the final UI validation gate once the rebuilt quotation flow is wired.

## Why
Unit tests and playground checks prove contracts, but the rebuild is not done until the end-to-end quotation lifecycle passes through the real GAS preview surface.

## Where
- `user_flow.json`
- `tools/userFlowRunner.mjs`
- `desk/tasks/RD-05-final-validation.md`

## How
The final execution step for this redesign is: rebuild artifacts, run `npm test`, then run the full `user_flow.json` flow through `tools/userFlowRunner.mjs`.
