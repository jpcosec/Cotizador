import { describe, expect, it } from 'vitest';
import { createDatabase } from './createDatabase.js';
import { validateRow } from './validation.js';

function createDbWithClient(client) {
  return createDatabase({
    seed: [
      {
        table: 'CLIENTES',
        records: [client],
      },
    ],
  });
}

describe('validateRow business rules', () => {
  it('rejects duplicate client identity by rut and email on create', () => {
    const db = createDbWithClient({
      ID_Cliente: 'CLI-001',
      Nombre_Empresa: 'Empresa Uno',
      RUT: '76.111.111-1',
      Email: 'uno@test.cl',
      Telefono: '+56 9 1111 1111',
      Updated_At: '2026-03-21T00:00:00.000Z',
    });

    const errors = validateRow(
      'CLIENTES',
      {
        ID_Cliente: 'CLI-002',
        Nombre_Empresa: 'Empresa Duplicada',
        RUT: '76.111.111-1',
        Email: 'uno@test.cl',
        Telefono: '+56 9 2222 2222',
        Updated_At: '2026-03-21T00:00:00.000Z',
      },
      { models: db.models }
    );

    expect(errors.RUT).toBe('Ya existe un cliente con el mismo RUT y Email');
    expect(errors.Email).toBe('Ya existe un cliente con el mismo RUT y Email');
  });

  it('allows editing the same client without flagging itself as duplicate', () => {
    const db = createDbWithClient({
      ID_Cliente: 'CLI-001',
      Nombre_Empresa: 'Empresa Uno',
      RUT: '76.111.111-1',
      Email: 'uno@test.cl',
      Telefono: '+56 9 1111 1111',
      Updated_At: '2026-03-21T00:00:00.000Z',
    });

    const errors = validateRow(
      'CLIENTES',
      {
        ID_Cliente: 'CLI-001',
        Nombre_Empresa: 'Empresa Uno Editada',
        RUT: '76.111.111-1',
        Email: 'uno@test.cl',
        Telefono: '+56 9 3333 3333',
        Updated_At: '2026-03-21T00:00:00.000Z',
      },
      { models: db.models }
    );

    expect(errors).toEqual({});
  });
});
