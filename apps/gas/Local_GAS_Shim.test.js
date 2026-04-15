import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

function loadShimScript() {
  const filePath = resolve(import.meta.dirname, 'Local_GAS_Shim.html');
  const html = readFileSync(filePath, 'utf8');
  return html
    .replace(/^\s*<script>/, '')
    .replace(/<\/script>\s*$/, '');
}

function installShim({ hostname = 'localhost', port = '8082' } = {}) {
  const windowObject = {
    location: { hostname, port },
    open: () => ({ closed: false }),
  };

  globalThis.window = windowObject;
  globalThis.location = windowObject.location;
  const quotationStore = new Map();

  globalThis.fetch = vi.fn(async (_url, options = {}) => {
    const body = JSON.parse(options.body || '{}');
    const [payload] = body.args || [];

    if (body.method === 'healthcheck') {
      return {
        ok: true,
        async json() {
          return { ok: true, runtime: 'local-disk' };
        },
      };
    }

    if (body.method === 'guardarCotizacion') {
      quotationStore.set(payload.cotizacion.ID_Cotizacion, payload);
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            data: {
              quotationId: payload.cotizacion.ID_Cotizacion,
              cotizacion: payload.cotizacion,
              lineas: payload.lineas || [],
              lineCount: (payload.lineas || []).length,
            },
          };
        },
      };
    }

    if (body.method === 'buscarCotizaciones') {
      const items = Array.from(quotationStore.values()).map((entry) => ({
        quotationId: entry.cotizacion.ID_Cotizacion,
        clientName: entry.cotizacion.Cliente_Nombre || entry.cotizacion.ID_Cliente,
        pax: entry.cotizacion.Pax_Global,
        quotationDate: entry.cotizacion.Fecha_Evento,
      }));
      return {
        ok: true,
        async json() {
          return { ok: true, data: { items, count: items.length } };
        },
      };
    }

    throw new Error(`Unexpected method ${body.method}`);
  });

  const scriptBody = loadShimScript();
  const executeShim = new Function(scriptBody);
  executeShim();

  return windowObject;
}

function callGasMethod(method, ...args) {
  return new Promise((resolveCall, rejectCall) => {
    globalThis.window.google.script.run
      .withSuccessHandler((result) => resolveCall(result))
      .withFailureHandler((error) => rejectCall(error))
      [method](...args);
  });
}

describe('Local_GAS_Shim', () => {
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.location;
    delete globalThis.fetch;
  });

  it('returns a fresh caller on each google.script.run access', () => {
    const shimWindow = installShim();

    expect(shimWindow.google.script.run).not.toBe(shimWindow.google.script.run);
  });

  it('keeps concurrent call handlers isolated', async () => {
    installShim();

    const saveA = callGasMethod('guardarCotizacion', {
      cotizacion: { ID_Cotizacion: 'COT-A' },
      lineas: [],
    });

    const saveB = callGasMethod('guardarCotizacion', {
      cotizacion: { ID_Cotizacion: 'COT-B' },
      lineas: [],
    });

    const [resultA, resultB] = await Promise.all([saveA, saveB]);

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    expect(resultA.data.quotationId).toBe('COT-A');
    expect(resultB.data.quotationId).toBe('COT-B');
  });

  it('lists saved quotations for search', async () => {
    installShim();

    await callGasMethod('guardarCotizacion', {
      cotizacion: {
        ID_Cotizacion: 'COT-A',
        ID_Cliente: 'CLI-1',
        Cliente_Nombre: 'Empresa Uno',
        Fecha_Evento: '2026-04-10',
        Pax_Global: 40,
      },
      lineas: [],
    });

    const result = await callGasMethod('buscarCotizaciones', { term: 'empresa', limit: 10 });
    expect(result.ok).toBe(true);
    expect(result.data.items[0]).toMatchObject({
      quotationId: 'COT-A',
      clientName: 'Empresa Uno',
      pax: 40,
      quotationDate: '2026-04-10',
    });
  });
});
