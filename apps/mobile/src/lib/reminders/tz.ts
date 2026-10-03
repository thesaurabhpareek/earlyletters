/**
 * Wall-clock time in a named time zone (IANA), pure and testable in Node.
 *
 * Reminders are chosen as local wall-clock times ("8:30 PM"), so the planner
 * works in calendar dates and minutes of the day, and only turns them into an
 * instant at the edge. Daylight saving and travel are handled here, never by
 * adding 24 hours to a timestamp.
 */

export interface CalendarDate {
  y: number;
  m: number; // 1..12
  d: number; // 1..31
}

export interface LocalDateTime extends CalendarDate {
  hh: number; // 0..23
  mm: number; // 0..59
}

const DAY_MS = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True when the runtime knows this IANA zone. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock date and time at an instant, in a zone. */
export function zonedParts(epochMs: number, timeZone: string): LocalDateTime & { ss: number } {
  const parts = formatter(timeZone).formatToParts(new Date(epochMs));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hh = n('hour');
  return { y: n('year'), m: n('month'), d: n('day'), hh: hh === 24 ? 0 : hh, mm: n('minute'), ss: n('second') };
}

/** UTC offset of the zone at an instant, in minutes (Los Angeles in summer: -420). */
export function offsetMinutes(epochMs: number, timeZone: string): number {
  const p = zonedParts(epochMs, timeZone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  const floored = Math.floor(epochMs / 1000) * 1000;
  return Math.round((asUtc - floored) / 60_000);
}

/**
 * The instant a wall-clock time happens in a zone. Two passes settle the
 * offset across a daylight-saving change. A time that does not exist (the
 * skipped hour in spring) lands just after the gap; a repeated time (autumn)
 * resolves to its first occurrence. Reminders live between 07:00 and 21:30,
 * so neither case reaches a real slot.
 */
export function zonedToEpoch(local: LocalDateTime, timeZone: string): number {
  const asUtc = Date.UTC(local.y, local.m - 1, local.d, local.hh, local.mm);
  const first = asUtc - offsetMinutes(asUtc, timeZone) * 60_000;
  const second = asUtc - offsetMinutes(first, timeZone) * 60_000;
  if (second === first) return first;
  // Ambiguous or skipped: prefer the earlier candidate that still reads as the asked time.
  const candidates = [Math.min(first, second), Math.max(first, second)];
  for (const t of candidates) {
    const p = zonedParts(t, timeZone);
    if (p.hh === local.hh && p.mm === local.mm && p.d === local.d) return t;
  }
  return Math.max(first, second);
}

// ── Calendar dates (no time zone at all) ─────────────────────────────────

export function dayNumber(date: CalendarDate): number {
  return Date.UTC(date.y, date.m - 1, date.d) / DAY_MS;
}

export function fromDayNumber(n: number): CalendarDate {
  const t = new Date(n * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(dayNumber(date) + days);
}

/** 0 = Sunday .. 6 = Saturday, like Date.getDay(). */
export function weekdayOf(date: CalendarDate): number {
  return new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isoDate(date: CalendarDate): string {
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

export function parseIsoDate(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const date = { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  if (date.m < 1 || date.m > 12 || date.d < 1 || date.d > daysInMonth(date.y, date.m)) return null;
  return date;
}

/**
 * The day a child turns `months` months old, the way parents count it and
 * the way packages/core ageOn counts it: the same day of the month, clamped
 * to the month's last day (born on the 31st: the 30th in a 30-day month,
 * the 28th or 29th in February).
 */
export function monthDay(birth: CalendarDate, months: number): CalendarDate {
  const index = birth.m - 1 + months;
  const y = birth.y + Math.floor(index / 12);
  const m = (((index % 12) + 12) % 12) + 1;
  return { y, m, d: Math.min(birth.d, daysInMonth(y, m)) };
}
