# U-2 Editor: Gesture Event Matrix

> This document defines the user interaction gestures for the quotation editor, mapping them to runtime events. It serves as the baseline for implementing editor interactivity.

| Element | Gesture | Interaction | Status | Runtime Event | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Catalog Item** | Click | Show item details/popover | `existing` | `SHOW_DETAILS` | Standard info display. |
| | Drag Start | Pick up item to place on timeline. | `to-add` | `PICK_UP_ITEM` | Visual feedback: ghost image, dimmed source. |
| **Timeline Grid**| Drag Over | Show drop indicator (time) on grid. | `to-add` | `GRID.DRAG_OVER` | |
| | Drag Leave | Hide drop indicator. | `to-add` | `GRID.DRAG_LEAVE` | |
| | Drop | Place dragged catalog item as a new block. | `to-add` | `ADD_ITEM` | Creates a new basket item at the target time. |
| **Basket Item (Block)**| Drag Start | Pick up existing block to move it. | `to-add` | `MOVE_ITEM_START` | |
| | Drop | Move block to new time on the grid. | `to-add` | `MOVE_ITEM_END` | Updates the item's `hora` property. |
| | Mouse Down (on resize handle) | Start resize interaction. | `to-add` | `RESIZE_ITEM_START` | |
| | Mouse Move (while resizing) | Adjust block duration. | `to-add` | `RESIZE_ITEM_UPDATE`| Updates the item's `duracionMin` override. |
| | Mouse Up (after resizing) | Finalize resize interaction. | `to-add` | `RESIZE_ITEM_END` | Commits the `duracionMin` override. |
| | Click (on close '×' button) | Remove item from basket. | `existing` | `REMOVE_ITEM` | Standard remove/delete action. |
| | Drag Over (child drop zone) | Highlight as a valid grouping target. | `deferred` | `GROUP.DRAG_OVER` | Pack/group behavior is out of MVP scope. |
| | Drop (child drop zone) | Add dragged item as a child of the block. | `deferred` | `GROUP.ADD_CHILD` | Pack/group behavior is out of MVP scope. |
| **Child Item (in Block)** | Click (on remove '×' button) | Remove child item from a group. | `deferred` | `GROUP.REMOVE_CHILD` | Pack/group behavior is out of MVP scope. |

---

## Interaction Status

- **`existing`**: Functionality is already present in the current accordion/list view. The new timeline UI should not break it.
- **`to-add`**: New functionality to be implemented as part of the timeline UI layer.
- **`deferred`**: Functionality related to item grouping (packs/kits) which is explicitly out of scope for the editor MVP.
