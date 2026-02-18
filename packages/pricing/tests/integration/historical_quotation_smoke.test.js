import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCurrency(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;
  if (/incluido/i.test(normalized)) return null;

  const digitsOnly = normalized.replace(/[^\d-]/g, '');
  if (!digitsOnly) return null;

  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
  if (!value) return null;
  const parsed = Number.parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function loadCsvRows(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function isSpecialService(name) {
  return /(iva|descuento|incluido|cuenta corriente|banco)/i.test(name || '');
}

describe('Historical quotation smoke test (real CSV)', () => {
  it('can load one real quotation and reconcile line totals', () => {
    const csvPath = path.resolve(process.cwd(), '../../Data/Data_Historica.csv');
    const rows = loadCsvRows(csvPath);

    const firstQuotationFile = rows.find((row) => row.Archivo)?.Archivo;
    expect(firstQuotationFile).toBeTruthy();

    const quotationRows = rows.filter((row) => row.Archivo === firstQuotationFile);
    expect(quotationRows.length).toBeGreaterThan(10);

    const billableRows = quotationRows
      .map((row) => {
        const service = String(row.Servicio || '').trim();
        const uds = parseInteger(row.Uds);
        const pax = parseInteger(row['Nº Pax']);
        const unit = parseCurrency(row.Valor);
        const total = parseCurrency(row.Total);

        return { service, uds, pax, unit, total };
      })
      .filter((row) => (
        row.total !== null
        && row.total > 0
        && row.unit !== null
        && row.unit > 0
        && row.uds !== null
        && row.uds > 0
        && !isSpecialService(row.service)
      ));

    expect(billableRows.length).toBeGreaterThan(5);

    const reconcilable = billableRows.filter((row) => {
      const byUnits = row.unit * row.uds;
      const byUnitsAndPax = row.pax && row.pax > 0 ? row.unit * row.uds * row.pax : null;

      return row.total === byUnits || row.total === byUnitsAndPax;
    });

    const ratio = reconcilable.length / billableRows.length;
    expect(ratio).toBeGreaterThanOrEqual(0.8);
  });
});
