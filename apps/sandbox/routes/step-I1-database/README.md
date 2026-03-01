# Step I1 Database Route Notes

## Width Correction (2026-03-01)

- Problem: `http://localhost:8090/step-I1-database` looked visually constrained instead of true edge-to-edge layout.
- Root cause: route-level `body.sandbox-page` used `padding: 16px`, leaving fixed horizontal gutters.
- Correction: updated route stylesheet to `padding: 0` and kept header spacing with local margin.

## Files Updated

- `apps/sandbox/routes/step-I1-database/index.html`

## Validation

- Verified with Playwright at multiple viewport sizes (`1440`, `1920`, `2560`, `3840`) that main container width now tracks full viewport width.
