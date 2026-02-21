# xstate (rebuild)

Interaction adapters between XState event flow and domain/pricing logic.

Current classes:

- `src/interactions/XStateInteractionBase.js`
- `src/interactions/ItemXStateInteraction.js`

Pattern:

- Interaction classes contain event-to-context transitions.
- Business logic remains in pricing/domain logic classes (for item: `packages/pricing/src/ItemLogic.js`).
