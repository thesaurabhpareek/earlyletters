/**
 * Age math for datelines and month-of-age chapters.
 * Dates are ISO calendar dates (YYYY-MM-DD), interpreted as local calendar
 * days with no time zone, so a date never shifts by one west of Greenwich.
 */

export interface Age {
  months: number;
  weeks: number; // whole weeks after the last month boundary
  days: number; // total days since birth
}

function parse(iso: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) throw new Error(`Invalid ISO date: ${iso}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function dayNumber(iso: string): number {
  const { y, m, d } = parse(iso);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Calendar-month age, the way parents count it ("16 months and 1 week"). */
export function ageOn(birthISO: string, onISO: string): Age {
  const b = parse(birthISO);
  const o = parse(onISO);
  const days = dayNumber(onISO) - dayNumber(birthISO);
  if (days < 0) return { months: 0, weeks: 0, days };

  let months = (o.y - b.y) * 12 + (o.m - b.m);
  // month anniversary, clamped for short months (born Jan 31 -> Feb 28)
  const anniversaryDay = (y: number, m: number) => Math.min(b.d, daysInMonth(y, m));
  if (o.d < anniversaryDay(o.y, o.m)) months -= 1;

  const annY = b.y + Math.floor((b.m - 1 + months) / 12);
  const annM = ((b.m - 1 + months) % 12) + 1;
  const annISO = `${annY}-${String(annM).padStart(2, '0')}-${String(anniversaryDay(annY, annM)).padStart(2, '0')}`;
  const weeks = Math.floor((dayNumber(onISO) - dayNumber(annISO)) / 7);
  return { months, weeks, days };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function ageLabel(age: Age): string {
  if (age.days < 0) return 'before birth';
  if (age.months === 0) {
    return age.days < 14 ? plural(age.days, 'day') : plural(Math.floor(age.days / 7), 'week');
  }
  const m = plural(age.months, 'month');
  return age.weeks > 0 ? `${m} and ${plural(age.weeks, 'week')}` : m;
}

/** "Tuesday, 29 September 2026. Meera is 16 months and 1 week old." */
export function dateline(onISO: string, childName: string, birthISO: string): string {
  const { y, m, d } = parse(onISO);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const age = ageOn(birthISO, onISO);
  const ageText = age.days < 0 ? `before ${childName} was born` : `${childName} is ${ageLabel(age)} old`;
  return `${weekday}, ${d} ${MONTHS[m - 1]} ${y}. ${ageText.charAt(0).toUpperCase()}${ageText.slice(1)}.`;
}

/** Book chapter for an entry: "Month 16" (0 = first month). */
export function chapterOf(birthISO: string, onISO: string): number {
  return Math.max(0, ageOn(birthISO, onISO).months);
}
