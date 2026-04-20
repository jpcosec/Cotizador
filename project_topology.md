# Project Topology

## Overview

XState + Alpine.js quotation system for event catering venue. Three runtime targets: Dev (Vite), GAS (Google Apps Script), External (IIFE bundle).

## Folder Structure

```
dev/
├── src/              # Source: all business logic
├── playground/     # Testing: component playgrounds
├── gas/            # Build + deployment pipeline
└── tools/          # CLI: dev servers, runners
```

## Layer Separation

### src/ — Source (Business Logic)

```
src/
├── components/      # UI (Item, Category, Basket, Quotation)
├── database/        # Schema + Model Factory
├── pricing/        # Pure pricing functions
├── xstate/         # Shared machine patterns
├── state/          # XState runtime (moved from apps/quotation)
└── services/      # Services (moved from apps/quotation)
```

No app-specific logic. Zero I/O. Tested independently.

### playground/ — Testing

```
playground/
├── sandbox/        # Dev playgrounds
└── demo/          # Multi-item demo
```

Component testing in isolation. Imports from src/ via ES modules.

- **Dev mode only** — imports directly from packages via ES modules
- Uses Vite dev server (`tools/serve-sandbox.mjs`)
- 43 import statements from packages/

### gas/ — Build + Deployment

```
gas/
├── scripts/             # Build scripts (generate_*.mjs)
├── output/             # Bundled output
├── Code.gs              # Generated deployment
├── Bundle_Runtime.html # Runtime inlined
└── *.html              # UI templates
```

Build pipeline + GAS deployment.

### tools/ — Dev CLI

```
tools/
├── serve-sandbox.mjs    # Dev server (port 8090)
├── serve-local.mjs       # Local persistence
└── userFlowRunner.mjs  # E2E runner
```

Dev utilities (run-time only).

## Build Pipeline

```
┌─────────────────┐
│   src/          │  ← Source (ES modules)
└────────┬────────┘
         │ Rollup (npm run build:bundle)
         ▼
┌─────────────────┐
│ gas/output/     │  ← Bundled output
└────────┬────────┘
         │ generate_gas_code.mjs (npm run build:gas)
         ▼
┌─────────────────┐
│ gas/            │  ← GAS deployment
└─────────────────┘
```

## Build Targets

| Target | Command | Output |
|--------|---------|--------|
| Dev | `npm run serve:sandbox` | Live reload |
| Bundle | `npm run build:bundle` | gas/output/ |
| GAS | `npm run build:gas` | gas/Code.gs |

## Runtime Matrix

| Location | Type | Status |
|----------|------|--------|
| `gas/output/` | Bundled | Auto-generated |
| `gas/` | GAS deployment | Current |

## CI/CD Pipeline

From component design to GAS deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DESIGN PHASE                                                │
│  packages/components/*/Item.js, machine/*Machine.js             │
│  → Write component + XState logic                               │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UNIT TEST PHASE                                             │
│  npm run test                                                  │
│  → vitest: pure functions, machines, rules engine              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. PLAYGROUND PHASE                                            │
│  npm run serve:sandbox                                         │
│  → http://localhost:8090/step-03b                              │
│  → apps/sandbox/playground/*/mount*.js                        │
│  → Test with dev data, live reload                             │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. QUOTATION APP PHASE                                         │
│  npm run serve:local                                            │
│  → http://localhost:8080                                        │
│  → apps/quotation/                                               │
│  → Full flow + persistence                                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. BUILD PHASE                                                 │
│  npm run build                                                 │
│    ├─ npm run build:bundle → bundling/generated/                 │
│    │  rollup -c rollup.config.mjs                                │
│    └─ npm run build:gas → root gas/                             │
│       generate_gas_code.mjs + generate_gas_runtime            │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. DEPLOY PHASE                                                │
│  root gas/Code.gs + *.html                                      │
│  → clasp push to Google Apps Script                             │
└─────────────────────────────────────────────────────────────────┘
```

### Commands by Phase

| Phase | Command | Target | Output |
|-------|---------|--------|--------|
| 1 | (edit) | packages/ | Source files |
| 2 | `npm run test` | vitest | Test results |
| 3 | `npm run serve:sandbox` | localhost:8090 | Browser |
| 4 | `npm run serve:local` | localhost:8080 | Browser |
| 5a | `npm run build:bundle` | bundling/generated/ | .js files |
| 5b | `npm run build:gas` | root gas/ | .gs + .html |
| 6 | `clasp push` | GAS | Deployed |

### E2E Testing

```
npm run test:e2e          # Sandboxed (playwright)
npm run test:e2e:headed  # Headed browser
npm run test:e2e:gas      # GAS config (local)
```

## Governance Rules

### Golden Sources

| Output | Source | Command |
|--------|--------|---------|
| gas/output/ | src/ | `npm run build:bundle` |
| gas/Code.gs | src/ | `npm run build:gas` |

**Rules:**
1. Never edit gas/output/ or gas/Code.gs manually
2. Always regenerate via npm scripts
3. gas/ is the only GAS deployment target

### Artifacts

| Location | Artifact | Used By |
|----------|----------|---------|
| dist/ | quotation-engine.iife.js | External embed |
| root gas/ | Code.gs | GAS deployment |
| bundling/generated/ | localInitTables.js | Dev only |

## Key Insight

- **Apps** import from **packages** at dev time
- **Bundling** outputs to **dist/** and **root gas/** for deployment
- **Tools** orchestrates the build process

No duplication — different layers for different runtime targets.