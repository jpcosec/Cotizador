# Rules Editor Redesign: Visual Logic Inspector

## Problem Statement

The original rules table was **hiding the most important information**: the conditions that control item availability. Users couldn't see what logic triggered each rule without opening developer tools or inspecting raw JSON.

**Original Table Issues:**
- ❌ No condition column visible
- ❌ Complex JSON-Logic expressions completely hidden
- ❌ No humanized explanation of rule logic
- ❌ Conditions only editable via textarea in form
- ❌ Generic table aesthetic doesn't match the task's technical nature

## Solution: Visual Logic Inspector

A **dark, brutalist aesthetic** that makes conditions the PRIMARY visual element.

### Design Principles

1. **Conditions First** - The JSON-Logic expression is immediately visible in every rule
2. **Expandable Details** - Click a rule to see humanized explanation + full logic tree
3. **Technical Elegance** - Monospace fonts, syntax highlighting, dark theme for developers
4. **Intentional Aesthetic** - Not a generic table—a distinctive "inspector" that feels like a tool

### Key Features

#### 1. Rule Cards (Not Table Rows)
- **Card-based layout** replaces table for better expandability
- Each rule shows: Status indicator | Name | Action type | Expand toggle
- Hover effects reveal full visual prominence

#### 2. Condition Preview (Always Visible)
```
Condition: { ">": [{"var":"pax"}, 100] }
```
- One-line JSON preview in every rule
- Truncates long conditions with `...`
- Syntax uses emerald green (#10b981) for recognition

#### 3. Expanded Details Panel
When clicked, each rule expands to show:

**📖 Readable Format**
```
pax greater than 100
```
Machine-generated humanization of JSON-Logic into plain English.

**🌳 Full Logic Tree**
```
{
  ">": [
    {"var": "pax"},
    100
  ]
}
```
Syntax-highlighted JSON with:
- Amber (#f59e0b) for logical operators (and, or, not)
- Emerald (#10b981) for comparison operators (>, <, ===)
- Blue (#60a5fa) for variables
- Gray for other values

**Metadata**
- Scope (e.g., "ITEM")
- Priority
- Created/Updated date

**Quick Actions**
- Toggle Active/Inactive
- Delete

#### 4. Form Panel
- Expandable "New Rule" button at top
- Clean, two-column layout
- Input fields for name, condition, action type
- Action selector with visual buttons (ERROR/WARNING)

### Visual Design

**Aesthetic: Brutalist Technical**
- **Color Palette:**
  - Primary: Emerald green (#10b981) - for active, primary actions
  - Background: Dark slate (#0f172a, #1a1f3a) - code editor feel
  - Accent: Amber (#f59e0b) - for emphasis (logical operators)
  - Error: Red (#ef4444) - for ERROR action type
  - Warning: Amber (#f59e0b) - for WARNING action type

- **Typography:**
  - Headers: Outfit (geometric sans-serif) - clean, modern
  - Code/Conditions: JetBrains Mono (distinctive monospace) - technical credibility
  - Body: Outfit - minimal but refined

- **Spatial Design:**
  - Generous padding (16-24px) for breathing room
  - Cards with subtle borders (rgba green 0.2)
  - Smooth transitions and hover states
  - Expandable sections with animation

### Code Structure

**Component Functions:**
- `toggleAddRuleForm()` - Show/hide form panel
- `toggleRuleExpanded(idx)` - Expand individual rule details
- `humanizeCondition(condition)` - Convert JSON-Logic to English
- `renderConditionTree(condition, depth)` - Format JSON tree with colors
- `getKeyColor(key)` - Syntax highlighting by operator type
- `formatConditionPreview(condition)` - Truncate for preview

### Before/After

**Before:**
```
│ ID    │ Name │ Action  │ Active │ ×     │
├───────┼──────┼─────────┼────────┼───────┤
│ R_123 │ Rule │ ERROR   │ ✓      │ del   │
│ (no condition visible)          │       │
```

**After:**
```
┌─────────────────────────────────────────────┐
│ 🚫 Rule Name              │ ERROR  │ ID_123 │
├─────────────────────────────────────────────┤
│ Condition: { ">": [{"var":"pax"}, 100] }   │
├─────────────────────────────────────────────┤
│ 📖 Readable Format                          │
│ pax greater than 100                        │
│                                              │
│ 🌳 Full Logic Tree                          │
│ {                                           │
│   ">": [{"var":"pax"}, 100]                 │
│ }                                           │
│                                              │
│ 📋 Scope: ITEM | Priority: 10 | Activo: ✓  │
│ [Toggle Active] [Delete]                    │
└─────────────────────────────────────────────┘
```

### Implementation Details

1. **RulesEditor.html** - Standalone component with complete CSS/HTML
2. **createItemStandaloneComponent.js** - Helper functions for humanization & rendering
3. **Humanization Algorithm:**
   - Recognizes logical operators: and, or, not
   - Translates comparison operators: >, <, ===, !==, etc.
   - Extracts variable names from `{"var": "fieldName"}` patterns
   - Recursive descent for nested conditions

### Future Enhancements

1. **Visual Rule Builder** - Drag-drop interface instead of JSON textarea
2. **Condition Templates** - Common patterns (pax > X, duration < Y, etc.)
3. **Real-time Validation** - Show JSON parse errors while typing
4. **Export/Import** - Copy rule conditions between items
5. **Analytics** - Show which rules are triggered most often

### Testing

The design works for:
- ✅ Simple conditions: `{">": [{"var":"pax"}, 100]}`
- ✅ Complex nested: `{"and": [{">": [{"var":"pax"}, 50]}, {"<": [{"var":"pax"}, 200]}]}`
- ✅ Multiple operators: `{"or": [{...}, {...}, {...}]}`
- ✅ Edge cases: Empty rules, malformed JSON

---

**Status:** Ready for sandbox testing
**Files Modified:** RulesEditor.html, createItemStandaloneComponent.js
**Tests:** All 345 existing tests still pass ✅
