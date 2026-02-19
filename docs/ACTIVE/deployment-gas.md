# Deployment (GAS)

## Build and Push

```bash
cd /home/jp/CotizadorLodge/claps_codelab
npm run build
clasp push
```

## Deployment Surface

- GAS files live in `gas/` (`.clasp.json` rootDir points there).
- Runtime bundle output feeds GAS include assets.

## Operational Notes

- Keep deployment artifacts consistent with bundling output.
- Validate integrated tests before push.
- Treat `gas/Index.html` composition as runtime-facing and keep it aligned with frontend bundle usage.

## Related Docs

- `../workspace/DEPLOYMENT_CHECKLIST.md`
- `../workspace/SETUP_SHEETDB.md`
