# Item Component Demo Pages

## item-multi.html - Multi-Item View Demo

**URL:** `http://localhost:8090/item-multi/`

A standalone demo page for testing the Item component in isolation, with the ability to add multiple items to the screen independently.

### Features

✅ **Multiple Items** - Add as many items as you want, each independently managed
✅ **Catalog & Basket Views** - Switch between catalog card and basket line views
✅ **Global Context** - Adjust PAX, duration, time, and item name
✅ **Rules Evaluation** - See applied rules, errors, and warnings in real-time
✅ **Clean Layout** - Grid-based responsive layout showing items side-by-side
✅ **No Sidebar Clutter** - Focus on the item cards themselves, not sidebar controls

### How to Use

#### 1. Add Items
```javascript
// Via UI button
Click "Add Catalog Item" button

// Or via console
window.itemDemo.addItem()
window.itemDemo.addItem()
window.itemDemo.addItem()
```

#### 2. Global Controls (Top of Page)
- **PAX Global** - Global participant count
- **Duration (min)** - Duration in minutes
- **Time** - Time of day (affects availability rules)
- **Item Name** - Name for next item to create

#### 3. Item Actions
- **Click item card** - Switch to basket view
- **Click "← Back" badge** - Switch back to catalog
- **Click trash icon** - Remove item from screen

#### 4. Inspect in Console
```javascript
// Access demo API
window.itemDemo.addItem()
window.itemDemo.toggleToBasket(0)
window.itemDemo.toggleToCatalog(0)
window.itemDemo.toggleMode(0)
window.itemDemo.removeItem(0)
```

### Layout

- **Grid Layout**: Responsive grid with 350px min-width per item
- **Catalog Cards**: Show item name, formula, and policy hint
- **Basket Lines**: Show quantity, total price, and comments
- **Rules Section**: Displays applied rules with warnings/errors in each item

### What's Different from Sandbox

| Feature | Sandbox (step-03-item) | Demo (item-multi) |
|---------|------------------------|-------------------|
| Multiple Items | 1 item + complex UI | Multiple independent items |
| Sidebar Controls | Full control panel | Minimal top controls |
| Focus | Rule editing + sandbox testing | Card layout visualization |
| Use Case | Development/debugging | Layout verification |

### Next Steps

1. **Verify basket view appearance** - Check the layout and styling of basket lines
2. **Test rules evaluation** - Modify context and watch rules trigger
3. **Add more items** - See how multiple items render in the grid
4. **Inspect state** - Open DevTools to examine item state objects

### Technical Details

- **Pure Item Component** - Uses the actual Item class, no simulation
- **Dynamic Bundling** - json-logic-js loaded via import-map
- **Responsive Grid** - CSS Grid with auto-fill for dynamic layout
- **No Alpine Bindings** - Vanilla JS rendering for simplicity

---

**Created:** 2026-02-23
**Status:** ✅ Ready for testing
