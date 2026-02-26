# Alpine Reference

Notes extracted from the Alpine examples you shared. This is focused on practical patterns we can reuse and pitfalls to avoid.

## High-value patterns found

1. **Inline edit UX (double-click to edit)**
   - Use `x-show` to swap readonly/display mode with input mode.
   - Use `$nextTick(() => $refs.input.focus())` after toggling edit mode.
   - Exit edit mode with `@click.away`, `@keydown.enter`, and `@keydown.window.escape`.

2. **Search + dropdown/autocomplete input**
   - Keep `search` and `isOpen` state local in one Alpine component.
   - Use a getter (`get getItems()`) to derive filtered results.
   - Use `@click.outside` to close and reset state.
   - Prefer `:key` in `x-for` and keep item identity stable.

3. **Async table search + pagination**
   - Keep request controls (`searchValue`, `page`, `limit`, `isLoading`) in component state.
   - Centralize API calls in one method (`fetchData(page)`).
   - Derive `previousPage` / `nextPage` after each response.

4. **Tabbed slider / carousel behavior**
   - Keep selected tab in `tab` state.
   - Sync active tab classes from state instead of hardcoding classes.
   - Pause auto-advance on hover, resume on mouse out.
   - Store interval value via `data-*` (`data-interval`) so behavior is configurable from markup.

5. **Modal/open-close interactions**
   - Simple and robust with `{ open: false }`, `x-show`, `@click`, and `@click.away`.
   - Use `x-cloak` to avoid initial flicker.

6. **3rd-party integration pattern (SortableJS + Alpine)**
   - Initialize plugin in `x-init`.
   - Bind sortable DOM node with `x-ref`.
   - On reorder (`onEnd`), update the Alpine array so UI and state stay in sync.

7. **Demo playground/live-edit pattern**
   - Use `contenteditable` + Alpine state to render and edit snippet output.
   - Debounce input events to reduce re-renders (`@input.debounce.500`).
   - Keep copy state ephemeral (`copied = true` then timeout reset).

8. **Larger form engines in Alpine (invoice example)**
   - Viable to handle nested objects (`billing`, `from`, `item`) and collections (`items`).
   - Typical methods: `addItem`, `deleteItem`, totals recomputation, printing hooks.
   - Use computed-like methods for totals and utility formatters.

## Cross-example implementation guidance

- Keep Alpine components small and purpose-based (search, modal, table, etc.).
- Prefer derived state (getters/functions) instead of duplicating computed values.
- Use `x-ref` + `x-init` as the default adapter strategy for external libraries.
- Always reflect DOM-driven actions back into Alpine arrays/objects.
- Add `x-cloak` whenever hidden-on-load UI exists.

## Version notes seen in examples

- Mixed versions appeared (`v1`, `v2`, `v3`).
- For current work, use Alpine v3 conventions as baseline.
- Some old examples rely on v2 syntax/behavior and need light adaptation when reused.

## Link-by-link notes

### Successfully analyzed

- `https://codepen.io/mithicher/pen/XWbxEaK`
  - Invoice generator pattern (dynamic rows, totals, modal item entry, print flow).
- `https://codepen.io/ryangjchandler/pen/eYpJZLR`
  - Double-click inline edit with focus management and escape/enter handling.
- `https://codepen.io/hpal/pen/ExVGZYZ`
  - Search + pagination table with async fetch and loading state.
- `https://www.desarrollolibre.net/blog/javascript/sortable-js-alpinejs-para-la-ordenacion-drag-and-drop-23`
  - Clear SortableJS integration pattern using `x-init`, `x-ref`, and `onEnd` reorder sync.
- `https://codepen.io/trovster/full/oNjGGMq`
  - Drag-and-drop Alpine example (title confirmed; code was not fully retrievable in this environment).
- `https://github.com/RWDevelopment/alpine_js_slider`
  - Auto-rotating tabs slider with hover pause/resume and active-tab sync.
- `https://github.com/RWDevelopment/alpine_js_searchable_input`
  - Searchable dropdown input with computed filtering and click-outside close.
- `https://github.com/alpine-collective/alpine-magic-helpers#component`
  - Useful helper set (`$component`, `$fetch`, `$interval`, `$screen`, `$scroll`, `$undo`, etc.; Alpine v2 oriented).
- `https://codepen.io/KevinBatdorf/pen/rNxbbaJ`
  - Interactive Alpine demo playground with live code editing and copy UX.
- `https://codepen.io/the94air/pen/WNbLXwG`
  - Basic Alpine + Tailwind modal/open-close example.

### Could not be retrieved (Cloudflare 403 from this environment)

- `https://codepen.io/sanjayojha/pen/qBONdVm`
- `https://codepen.io/crazedvic/pen/wvJGBga`
- `https://codepen.io/ScottWindon/pen/gOLRLqN`
- `https://codepen.io/ScottWindon/full/oNbOzQj`
- `https://codepen.io/Elliotclyde/pen/yLaYNbG`
- `https://codepen.io/framansi/pen/oNXEmdm`
- `https://codepen.io/t7team/pen/XWdyVyB`

## Reusable snippet checklist

When adapting any of these examples into production:

- Verify Alpine version compatibility (v3 target).
- Replace direct DOM mutation with Alpine state updates where possible.
- Add error handling for async calls.
- Add keyboard + accessibility checks (focus trap, escape to close, aria labels).
- Keep side effects in `init()`/`x-init` and keep template logic declarative.
