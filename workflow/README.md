# Agent Workflow

Portable Supervisor/Executor workflow for consistent software development.

## Quick Start

1. **Read this first**: `AGENTS.md`
2. **Then read**: `STANDARDS.md`
3. **Track work**: `desk/tasks/Board.md`

## Structure

```
workflow/
├── AGENTS.md              # Role protocols (Supervisor / Executor)
├── STANDARDS.md           # Coding and process standards
├── init_instructions.md   # How to unpack this workflow to a new project
├── instructions/          # Detailed role instructions
│   ├── supervisor-instructions.md
│   ├── executor-instructions.md
│   └── context_compiler-instructions.md
└── desk/
    ├── tasks/             # Task files + Board.md
    └── design/            # Architecture and design docs
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Supervisor** | Orchestrates atomization, audits pills, verifies commits |
| **Executor** | Solves one task, one commit |
| **Pill** | An atomic task file in `desk/tasks/` |
| **Atomization** | Breaking work into smallest possible child tasks |
| **Traceability** | Task → Index → Commit (one-to-one) |

## Commands

```bash
# Run tests
python -m pytest tests/ --asyncio-mode=auto -v

# Check function/class sizes
cloc --include-lang=Python src/ | grep -E "code|function|class"
```

## Adding This Workflow to a New Project

See `init_instructions.md` for the full bootstrap guide.

## Agent Config Symlinks

After setup, symlink agent configs to `AGENTS.md`:

| Agent | Symlink Path |
|-------|--------------|
| Claude | `~/.claude/projects/{name}/claude.md` |
| Gemini | `.gemini/agents/{name}.md` |
| OpenAI | `.openai/agents/{name}.md` |
