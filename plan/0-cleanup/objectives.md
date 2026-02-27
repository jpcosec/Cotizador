# 0-cleanup — Objectives

## Goal

Remove all thin wrapper files from `apps/quotation/` and relocate the premature quotation flow out of `packages/` so that the `packages/` directory contains only individually verified components.

## Why this step exists

During steps 4/5 the full quotation flow was assembled before its constituent components were individually built and verified. This left `packages/components/quotation/` as app-level assembly code living in the component library, and `apps/quotation/` as a layer of thin JS wrappers delegating to it. Both situations create confusion about what is canonical.

---

## Completion Criteria

- [ ] `apps/quotation/state/AppStateMachine.js` deleted
- [ ] `apps/quotation/components/HomePage.js` deleted
- [ ] `apps/quotation/components/ClientSelector.js` deleted
- [ ] `apps/quotation/state/appStateMachine.test.js` imports directly from `packages/`
- [ ] `apps/quotation/components/home.test.js` imports directly from `packages/`
- [ ] `apps/quotation/components/clientSelector.test.js` imports directly from `packages/` (and its `getAllClients` test removed)
- [ ] `apps/quotation/components/ClientSelector.html` moved to `packages/components/quotation/modals/ClientSelector.html`
- [ ] `packages/components/quotation/` moved to `apps/quotation/pkg/`
- [ ] No file in the codebase imports from the old `packages/components/quotation/` path

---

## Testing Criteria

**After each sub-step, run:**
```bash
npm test
```
All tests must pass before proceeding to the next sub-step.

**Final verification:**
```bash
# No broken imports to old paths
grep -r "packages/components/quotation" . --include="*.js" --include="*.html" | grep -v "node_modules"
# Expected: no results
```
