# When To Use Which Diagram

## Fast Guide

| Question | Best Diagram | Why |
|----------|--------------|-----|
| Who can do what in the system? | Use Case | Actor-to-capability mapping |
| What concepts/classes exist and relate? | Class | Structure and responsibilities |
| What concrete instances exist right now? | Object | Snapshot of runtime objects |
| What messages happen over time? | Sequence | Time-ordered interactions |
| Who talks to whom, without time focus? | Communication | Collaboration topology |
| What path does a process follow? | Activity | Workflow / branching |
| What lifecycle states exist? | State | State transitions and guards |
| What modules/services depend on each other? | Component | System architecture |
| How is the codebase grouped? | Package | Folder/module boundaries |
| Where does software run? | Deployment | Nodes/environments/infrastructure |
| How do values change over time? | Timing | Temporal evolution |
| What entities and data relations exist? | ERD | Data model |
| How do ideas break down hierarchically? | Mindmap | Concept decomposition |
| How is work scheduled across time? | Gantt | Planning and sequencing |

## Practical Rules For This Repo

- Use `state` when talking about quotation outer-layer stages like `browse -> client -> basket -> validation -> completed`.
- Use `component` when talking about self-contained units and service boundaries.
- Use `sequence` when explaining Alpine -> XState -> Pricing/Store interactions.
- Use `activity` when explaining user journey or operational workflow.
- Use `ERD` when discussing quotation persistence tables and catalog data.
- Use `mindmap` when exploring architecture ideas before committing to structure.
- Use `gantt` only for planning, never as truth of implementation status.
