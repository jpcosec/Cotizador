# U-2 Editor Basic Drag & Drop — Agent Guideline

## Context

You are adding timeline drag interactions to the existing quotation editor. The runtime already supports all the events you need (`SHIP_ITEM_TO_DAY`, `SET_ENTRY_OVERRIDE`). Your job is purely UI — mapping mouse/touch gestures to those events, and rendering a time grid that makes the basket entries spatially meaningful.

Prerequisites: The quotation flow must be functional (basket, catalog, day tabs). This is already the case.

Reference: `plan/legacy/I-3-category/html_playground_draft.html` — contains a complete draft of the timeline grid with all gesture handlers. Extract and adapt from there.

Run `npm test` after every step. Do not proceed if tests fail.

---

## Step 1 — Extract gesture-to-event mapping matrix

File: `plan/U-2-editor/gesture_event_matrix.md`

Read `plan/legacy/I-3-category/html_playground_draft.html` and extract every drag/drop/resize interaction.

Document as a strict matrix:

| Gesture | Source element | Target element | Runtime event | Payload mapping |
|---|---|---|---|---|
| Drag start (catalog) | `.drag-card` | — | (sets transfer data) | `itemId` |
| Drop on grid cell | — | `.tl-cell[data-hour]` | `SHIP_ITEM_TO_DAY` + `SET_ENTRY_OVERRIDE` | `{ itemId, dayIndex, hora: cellHour }` |
| Drag existing entry | `.tl-placed-block` | `.tl-cell[data-hour]` | `SET_ENTRY_OVERRIDE` | `{ entryId, key: 'hora', value: newHour }` |
| Resize bottom edge | `.tl-resize-handle` | (mouseup anywhere) | `SET_ENTRY_OVERRIDE` | `{ entryId, key: 'duracionMin', value: newDuration }` |

Commit: `docs: add editor gesture-to-event mapping matrix`

---

## Step 2 — Build timeline grid layout

Modify `apps/quotation/playground/QuotationFlowInternal.html`:

Replace or augment the `.basket-list` section with a timeline grid view. The grid should:

1. Show hour rows from 07:00 to 23:00 (configurable range).
2. Each hour row is a drop target.
3. Basket entries are positioned at their `hora` value.
4. Entry height reflects `duracionMin` (1 hour = 1 row height).
5. Keep the existing accordion view toggleable (tabs: "Timeline" / "List").

Do not duplicate basket state — both views read from the same `basket.basketEntries`.

Commit: `feat: add timeline grid layout to basket editor`

---

## Step 3 — Wire catalog-to-grid drop

Reuse existing `startCatalogDrag` / `endCatalogDrag` from `createQuotationFlowComponent.js`.

Add `dropOnGridCell(hour, event)` handler:

```js
dropOnGridCell(hour, event) {
  const itemId = this.draggedItemId(event);
  this.endCatalogDrag();
  if (!itemId) return;
  runtime.shipItemToSelectedDay(itemId);
  // After shipping, find the new entry and set its hora
  const entries = this.basket.basketEntries;
  const newest = entries[entries.length - 1];
  if (newest) {
    runtime.setEntryOverride(newest.id, 'hora', hour);
  }
}
```

Commit: `feat: wire catalog-to-timeline-grid drop`

---

## Step 4 — Wire entry move (re-drag)

Add handlers for moving an existing entry to a different hour:

```js
startEntryDrag(entryId, event) {
  this.draggingEntryId = entryId;
  event.dataTransfer.setData('text/plain', `entry:${entryId}`);
  event.dataTransfer.effectAllowed = 'move';
}

dropEntryOnHour(hour, event) {
  if (!this.draggingEntryId) return;
  runtime.setEntryOverride(this.draggingEntryId, 'hora', hour);
  this.draggingEntryId = null;
}
```

Commit: `feat: wire entry move-to-hour on timeline grid`

---

## Step 5 — Wire entry resize

Add resize handlers using mousedown/mousemove/mouseup:

```js
startResize(entryId, startY, currentDuration) {
  this.resizing = { entryId, startY, startDuration: currentDuration };
  // Attach mousemove/mouseup listeners to document
}

doResize(event) {
  if (!this.resizing) return;
  const deltaY = event.clientY - this.resizing.startY;
  const deltaMins = Math.round(deltaY / ROW_HEIGHT * 60 / 30) * 30; // snap to 30min
  const newDuration = Math.max(30, this.resizing.startDuration + deltaMins);
  // Live preview (CSS only, no runtime event yet)
}

endResize() {
  if (!this.resizing) return;
  runtime.setEntryOverride(this.resizing.entryId, 'duracionMin', finalDuration);
  this.resizing = null;
}
```

Commit: `feat: wire entry duration resize on timeline grid`

---

## Step 6 — Update bundled component and GAS preview

Update `bundling/createQuotationFlowComponent.js` with same handlers.

```bash
npm run build
npm run dev:gas
```

Verify all drag interactions work in GAS preview.

Commit: `feat: add timeline drag interactions to GAS bundle`

---

## Step 7 — E2E tests

File: `tests/e2e/editor-drag.spec.js`

Test scenarios:
- Drag catalog item to grid cell → entry appears at target hour
- Drag existing entry to different hour → hour updates
- Resize entry → duration updates
- Accordion view still functional after interactions

```bash
npm run test:e2e
```

Commit: `test: add E2E tests for editor drag interactions`

---

## What NOT to do

- Do not create new machine states or transitions — all gestures map to existing events
- Do not implement pack/group drop zones — leave placeholder comments
- Do not remove the accordion view — timeline is an additional view, not a replacement
- Do not implement touch drag yet — mouse is sufficient for MVP
