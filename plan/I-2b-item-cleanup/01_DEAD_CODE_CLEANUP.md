# Step 1: Dead Code Cleanup

## Intro

The item package contains files from an older `ItemComponent` architecture that was superseded by the current `Item.js` + `itemMachine.js` + `createItemStandaloneComponent.js` pipeline. These dead files add confusion about what's active.

## Agent Instruction

Delete 3 dead code files and 3 orphaned documentation files. Verify nothing breaks.

## Objective

Remove dead code so the item package only contains actively-used files. No functionality changes.

## Files to DELETE

### Dead code (verified: nothing imports these)
1. `packages/components/item/ItemComponent.js` — Old Alpine wrapper with `static create()`. Superseded by `createItemStandaloneComponent.js`.
2. `packages/components/item/ItemComponent.html` — Old 3-column layout. Superseded by `ui/ItemStandalone.html`.
3. `packages/components/item/ui/RulesEditor.html` — Standalone rules editor. Nothing loads it (rule inspector is inline in ItemStandalone.html).

### Orphaned documentation (they document the deleted ItemComponent)
4. `packages/components/item/ITEMCOMPONENT_README.md`
5. `packages/components/item/ITEMCOMPONENT_DESIGN.md`
6. `packages/components/item/ITEMCOMPONENT_QUICK_START.md`

## DO NOT DELETE

- `domain/rulesEngine/humanize.js` — Imported by `coordinator.js` line 12. This is ACTIVE code.

## Pre-check

Before deleting, verify no imports exist:
```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
grep -r "ItemComponent" packages/components/item/ --include="*.js" -l
grep -r "RulesEditor" packages/components/item/ --include="*.js" -l
```

Expected: Only the files themselves (self-references) and maybe README mentions.

## Verification

```bash
cd /home/jp/CotizadorLodge/claps_codelab_rebuild_components
npm test
```

Expected: Same baseline — 518 pass / 3 fail (the 3 `lineRateLabel` formatting failures are pre-existing).
