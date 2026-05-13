# Project: CotizadorLodge Data Semantic Extraction

## Goal
Transform inconsistent, semi-structured Excel price lists (2025-2026) into a normalized, machine-readable relational model for a future quoting engine.

## Extraction Strategy: "Schema-Guided Semantic Parsing"
Instead of traditional regex or heuristic scraping, the process follows these strict principles:
1. **Segmentation:** Sheets are split into "mini-tables" (logical blocks) to reduce context noise.
2. **Semantic Extraction:** Each block is parsed by an LLM agent into a strict JSON schema.
3. **Traceability:** Every extracted item maintains a `source_row` reference to the original file.
4. **Ambiguity Preservation:** Formulas or text rules are captured as `raw_text` and `raw_expression` before being decomposed.

## Data Model (4-Table Architecture)

### 1. Items Table (`items.csv`)
- **item_name**: Canonical/Infinitive version of the service (e.g., "arrendar", "caminar").
- **item_extra**: Residual metadata from the original name (e.g., "30 min", "max 10 pax").
- **category**: The ID of the source mini-table.
- **subcategory**: A logical business grouping (Wellness, Gastronomía, etc.).
- **source_row**: Original row index for audit.

### 2. Category Hierarchy (`categories.csv`)
- Maps `category` (mini-table) to `subcategory`.
- Defines the high-level organization of the service catalog.

### 3. Price Calculation (`pricing.csv`)
- **item_id**: Linked to the item.
- **expression_type**: `flat`, `per_person`, `base_plus_variable`, or `excel_formula`.
- **components**: Structured breakdown of the price (base value, variable value, unit).

### 4. Business Rules (`rules.csv`)
- **Linked to Subcategory**: Rules apply to groups of items (e.g., all "Wellness" items require 3 days' notice).
- **rule_type**: `capacity`, `duration`, `ratio`, `conditional`.
- **logic**: Min/Max values and conditional effects.

## Current Progress
- [x] Segmentation of 2025 & 2026 Excel files into raw CSV mini-tables.
- [x] Semantic extraction of 2025 data into JSON.
- [x] Semantic extraction of 2026 data into JSON (Core blocks complete).
- [x] Generation of `items.csv` (v1) with infinitive normalization.
- [ ] Generation of Category, Pricing, and Rules tables.
