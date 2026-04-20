/**
 * Event-aware time utilities.
 *
 * The venue operates on an "event day" that may cross midnight.
 * A configurable day boundary (default 09:00) anchors the day:
 * times before the boundary are treated as next-day overflow (+1440 minutes).
 *
 * This yields a monotonic integer ("event minutes") suitable for
 * plain numeric comparisons in JSON Logic:
 *
 *   09:00  →  540   (day start, boundary)
 *   21:00  → 1260   (normal evening)
 *   01:00  → 1500   (1 AM next day — correctly > 1260)
 *   08:59  → 1979   (8:59 AM next day)
 */

export const DEFAULT_BOUNDARY = '09:00';

/**
 * Parse a time string to minutes from midnight (0–1439).
 * Accepts 24h ('21:30', '09:00', '00:00') and
 * 12h ('9:00 AM', '9:00 PM', '12:00 AM', '12:00 PM').
 *
 * @param {string} str
 * @returns {number} minutes 0–1439
 * @throws {Error} if the string cannot be parsed or is out of range
 */
export function parseTimeString(str) {
  if (typeof str !== 'string') {
    throw new Error(`parseTimeString: expected string, got ${typeof str}`);
  }
  const s = str.trim();

  // 12h format: "9:00 AM", "9:00 PM", "12:00 AM", "12:00 PM"
  const h12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (h12) {
    let h = parseInt(h12[1], 10);
    const m = parseInt(h12[2], 10);
    const meridiem = h12[3].toUpperCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) {
      throw new Error(`parseTimeString: invalid 12h time '${str}'`);
    }
    if (meridiem === 'AM') {
      h = h === 12 ? 0 : h;        // 12:xx AM → 0:xx (midnight)
    } else {
      h = h === 12 ? 12 : h + 12;  // 12:xx PM → 12:xx (noon), 1:xx PM → 13:xx
    }
    return h * 60 + m;
  }

  // 24h format: "21:30", "09:00", "00:00"
  const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    const m = parseInt(h24[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      throw new Error(`parseTimeString: invalid 24h time '${str}'`);
    }
    return h * 60 + m;
  }

  throw new Error(`parseTimeString: unrecognized format '${str}'`);
}

/**
 * Convert a time string to event minutes — a monotonic integer
 * anchored to the start of the venue's event day.
 *
 * Times before the boundary are treated as next-day overflow (+1440).
 *
 * @param {string} timeStr   - Any supported time string
 * @param {string} [boundary='09:00'] - Day start boundary (24h string)
 * @returns {number} event minutes (≥ boundaryMinutes, possibly > 1440)
 */
export function eventMinutes(timeStr, boundary = DEFAULT_BOUNDARY) {
  const minutes = parseTimeString(timeStr);
  const boundaryMin = parseTimeString(boundary);
  return minutes < boundaryMin ? minutes + 1440 : minutes;
}

/**
 * Format event minutes back to a human-readable time string.
 * Minutes ≥ 1440 (next-day) are shown with a (+1) suffix.
 *
 * @param {number} n - Event minutes
 * @returns {string} e.g. '21:30', '01:00 (+1)'
 */
export function formatEventMinutes(n) {
  const overflow = n >= 1440;
  const adjusted = overflow ? n - 1440 : n;
  const h = String(Math.floor(adjusted / 60)).padStart(2, '0');
  const m = String(adjusted % 60).padStart(2, '0');
  return overflow ? `${h}:${m} (+1)` : `${h}:${m}`;
}
