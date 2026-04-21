# User Flow Runner

## Purpose

`user_flow.json` defines the full local end-to-end lifecycle used as the final validation gate for the quotation app.

The runner lives in:

- `tools/userFlowRunner.mjs`

The flow definition lives in:

- `user_flow.json`

## What It Validates

The current flow validates the local GAS preview from:

- app load
- client selection
- workspace readiness
- catalog interaction
- basket sync
- validation stage
- export action
- save action
- completed state
- pack editor route reachability

## How To Run It

Start the local GAS preview first:

```bash
npm run build
npm run serve:local
```

Then run:

```bash
node tools/userFlowRunner.mjs
```

Optional Mermaid export:

```bash
node tools/userFlowRunner.mjs --mermaid
```

The default behavior is to run the flow unless only Mermaid output is requested.

## Flow File Structure

`user_flow.json` has this shape:

```json
{
  "name": "Flow name",
  "baseUrl": "http://localhost:8082",
  "steps": [
    {
      "id": "01_open_app",
      "action": "goto",
      "url": "/",
      "description": "Open the app"
    }
  ]
}
```

## Supported Actions

Current supported step actions are:

- `goto`
- `click`
- `fill`
- `wait`
- `wait_hidden`
- `wait_fixed`

### `goto`

Fields:

- `url`

Example:

```json
{ "action": "goto", "url": "/" }
```

### `click`

Fields:

- `selector`

Example:

```json
{ "action": "click", "selector": "button:has-text('Select Client')" }
```

### `fill`

Fields:

- `selector`
- `value`

### `wait`

Fields:

- `selector`

Waits for the selector to become visible.

### `wait_hidden`

Fields:

- `selector`

Waits for the selector to become hidden.

### `wait_fixed`

Fields:

- `value`

Waits a fixed number of milliseconds.

## Current Flow

The current `user_flow.json` uses:

- `baseUrl`: `http://localhost:8082`
- a deterministic single-path quotation lifecycle

It is meant to validate the local GAS preview, not sandbox routes generally.

## Output Artifacts

The runner writes everything into:

- `auto_user_test/`

Main outputs:

- `runner.log` - chronological execution log
- `report.json` - structured success/failure result
- `*.png` - screenshot per step
- `*.html` - DOM capture per step
- `flow.mmd` - Mermaid graph when requested

## How The Runner Works

`tools/userFlowRunner.mjs`:

- reads `user_flow.json`
- launches Playwright Chromium
- executes each step sequentially
- logs browser console and page errors
- captures screenshots and HTML after each step
- records a structured report at the end

It also reads Alpine shell state from `.quotation-shell` when available and logs:

- current stage
- whether client modal is open

That makes it useful both as a validation tool and as a debugging tool.

## Editing Guidelines

When updating `user_flow.json`:

- keep selectors stable and intentional
- prefer visible business milestones over low-level DOM trivia
- only add waits that are truly needed
- prefer `wait` over `wait_fixed` when a stable selector exists
- keep the flow focused on real user value, not implementation details

## When To Update The Flow

Update `user_flow.json` when:

- a major business flow changes
- the shell changes enough that selectors or stages move
- a new final validation step is required

Do not change it casually for cosmetic refactors unless the tested business flow actually changed.

## Completion Rule

The redesign and GAS-facing quotation flow are not considered complete unless this runner passes against the local GAS preview.

## Related Docs

- `docs/DEPLOYMENT/Gas_workflow.md`
- `docs/DEPLOYMENT/deploy-checklist.md`
- `user_flow.json`
