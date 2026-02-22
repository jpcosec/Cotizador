/**
 * Resolves scheduling parameters using a precedence hierarchy.
 *
 * Precedence: overrides > externalContext > defaults
 * - If dia or hora exist in overrides, they take priority
 * - Otherwise fall back to externalContext values
 * - Finally use sensible defaults (dia=1, hora='09:00')
 *
 * Overrides take precedence over external context.
 * @param {Object} [externalContext={}]
 * @param {Object} [overrides={}]
 * @returns {{ dia: number, hora: string }}
 */
export function resolveSchedule(externalContext = {}, overrides = {}) {
  return {
    dia: overrides.dia ?? externalContext.dia ?? 1,
    hora: overrides.hora ?? externalContext.hora ?? '09:00'
  };
}
