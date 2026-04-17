---
id: pill-excel-export-strategy
type: decision
scope: domain
language: es
nature: context
status: active
depends_on: []
---

## What
Strategy for Excel export of quotation data.

## Why
Clients and venue operations need Excel for internal budgeting, calculation audits, and operational planning.

## Where
- `apps/quotation/services/excelService.js` (to be created)

## How
1. **Tooling:** Use `SheetJS` (XLSX) library if advanced formatting/multiple sheets are needed, or simple CSV/HTML table export if layout is basic.
2. **Data Structure:**
   - **Sheet 1 (Resume):** Client info, totals, and global settings.
   - **Sheet 2 (Detail):** Flattened rows with columns for Day, Time, Item, Pax, Units, and Subtotal.
3. **Calculations:** Formulas should be preserved in Excel if possible, or at least the exported values must match the browser's state exactly.
