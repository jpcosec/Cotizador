# Components

Each component keeps reusable code only:

- `machine/`
- `ui/`
- `domain/` (when needed)
- `tests/`

Playground mounting/context wiring lives in `apps/sandbox/playground/**`.

Current component packages:

- `item` (item domain + machine + UI)
- `category` (category machine + UI)
- `quotation` (reusable views/modals)
- `common` (shared base + mixins)
