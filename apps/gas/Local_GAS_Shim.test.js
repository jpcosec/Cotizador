import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

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
});
