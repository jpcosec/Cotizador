import { describe, it, expect } from 'vitest';
import { parseTimeString, eventMinutes, formatEventMinutes } from './time.js';

// ─── parseTimeString ──────────────────────────────────────────────────────────

describe('parseTimeString', () => {
  describe('24h format', () => {
    it('parses standard times', () => {
      expect(parseTimeString('09:00')).toBe(540);
      expect(parseTimeString('21:30')).toBe(1290);
      expect(parseTimeString('23:59')).toBe(1439);
    });

    it('parses midnight and single-digit hours', () => {
      expect(parseTimeString('00:00')).toBe(0);
      expect(parseTimeString('1:00')).toBe(60);
      expect(parseTimeString('8:45')).toBe(525);
    });
  });

  describe('12h format', () => {
    it('parses AM times', () => {
      expect(parseTimeString('9:00 AM')).toBe(540);
      expect(parseTimeString('1:00 AM')).toBe(60);
      expect(parseTimeString('11:30 AM')).toBe(690);
    });

    it('handles midnight edge: 12:00 AM → 0', () => {
      expect(parseTimeString('12:00 AM')).toBe(0);
    });

    it('parses PM times', () => {
      expect(parseTimeString('9:00 PM')).toBe(1260);
      expect(parseTimeString('1:00 PM')).toBe(780);
      expect(parseTimeString('11:59 PM')).toBe(1439);
    });

    it('handles noon edge: 12:00 PM → 720', () => {
      expect(parseTimeString('12:00 PM')).toBe(720);
    });

    it('is case-insensitive for AM/PM', () => {
      expect(parseTimeString('9:00 am')).toBe(540);
      expect(parseTimeString('9:00 pm')).toBe(1260);
    });
  });

  describe('error handling', () => {
    it('throws for non-string input', () => {
      expect(() => parseTimeString(null)).toThrow('parseTimeString');
      expect(() => parseTimeString(900)).toThrow('parseTimeString');
    });

    it('throws for unrecognized format', () => {
      expect(() => parseTimeString('abc')).toThrow("unrecognized format");
      expect(() => parseTimeString('9am')).toThrow();
      expect(() => parseTimeString('')).toThrow();
    });

    it('throws for out-of-range values', () => {
      expect(() => parseTimeString('25:00')).toThrow();
      expect(() => parseTimeString('09:60')).toThrow();
    });
  });
});

// ─── eventMinutes ─────────────────────────────────────────────────────────────

describe('eventMinutes', () => {
  describe('times at or after the default boundary (09:00)', () => {
    it('passes through unchanged', () => {
      expect(eventMinutes('09:00')).toBe(540);   // exactly at boundary
      expect(eventMinutes('12:00')).toBe(720);
      expect(eventMinutes('21:00')).toBe(1260);
      expect(eventMinutes('23:59')).toBe(1439);
    });
  });

  describe('times before the boundary → next-day overflow', () => {
    it('adds 1440 to midnight', () => {
      expect(eventMinutes('00:00')).toBe(1440);  // 0 + 1440
    });

    it('adds 1440 to 1 AM', () => {
      expect(eventMinutes('01:00')).toBe(1500);  // 60 + 1440
    });

    it('adds 1440 to just before boundary', () => {
      expect(eventMinutes('08:59')).toBe(539 + 1440);  // 1979
    });
  });

  describe('critical ordering invariant', () => {
    it('01:00 (next day) sorts after 21:00 (same day)', () => {
      expect(eventMinutes('21:00')).toBeLessThan(eventMinutes('01:00'));
      // 1260 < 1500 ✓
    });

    it('maintains monotonic order across midnight', () => {
      const times = ['20:00', '22:00', '23:59', '00:00', '01:00', '03:00', '08:00'];
      const minutes = times.map(t => eventMinutes(t));
      for (let i = 1; i < minutes.length; i++) {
        expect(minutes[i]).toBeGreaterThan(minutes[i - 1]);
      }
    });
  });

  describe('custom boundary', () => {
    it('respects a different boundary hour', () => {
      expect(eventMinutes('08:00', '06:00')).toBe(480);          // ≥ 360, no wrap
      expect(eventMinutes('05:59', '06:00')).toBe(359 + 1440);   // < 360, wrap
    });
  });

  describe('12h format input', () => {
    it('handles 12h strings correctly', () => {
      expect(eventMinutes('9:00 PM')).toBe(1260);
      expect(eventMinutes('1:00 AM')).toBe(1500);  // next-day
    });
  });
});

// ─── formatEventMinutes ───────────────────────────────────────────────────────

describe('formatEventMinutes', () => {
  it('formats same-day times without suffix', () => {
    expect(formatEventMinutes(540)).toBe('09:00');
    expect(formatEventMinutes(1260)).toBe('21:00');
    expect(formatEventMinutes(1439)).toBe('23:59');
    expect(formatEventMinutes(0)).toBe('00:00');
  });

  it('formats next-day times with (+1) suffix', () => {
    expect(formatEventMinutes(1440)).toBe('00:00 (+1)');
    expect(formatEventMinutes(1500)).toBe('01:00 (+1)');
    expect(formatEventMinutes(1979)).toBe('08:59 (+1)');
  });

  it('round-trips with eventMinutes for same-day times', () => {
    expect(formatEventMinutes(eventMinutes('21:00'))).toBe('21:00');
    expect(formatEventMinutes(eventMinutes('09:00'))).toBe('09:00');
    expect(formatEventMinutes(eventMinutes('23:59'))).toBe('23:59');
  });

  it('round-trips with eventMinutes for next-day times', () => {
    expect(formatEventMinutes(eventMinutes('01:00'))).toBe('01:00 (+1)');
    expect(formatEventMinutes(eventMinutes('00:00'))).toBe('00:00 (+1)');
  });
});
