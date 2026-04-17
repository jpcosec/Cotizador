# Workflow Initialization Template

This document provides a generic guide to bootstrap the Supervisor/Executor workflow in any new software project.

---

## Prerequisites

Before starting, ensure:
1. A clean git state (all work committed or stashed).
2. Full read access to the project's codebase and documentation.
3. A high-level understanding of the project's purpose and architecture.

## Step 1: Discover Project Context

1. Explore the project structure (e.g., `ls -R`).
2. Identify core directories:
   - **Source Code**: Where the primary logic lives (e.g., `src/`, `lib/`, `app/`).
   - **Tests**: Location of unit, integration, and e2e tests (e.g., `tests/`, `spec/`).
   - **Documentation**: Project-specific guides or architectural docs (e.g., `docs/`, `README.md`).
3. Identify existing conventions: CI/CD configs (`.github/`, `.gitlab-ci.yml`), project manifests (`package.json`, `Cargo.toml`, `requirements.txt`), and contribution guides.
4. Determine the primary programming language(s) and the preferred test runner.

## Step 2: Configure Agent Context

Create `AGENTS.md` (or project-specific instructions file) at the root:
- **Project Purpose**: 2-3 sentences explaining what the software does.
- **Tech Stack**: List primary languages, frameworks, and databases.
- **Architecture**: Briefly describe the high-level design (e.g., Layered, Hexagonal, Microservices).

Create `STANDARDS.md` at the root:
- **Coding Rules**: Define function/class size limits and naming conventions.
- **Architectural Guardrails**: Specify dependency rules (e.g., "Domain cannot depend on Infrastructure").
- **Testing Requirements**: Define where tests should live and what coverage is expected.

## Step 3: Scaffold Task Tracking

Create the `desk/` directory to manage the workflow:
```
desk/
├── tasks/
│   ├── Board.md            # The central task tracking board
│   └── 00-initial-setup.md # The first task to be executed
└── design/
    └── architecture.md     # High-level design document for the current state
```

## Step 4: Define the Initial Task

Create `desk/tasks/00-initial-setup.md`:
- **Goal**: Clear statement of the first executable objective.
- **Context**: List relevant files or components involved.
- **Checklist**: Small, atomic steps to reach the goal.
- **Validation**: Specific tests or checks to verify success.

## Step 5: Update Documentation

Integrate the workflow into the project's root `README.md`:
```markdown
## Development Workflow

- **Agent Guidance**: `AGENTS.md` — Primary instructions for AI agents.
- **Project Standards**: `STANDARDS.md` — Quality and architectural rules.
- **Active Tasks**: `desk/tasks/Board.md` — Current execution status.
```

## Step 6: Link Agent Environments

Ensure your AI assistant (e.g., Gemini CLI, Claude) is configured to prioritize `AGENTS.md` and the `desk/` directory as its primary source of truth for task state and project rules.

## Step 7: Baseline Commit

Commit the workflow scaffold:
```bash
git add AGENTS.md STANDARDS.md desk/
git commit -m "chore: initialize Supervisor/Executor workflow scaffold"
```

## Verification

Verify the setup:
1. Run the project's test suite to ensure a clean baseline.
2. Confirm the `Board.md` is readable and the initial task is correctly defined.
