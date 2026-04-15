import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  executeLocalGasMethod,
  readLocalDbState,
} from './localPersistenceStore.js';

const tempDirs = [];

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cotizador-local-db-'));
  tempDirs.push(dir);
  return path.join(dir, 'db.json');
}

describe('localPersistenceStore', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates db.json from CSV seed when missing', () => {
    const dbFilePath = createTempDbPath();
    const state = readLocalDbState({ dbFilePath });

    expect(fs.existsSync(dbFilePath)).toBe(true);
    expect(Array.isArray(state.CLIENTES)).toBe(true);
    expect(state.CLIENTES.length).toBeGreaterThan(0);
    expect(Array.isArray(state.COTIZACIONES)).toBe(true);
  });

  it('persists saved quotations to disk across requests', async () => {
    const dbFilePath = createTempDbPath();

    const saveResult = await executeLocalGasMethod(
      'guardarCotizacionV2',
      [
        {
          cotizacion: {
            ID_Cotizacion: 'COT-LOCAL-001',
            ID_Cliente: 'CLI-001',
            Estado: 'Borrador',
            Fecha_Evento: '2026-04-10',
            Duracion_Dias: 1,
            Pax_Global: 40,
            Updated_At: '2026-03-21T00:00:00.000Z',
          },
          lineas: [
            {
              ID_Linea: 'LIN-LOCAL-001',
              ID_Cotizacion: 'COT-LOCAL-001',
              ID_Item: 'ITEM-001',
              Estado_Linea: 'ACTIVA',
              Dia_Numero: 1,
              Hora_Inicio: '09:00',
              Override_Pax: 40,
              Override_Cantidad: 1,
              Override_Duracion_Min: 120,
              Comentarios: 'Local save',
              Updated_At: '2026-03-21T00:00:00.000Z',
            },
          ],
        },
      ],
      { dbFilePath }
    );

    expect(saveResult.ok).toBe(true);

    const persisted = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    expect(persisted.COTIZACIONES.some((row) => row.ID_Cotizacion === 'COT-LOCAL-001')).toBe(true);
    expect(persisted.LINEA_DETALLE.some((row) => row.ID_Linea === 'LIN-LOCAL-001')).toBe(true);

    const loadResult = await executeLocalGasMethod('cargarCotizacionV2', ['COT-LOCAL-001'], { dbFilePath });
    expect(loadResult.ok).toBe(true);
    expect(loadResult.data.quotationId).toBe('COT-LOCAL-001');
    expect(loadResult.data.lineCount).toBe(1);
  });
});
