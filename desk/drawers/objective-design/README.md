# Objective Design Assets

This folder contains architecture exploration artifacts for the quotation system.

## Bi-hierarchical matrices

These files express the architecture as a **component x view-stage matrix**:

- `component-view-stage-matrix.yaml` - current-state canonical source
- `component-view-stage-matrix.html` - rendered current-state matrix
- `component-view-stage-matrix-desired.yaml` - desired-state canonical source
- `component-view-stage-matrix-desired.html` - rendered desired-state matrix
- `component-view-stage-matrix-final-product.yaml` - future product map constrained by regrouping current elements
- `component-view-stage-matrix-final-product.html` - rendered final-product matrix
- `render_component_view_stage_matrix.py` - renderer from YAML to HTML
- `view-component.md` - proposal for a reusable `View` composition component
- `view-component-schema.yaml` - canonical schema for the reusable `View` meta-component
- `view-component-example.yaml` - example instance of `View` for `Editor Cotizacion`
- `view-runtime-contract.md` - original intended runtime chain: Persistence/Export -> View -> Container -> Item
- `runtime-interfaces.yaml` - code-facing contracts for `View`, `Container`, and `Item`
- `signal-vocabulary.md` - standard signal names and meanings across the hierarchy
- `store-contract.md` - bounded-store behavior and query contract
- `aggregation-rules.md` - local pricing and upward aggregation rules
- `current-code-contract-audit.md` - audit of current code against the new runtime contracts
- `gas-platform-constraints.md` - architectural constraints imposed by Google Apps Script deployment
- `clear-redesign.md` - consolidated target architecture and GAS-compatible code shape
- `redesign-migration-backlog.md` - suggested migration order from current code to the redesign
- `final-product-regrouping-notes.md` - assumptions and limits of the regrouping-based final product map

Model:

- rows = component hierarchy
- columns = view hierarchy and ordered stages
- filled cells = participation of a component in a stage
- consecutive filled cells = continuity across stage progression

This is the preferred representation when the question is:

> Which conceptual units participate in which app-view stages?

instead of:

- who calls whom
- what classes exist
- what the raw runtime sequence is
