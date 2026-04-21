---
id: RD-05
name: Final Validation Gate
domain: qa
status: open
priority: p0
depends_on:
  - RD-04
pills:
  - pill-user-flow-final-gate
commit_messages:
  - test(runtime): validate rebuilt quotation flow end to end
---

# RD-05: Final Validation Gate

## Goal
Finish the redesign only after the rebuilt quotation flow passes the full end-to-end lifecycle.

## Outputs
| Artifact | Location |
|----------|----------|
| Full user flow definition | `user_flow.json` |
| Runner | `tools/userFlowRunner.mjs` |
| Evidence artifacts | `auto_user_test/` |

## Final Step
- Rebuild the app artifacts.
- Run `npm test`.
- Run the full `user_flow.json` suite with `tools/userFlowRunner.mjs`.

## Done When
- Full lifecycle passes from open app through save/export and pack editor step.
- No manual-only validation remains as the completion gate.

## Testing
```bash
npm test
node tools/userFlowRunner.mjs
```
