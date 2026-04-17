---
id: V-07
name: Detail Hover
domain: quality
status: open
priority: p2
depends_on: []
pills:
  - pill-naming-conventions
  - pill-styling-isolation
---

## Goal
Show catalog details and rule results on hover in the validator table.

## Requirements
1. Implement a hover popover for rows in the validation/resolver table.
2. Display item description and active rules.
3. Use isolated CSS for the popover to avoid breaking table layout.

## Validation
- Popover appears on hover.
- Content matches item data.
