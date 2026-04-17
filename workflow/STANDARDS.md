# Coding & Process Standards

---

## 1. Function Size

**Hard limit: 10 lines.** A function exceeding 10 lines has more than one purpose. Split it.

- Each helper does exactly one thing
- Name it after that one thing
- If a function needs >3 local variables, it's likely a class in disguise

---

## 2. Class Size

**Hard limit: 80 lines per class.** A class exceeding 80 lines owns more than one concept. Split it.

- Prefer **primitive classes + inheritance** over monoliths
- Extract primitive behavior first, then subclass for specialization
- One class per file when class >10 lines

---

## 3. Self-Documenting Code

- Code is primary documentation
- Names must make intent obvious without comments
- Comments only where *why* cannot be expressed in code
- Module-level docstrings state the single responsibility

---

## 4. Layer Separation

Every module is self-contained. **No file does two things.**

- **Dependency Inversion**: Domain layers never import from infrastructure layers
- **Infrastructure injection**: Via constructor
- **Operational limits**: Expose as named constants at module top

---

## 5. Non-Implemented Work

**No stubs, mocks, or scaffolding outside of `tests/`.**

- If something is not implemented, it must not exist in `src/`
- Unimplemented work → task file in `desk/tasks/`
- Valid exception: `NotImplementedError` in abstract methods

---

## 6. Error Contracts

- Define domain-specific exceptions at top of file
- **Never use bare `Exception` for flow control**
- Never swallow errors silently: catch, log, re-raise with `from e`

---

## 7. Test Structure Mirror

Tests mirror `src/` directly under `tests/`:

```
tests/
├── module_a/
│   └── subpackage/    # mirrors src/module_a/subpackage/
└── module_b/
```

---

## 8. Ephemeral Planning

`desk/` is a scratchpad, not a history.

- Active plans live here
- Delete once feature is built, tested, documented

---

## 9. Git Hygiene

- **Never edit files while git tree is dirty**
- Do not ask permission to commit if workflow dictates it
- Executors must create resolving commit for their assigned task

---

## 10. Architectural Invariants (Laws of Physics)

Define project-specific laws. Examples:

1. **No Blocking I/O**: All domain I/O must be `async/await`
2. **One Resource Per Mission**: No multiple allocations in loops
3. **DOM Hostility**: JS overlays only, never mutate live tree
4. **Finite Routing**: All loops have circuit breakers
