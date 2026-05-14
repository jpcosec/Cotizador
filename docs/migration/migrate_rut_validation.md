# Migration: Chilean RUT Validation

## What

Legacy (`legacy/SheetDB.js`) has a `validarRUT(rut)` helper that checks format `\d{7,8}-[\dkK]$`. Dev has no equivalent — there is no RUT validation anywhere in `dev/src/`.

## Why it matters

RUT is the primary deduplication key for `CLIENTES`. Without validation:
- Malformed RUTs silently create duplicate client records
- The `ClientSelector` modal can save a client that will never be found by a future RUT lookup
- Exports and PDF headers show garbage data in the `RUT:` field

Legacy also had `findByRUT` and explicit duplicate checking in `Cliente.validate()` that relied on the format being consistent. Dev's `ClientSelector` has no such guard.

## What legacy does

```javascript
function validarRUT(rut) {
  if (!rut) return false;
  var pattern = /^\d{7,8}-[\dkK]$/;
  return pattern.test(rut);
}
```

Then in `Cliente.validate()`:
```javascript
if (data.RUT && !validarRUT(data.RUT)) errors.push("RUT inválido (formato: 12345678-9)");
if (data.RUT) {
  var existe = this.findByRUT(data.RUT);
  if (existe && existe.ID_Cliente !== data.ID_Cliente) errors.push("Ya existe un cliente con este RUT");
}
```

Note: this only validates **format**, not the **check digit** (the `K` or digit after the dash). A full check-digit validator would be:

```javascript
function validarDigitoRUT(rut) {
  const [body, dv] = rut.split('-');
  const digits = body.replace(/\./g, '').split('').reverse();
  let sum = 0;
  let mult = 2;
  for (const d of digits) {
    sum += parseInt(d) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const expected = 11 - (sum % 11);
  const computed = expected === 11 ? '0' : expected === 10 ? 'k' : String(expected);
  return computed === dv.toLowerCase();
}
```

## How to migrate

### Where to add it

`dev/src/components/quotation/modals/ClientSelector.js` — the modal that saves/edits clients. Add validation before the save call.

### What to implement

```javascript
// dev/src/services/validation/rut.js

export function formatRut(raw = '') {
  const clean = raw.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return raw;
  return clean.slice(0, -1) + '-' + clean.slice(-1).toUpperCase();
}

export function validateRutFormat(rut = '') {
  return /^\d{7,8}-[\dkK]$/i.test(rut.trim());
}

export function validateRutCheckDigit(rut = '') {
  if (!validateRutFormat(rut)) return false;
  const [body, dv] = rut.split('-');
  const digits = body.split('').reverse();
  let sum = 0, mult = 2;
  for (const d of digits) {
    sum += parseInt(d) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const expected = 11 - (sum % 11);
  const computed = expected === 11 ? '0' : expected === 10 ? 'k' : String(expected);
  return computed === dv.toLowerCase();
}
```

### Integration points

1. `ClientSelector.js` — call `validateRutCheckDigit(rut)` before `save`, surface error in the form
2. `createDatabase.js` / model layer — optionally enforce on insert as a schema-level guard
3. `buscarCotizacionesV2` (GAS) — normalize RUT format before deduplication lookup

## Files to create

- `dev/src/services/validation/rut.js` — the three helpers above
- Add import + call in `dev/src/components/quotation/modals/ClientSelector.js`
