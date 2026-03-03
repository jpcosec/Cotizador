import { eventMinutes } from './time.js';

/**
 * Resolves scheduling parameters using a precedence hierarchy.
 *
 * Precedence: overrides > externalContext > defaults
 *
 * Returns:
 *   dia      - day number (1-based)
 *   hora     - time string as-given, for display (e.g. '21:30')
 *   horaMin  - event minutes: boundary-aware integer for JSON Logic comparisons
 *              Times before boundary (default 09:00) are treated as next-day (+1440).
 *              Examples: '09:00' → 540, '21:00' → 1260, '01:00' → 1500
 *
 * @param {Object} [externalContext={}]
 * @param {Object} [overrides={}]
 * @returns {{ dia: number, hora: string, horaMin: number }}
 */
export function resolveSchedule(externalContext = {}, overrides = {}) {
  const hora = overrides.hora ?? externalContext.hora ?? '09:00';
  return {
    dia: overrides.dia ?? externalContext.dia ?? 1,
    hora,
    horaMin: eventMinutes(hora)
  };
}
