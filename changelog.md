# Changelog

## [Unreleased]

### 2026-02-21 (step-01 minimal reset)
- reset worktree to minimal files only for Step 01.
- added standalone sandbox server (`tools/serve-sandbox.mjs`).
- added first component package `packages/components/counter-basic/` with:
  - xstate machine
  - alpine component logic
  - html template
  - test placeholder

### 2026-02-21 (step-02 composed counters)
- added `packages/components/counter-composed/` module with one global counter actor and two child counter actors (reusing step-01 counter machine), showing `global + local` per child.
- added sandbox route `apps/sandbox/routes/step-02-counter-composed/index.html` and updated index navigation.
- updated sandbox server route resolution for `/step-02-counter-composed`.

### 2026-02-21 (step-03 item standalone)
- added `packages/components/item/` with standalone item machine + ui + logic, simulating external context (`paxGlobal`, `duracionMin`, `dia`, `hora`) and item definition (`name`, `category`, `description`, `rules`, `pricing profile`, default quantity policies).
- item mode toggle (`catalog`/`basket`) now shows human pricing profile text (e.g. `$400 fijo + $20 por persona`) and computed totals from resolved quantities.
- added sandbox route `apps/sandbox/routes/step-03-item/index.html`, index navigation entry, and server route support.
