---
id: pill-styling-isolation
type: pattern
scope: global
language: en
nature: context
status: active
depends_on: [pill-modular-composition]
---

## What
Zero-CSS-in-HTML policy. Styles must be isolated from templates.

## Why
Prevents "monster" style blocks and ensures the theme can be updated globally without touching 20 HTML files.

## Rules
1. **Shared Variables:** Located in `packages/components/common/styles/theme-quotation.css`.
2. **Component Styles:** Create `<ComponentName>.css` in the same directory as the `.html` template.
3. **Injection:** The build script (`npm run build`) must bundle or include these CSS files into the final GAS output.
4. **No Inline Styles:** Use semantic classes instead of `style="..."` attributes (except for dynamic positioning like timeline blocks).
