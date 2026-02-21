# Rebuild Components Worktree

This worktree starts from scratch for component-by-component reconstruction.

Current step:

- Step 01: standalone `counter-basic` (XState + Alpine)
- Step 02: composed counters (`global + local`)
- Step 03: standalone `item` (external context simulation, no DB)

Run:

```bash
npm run serve:sandbox
```

Then open:

- `http://localhost:8090/`
- `http://localhost:8090/step-01-counter`
- `http://localhost:8090/step-02-counter-composed`
- `http://localhost:8090/step-03-item`
