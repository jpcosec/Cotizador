# Step 3.3 - Rules Engine Implementation

**Status:** Planning Phase
**Date Created:** 2026-02-23
**Objective:** Make rules engine testable at Item level

## Quick Links

1. [FOCUSED_SCOPE.md](./FOCUSED_SCOPE.md) ← **START HERE** - What we're building
2. [DEEP_DIVE.md](./DEEP_DIVE.md) - Technical analysis of legacy system
3. [REVISED_ARCHITECTURE.md](./REVISED_ARCHITECTURE.md) - New approach explained
4. [DECISIONS_AND_ANSWERS.md](./DECISIONS_AND_ANSWERS.md) - Responses to design questions

## One-Liner

Create **RulesCoordinator** class that filters rules by component type, evaluates once at Item construction, and caches results.

## Implementation Phases

### Phase 3.3 (This Step) - Item-Level Rules
- ✅ Create RulesCoordinator class
- ✅ Integrate with Item.js
- ✅ Test thoroughly
- ✅ 363 existing tests pass

### Phase 3.4 (Next) - Inheritance
- Inheritance mechanism (abstract)
- Rules passed down component tree
- No re-evaluation at child level

### Phase 3.5+ (Later)
- Database integration
- Multiple component types
- Complex action types
- Rule updates/invalidation

## What Makes This Different

**Old approach (rejected):**
- 5-stage pipeline (CANTIDAD_DEFAULT, AJUSTE_LINEA, AJUSTE_GLOBAL, RESTRICCION_UI, IMPUESTO)
- Rules evaluated on every property change
- All rules checked for all items every time

**New approach (this step):**
- Component-scoped evaluation (ITEM, CATEGORY, KIT, CONTAINER, BASKET)
- Rules evaluated ONCE at construction <!-- The rules should be evaluated at constructions but also at update.-->
- Results cached, inherited to children
- Efficient! No re-evaluation on pax/quantity changes

## Files to Read (In Order)

1. **FOCUSED_SCOPE.md** (5 min) - Exactly what we're building
2. **DECISIONS_AND_ANSWERS.md** (10 min) - Why this approach
3. **DEEP_DIVE.md** (20 min) - Legacy system analysis for reference

## Key Decision

✅ **Use json-logic-js** (already in project, +8KB gzipped)
- Flexible conditions without hardcoding rules
- Non-developers can add rules via CSV
- Worth the bundle size

✅ **Keep it simple for 3.3**
- Only 2 action types: ERROR, WARNING
- Only ITEM component type
- No inheritance yet

## Success Criteria

- [ ] RulesCoordinator class exists
- [ ] Filters rules by componentType
- [ ] Evaluates once, caches result
- [ ] Item integration complete
- [ ] 15-20 new tests pass
- [ ] 363 existing tests still pass
- [ ] Code is testable in isolation

## Implementation Estimate

- Phase 3.3a: RulesCoordinator infrastructure (1 hour)
- Phase 3.3b: Item integration (45 min)
- Phase 3.3c: Tests (45 min)
- **Total: 2.5 hours**

---

Next: Read FOCUSED_SCOPE.md to see the exact implementation plan.
