# U-2 Gesture to Event Matrix

Status tags:

- `existing`: already available in rebuild.
- `to-add`: planned in U-2.
- `deferred`: intentionally postponed.

| Interaction | Source | Target | Runtime event mapping | Status |
|---|---|---|---|---|
| Ship item with click | catalog card | selected day basket | existing ship action | existing |
| Drop catalog item on day tab | catalog card | day tab | existing `SHIP_ITEM_TO_DAY` | existing |
| Edit hour manually | basket item hour input | same entry | existing `SET_ENTRY_OVERRIDE(hora)` | existing |
| Edit duration manually | basket duration input | same entry | existing `SET_ENTRY_OVERRIDE(duracionMin)` | existing |
| Drop catalog item on timeline cell | catalog card | timeline hour slot | ship + set hour override | to-add |
| Move placed entry to another hour | timeline entry block | timeline hour slot | `SET_ENTRY_OVERRIDE(hora)` | to-add |
| Resize placed entry duration | timeline resize handle | timeline block | `SET_ENTRY_OVERRIDE(duracionMin)` | to-add |
| Drop item into group/kit zone | catalog/entry | child zone | pending kit/group runtime | deferred |

References:

- Legacy baseline: `claps_codelab/Components_Timeline.html`
- Draft interactions: `plan/legacy/I-3-category/html_playground_draft.html`
- Runtime events: `packages/components/basket/machine/basketMachine.js`
