---
id: A-00
name: "Linter Enforcement Setup"
domain: quality
status: closed
priority: p0
depends_on: []
pills:
  - pill-srp-file-80-lines
  - pill-srp-function-10-lines
  - pill-mandatory-docstrings
---

## Goal
Install and configure ESLint to automatically fail the build if the "Laws of Physics" (80-line files, 10-line functions) are violated.

## Requirements
1. Install `eslint`, `eslint-plugin-jsdoc`.
2. Create `.eslintrc.js` with:
    - `"max-lines": ["error", { "max": 80, "skipBlankLines": true, "skipComments": true }]`
    - `"max-lines-per-function": ["error", { "max": 10, "skipBlankLines": true, "skipComments": true }]`
    - `"complexity": ["error", 5]`
    - `"jsdoc/require-jsdoc": "error"`
3. Add a `lint` script to `package.json`.
4. Ensure the linter ignores `dist/`, `node_modules/`, and the massive legacy `Bundle_Runtime.html`.

## Validation
- Running `npm run lint` identifies all current "monsters" as errors.
- Build fails if a new function exceeds 10 lines.
