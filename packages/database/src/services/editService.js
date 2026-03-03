/**
 * editService.js — pure write helpers over in-memory models.
 *
 * All functions follow a safe return contract: they never throw.
 * Every call returns { ok: boolean, data: any, error: string | null }.
 *
 * The model parameter is a model object produced by ModelFactory
 * (exposes findById, update, create, deleteById).
 */

/**
 * @param {object} model - ModelFactory model
 * @param {string} id - Primary key value
 * @param {object} patch - Fields to merge
 * @returns {{ ok: boolean, data: object|null, error: string|null }}
 */
export function updateRow(model, id, patch) {
  try {
    const row = model.findById(id);
    if (!row) return { ok: false, data: null, error: `Row not found: ${id}` };
    const updated = model.update({ ...row, ...patch });
    return { ok: true, data: updated, error: null };
  } catch (err) {
    return { ok: false, data: null, error: String(err.message || err) };
  }
}

/**
 * @param {object} model - ModelFactory model
 * @param {object} row - Complete row object (PK may be omitted; store assigns it)
 * @returns {{ ok: boolean, data: object|null, error: string|null }}
 */
export function addRow(model, row) {
  try {
    const created = model.create(row);
    return { ok: true, data: created, error: null };
  } catch (err) {
    return { ok: false, data: null, error: String(err.message || err) };
  }
}

/**
 * @param {object} model - ModelFactory model
 * @param {string} id - Primary key value
 * @returns {{ ok: boolean, data: {id: string}|null, error: string|null }}
 */
export function deleteRow(model, id) {
  try {
    const deleted = model.deleteById(id);
    if (!deleted) return { ok: false, data: null, error: `Row not found: ${id}` };
    return { ok: true, data: { id }, error: null };
  } catch (err) {
    return { ok: false, data: null, error: String(err.message || err) };
  }
}
