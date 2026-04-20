# Proposed Structure v0.1 (saved for reference)

```
dev/
│
├── src/                          # SOURCE: All business logic
│   ├── components/               # Component classes + machines
│   ├── database/                # Schema + models
│   ├── pricing/                 # Pure pricing functions
│   ├── xstate/                 # Shared machine patterns
│   ├── gas_app/                # XState runtime + app-specific + services
│   └── build/                  # Build scripts (generate_*.mjs)
│
├── component_playground/           # COMPONENT TESTING (Phase 3)
│   ├── sandbox/                 # Dev playgrounds
│   └── demo/                   # item-multi.html
│
└── gas/                        # GAS DEPLOYMENT
    ├── dist/                   # Bundled output (clasp push)
    └── playground/             # Integration test before deploy
```

## This proposal was rejected - need v0.2