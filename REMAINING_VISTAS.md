# Remaining Vistas Implementation Roadmap

Each task below is derived from `@Vistas.md`. 
**Completion Criteria:** The feature must be implemented AND added as a step in `user_flow.json`, verified by `tools/userFlowRunner.mjs`.

## Phase 1: Editor & Basket Enhancements
| ID | Task | Requirement | user_flow Step | Status |
|----|------|-------------|----------------|--------|
| V-01 | **Item Comments** | Allow per-item text comments in the basket/canasta view. | `add_item_comment` | ✅ Done |
| V-02 | **Time Adjustment (Move)** | Drag or input to adjust item start/end time in timeline. | `adjust_item_time` | ✅ Done |
| V-03 | **Time Adjustment (Resize)** | Drag to extend/shorten duration in timeline. | `resize_item_duration` | ✅ Done |
| V-04 | **Groups / Packs Logic** | Support "kits" (grouped items that move together). | `add_pack_to_basket` | ✅ Done |

## Phase 2: Validation & Exports
| ID | Task | Requirement | user_flow Step | Status |
|----|------|-------------|----------------|--------|
| U-4 | **PDF Export** | Generate a printable PDF of the quotation. | `export_to_pdf` | ✅ Done |
| V-06 | **Excel Export** | Export quotation data (with calculations) to Excel. | `export_to_excel` | ✅ Done |
| V-07 | **Detail Hover** | Show catalog details/rules on hover in the validator table. | `hover_verify_rules` | ✅ Done |

## Phase 3: Advanced DB/Rules UI
| ID | Task | Requirement | user_flow Step | Status |
|----|------|-------------|----------------|--------|
| V-08 | **Pack Editor UI** | Stylized view for editing kits and "pre-editables". | `edit_pack_db` | 🔴 Open |
| V-09 | **Rule Visualizers** | Price graphs and rule logic visualization in the resolver. | `verify_pricing_graph` | ✅ Done |
| V-10 | **Rule Creator UI** | Advanced form for creating complex business rules. | `create_custom_rule` | ✅ Done |

---

## Current Focus: Modularization (R-series)
Extracting components from monolithic orchestrators into `packages/components/`.

| ID | Task | Status |
|----|------|--------|
| R-01-1 | [UI] Finalize Sidebar Template | 🔴 Open |
| R-02-1 | [UI] Extract Timeline Template | ✅ Done |
| R-04-1 | [UI] Extract Modals Template | ✅ Done |
