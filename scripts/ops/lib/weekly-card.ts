/**
 * The weekly request clock (BL-2102; FR-BKO-09, FR-BKO-13, FR-BKO-16). Reads the request log of
 * docs/ops/runbooks/data-requests-by-email.md section 1 (a CSV file on the founder's computer) and builds the
 * data-request part of the Monday card: every open request with its day, due date, next action date and next
 * action, any request on the clock at day 35 or later (and an open dispute row at day 35 or later, an under_18 row
 * from day 10, the under-13 internal target, and a safety row with no first message logged, from day 0) listed first.
 *
 * Why a script: Privacy 10 promises a reply within 45 days (one extension if we say why). A row that passes day 45
 * with no notice is a P0 defect, and a by-hand count is how that gets missed.
 *
 * The log holds no person id, email, name, code or free text (runbook section 1). This reader enforces that: a
 * column it does not know, a kind off the list or a cell that is not its field's format stops the card (exit 2)
 * and the error names the line and the field, never the value. So the card itself prints tickets, kinds, numbers
 * and dates only.
 */

export const KINDS = [
  'delete_account', 'withdraw_sync', 'see_export', 'correct', 'under_18', 'testflight_feedback', 'email_list',
  'safety', 'abuse_report', 'dispute_or_third_party', 'legal_process', 'other',
] as const;
export const OUTCOMES = ['done', 'done_in_part', 'could_not_verify', 'cannot_be_done', 'declined', 'referred'] as const;
export const VERIFIED_BY = ['code_to_account_address', 'code_to_tester_address', 'none_needed'] as const;
const DATE_FIELDS = ['received', 'acknowledged', 'verified', 'extended', 'completed', 'due', 'legal_date', 'next_action'] as const;

/** Every field the runbook allows, and nothing else. */
export const FIELDS = ['ticket', 'kind', 'channel', ...DATE_FIELDS, 'verified_by', 'outcome'] as const;
export const REQUIRED = ['ticket', 'kind', 'received'] as const;

/** The day-numbers of the clock (runbook section 1 and section 0, "The clock"). */
export const FOLLOW_UPS = [7, 30, 40] as const;
export const DUE_DAY = 45;
export const EXTENDED_DUE_DAY = 90;
export const FIRST_DAY = 35;
/**
 * Route 4's 10 days for an under-13 holder (runbook section 11, under_18 row; underage-account.md "within 10 days of
 * learning"). The log cannot tell an under-13 holder from a 13 to 17 one, so every open under_18 row is flagged from
 * this day: a missed under-13 deletion would otherwise surface only at day 35. It is an internal target, not the
 * 45-day due date: the due date, the follow-ups and the P0 stay as they are. Whether 45 days is a legal limit for an
 * under_18 closure is a question for counsel, so the card does not call it one.
 */
export const UNDER_13_DAY = 10;

type Field = (typeof FIELDS)[number];
export type Row = Partial<Record<Field, string>> & { line: number };
export type CardRow = { ticket: string; kind: string; day: number; due: string; nextActionDate: string; nextAction: string; urgent: boolean; left: number; lead?: true };
export type Card = { today: string; rows: CardRow[]; lines: string[] };

export class LogError extends Error {}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const TICKET = /^DREQ-\d{8}-\d{1,3}$/;
const DAY_MS = 86_400_000;

export function parseDate(s: string): number | null {
  if (!ISO.test(s)) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== s ? null : t;
}
export const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (t: number, n: number) => t + n * DAY_MS;

function check(field: Field, value: string): boolean {
  if (value === '') return !(REQUIRED as readonly string[]).includes(field);
  if (field === 'ticket') return TICKET.test(value);
  if (field === 'kind') return (KINDS as readonly string[]).includes(value);
  if (field === 'channel') return value === 'email';
  if (field === 'verified_by') return (VERIFIED_BY as readonly string[]).includes(value);
  if (field === 'outcome') return (OUTCOMES as readonly string[]).includes(value);
  return parseDate(value) !== null;
}

/** Parses the log. Throws LogError naming the line and field, never the value. */
export function parseLog(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headerAt = lines.findIndex((l) => l.trim() !== '');
  if (headerAt < 0) throw new LogError('the request log is empty');
  const header = lines[headerAt].split(',').map((h) => h.trim().toLowerCase());
  header.forEach((h, i) => {
    if (!(FIELDS as readonly string[]).includes(h)) throw new LogError(`column ${i + 1} is not a field the runbook allows (section 1); the log holds nothing else`);
  });
  if (new Set(header).size !== header.length) throw new LogError('a column appears twice');
  for (const r of REQUIRED) if (!header.includes(r)) throw new LogError(`the log has no ${r} column`);
  const rows: Row[] = [];
  const seen = new Set<string>();
  lines.slice(headerAt + 1).forEach((raw, i) => {
    const line = headerAt + i + 2;
    if (raw.trim() === '') return;
    const cells = raw.split(',').map((c) => c.trim());
    if (cells.length !== header.length) throw new LogError(`line ${line} has ${cells.length} cells for ${header.length} columns (free text or a comma in a cell)`);
    const row: Row = { line };
    header.forEach((h, j) => {
      if (!check(h as Field, cells[j])) throw new LogError(`line ${line}, ${h}: not a value the runbook allows for this field`);
      if (cells[j] !== '') row[h as Field] = cells[j];
    });
    if (seen.has(row.ticket!)) throw new LogError(`line ${line}: ticket appears twice`);
    if (row.ticket!.slice(5, 13) !== row.received!.replaceAll('-', '')) throw new LogError(`line ${line}, ticket: its date is not the received date (section 1)`);
    seen.add(row.ticket!);
    rows.push(row);
  });
  return rows;
}

const isOpen = (r: Row) => !r.completed;

/** Dates that record a step already taken: none may be before `received` or after today. */
const PAST_STEPS = ['acknowledged', 'verified', 'extended', 'completed'] as const;

function checkDates(r: Row, today: number): void {
  const received = parseDate(r.received!)!;
  if (received > today) throw new LogError(`line ${r.line}, received: after today`);
  for (const f of PAST_STEPS) {
    const t = r[f] ? parseDate(r[f]!)! : null;
    if (t !== null && t > today) throw new LogError(`line ${r.line}, ${f}: after today`);
    if (t !== null && t < received) throw new LogError(`line ${r.line}, ${f}: before received`);
  }
}

/**
 * The first message for a kind (runbook section 0 rows, then section 1). The safety row's first message is the
 * pointer to help, not the section 1 reply: local emergency services and the help the app shows by region, no
 * data-request process started that day, the data request answered afterwards. Every other kind defers to its own
 * row (abuse fixed reply, M14, the under-18 refusal, the pointer to help when a third party is in danger), which is
 * the section 1 first reply unless the row says otherwise.
 */
function firstMessage(kind: string): string {
  return kind === 'safety'
    ? 'first message not logged: send the pointer to help today, not the section 1 reply: local emergency services and the help the app shows by region in Settings, If you are struggling; start no data-request process today and answer the data request afterwards; log it'
    : 'first reply not logged: send what its section 0 row says today, the section 1 first reply unless the row says otherwise, and log it';
}

/**
 * Route 4 step 4 (opening the deletion) waits on BL-551, so the day 10 line points to underage-account.md step 4 and
 * repeats section 0's rule: never delete a user in the dashboard, which cascades their letters and skips the flow.
 */
const ROUTE_4 = 'opening the deletion waits on BL-551: follow underage-account.md step 4, and never delete a user in the dashboard';
const UNDER_13_NEXT = `day 10 under-13 internal target: if the holder is under 13, finish Route 4 by then; ${ROUTE_4}; an internal target, not the 45-day due date`;
const under13 = (day: number) =>
  `under-13 internal target: day 10 ${day === UNDER_13_DAY ? 'is today' : 'has passed'}; if the holder is under 13, finish Route 4 today; ${ROUTE_4}; an internal target, not the 45-day due date`;
/**
 * The log cannot tell who sent an age report, and section 11 says none of the clock's messages on an under_18 row go
 * to a parent (IAM-R09: any of them would say the account exists). So each clock step on that row says so itself.
 */
export const HOLDER_ONLY = 'only if the holder wrote in, to the holder only; never to a parent or anyone else (section 11)';

/** One open row on the card. `today` is a UTC day. */
export function cardRow(r: Row, today: number): CardRow {
  const c = clockRow(r, today);
  // An under_18 row from day 10 is flagged for today on top of its clock step. Not a P0 row: that already goes to
  // counsel today, and its wording stays the one the clock gives.
  if (r.kind !== 'under_18' || c.day < UNDER_13_DAY || c.nextAction.startsWith('P0: ')) return c;
  const target = under13(c.day);
  // The first message still goes first (FR-BKO-13), then the target, then any clock step: the target is between them,
  // so on day 35 or later an unacknowledged row does not put the extension step ahead of the under-13 target.
  // On day 10 itself the walk's own step is the target, so it is not said twice.
  const first = firstMessage(r.kind);
  const nextAction = c.nextAction === UNDER_13_NEXT
    ? target
    : c.nextAction.startsWith(first)
      ? `${first}; then ${target}${c.nextAction.slice(first.length)}`
      : `${target}; then ${c.nextAction}`;
  return { ...c, nextActionDate: iso(today), nextAction, urgent: true };
}

function clockRow(r: Row, today: number): CardRow {
  const received = parseDate(r.received!)!;
  const day = Math.floor((today - received) / DAY_MS);
  // An extension counts only if the notice went before day 45 (DSR-R12); a later one does not move the clock.
  const extended = Boolean(r.extended) && parseDate(r.extended!)! < addDays(received, DUE_DAY);
  const lateExtension = Boolean(r.extended) && !extended;
  const dueDay = extended ? EXTENDED_DUE_DAY : DUE_DAY;
  const due = iso(addDays(received, dueDay));
  const left = dueDay - day;
  const base = { ticket: r.ticket!, kind: r.kind!, day, due, left };
  // A clock step on an under_18 row goes to the holder only (section 11). Not the P0, which goes to counsel.
  const step = (s: string) => (r.kind === 'under_18' ? `${s}; ${HOLDER_ONLY}` : s);
  const offClock = { ...base, due: '-', left: Number.POSITIVE_INFINITY };

  if (r.kind === 'legal_process') {
    // FR-BKO-16, runbook section 0: no action, no disclosure, no reply until counsel says so. Not on the 45-day clock.
    const named = r.legal_date ? parseDate(r.legal_date)! : null;
    if (named !== null && named < today) {
      return { ...offClock, left: Math.floor((named - today) / DAY_MS), nextActionDate: iso(today), nextAction: 'with counsel: the date the letter names has passed; to counsel today', urgent: true };
    }
    return {
      ...offClock,
      nextActionDate: r.legal_date ?? iso(today),
      nextAction: r.legal_date ? 'with counsel: no reply until counsel says so; the letter names this date' : 'with counsel: no reply until counsel says so; log any date the letter names',
      urgent: false,
    };
  }
  if (r.kind === 'abuse_report') {
    // Runbook section 0, abuse row: one fixed reply, nothing on any account changes, the founder decides with counsel.
    // Not on the 45-day clock: a "what was done" reply or an extension notice would imply the account exists (IAM-R09).
    const first = !r.acknowledged && day >= 1;
    return {
      ...offClock,
      nextActionDate: iso(today),
      nextAction: first ? firstMessage(r.kind) : 'with counsel: no reply beyond the fixed first reply; change nothing on any account',
      urgent: false,
    };
  }
  if (r.kind === 'dispute_or_third_party') {
    // Runbook section 0: an executor, relative or guardian of a holder who died or cannot act, a parent of an under-18
    // holder, or a custody or family dispute. The sender is not the holder, so the card prompts no reply to them: a
    // "what was done" reply or an extension notice would say the account exists (IAM-R09). The exec team read it on
    // 27 Nov 2026 (not yet in a rulings file). Days 35 to 44 are an internal check: a request about the sender's own
    // data inside it, or an executor, relative or guardian row whose email does not say the holder died or cannot act,
    // is on the clock from the same day (never a custody dispute or a parent's request), and whether the 45 days apply to a living holder's guardian is COUNSEL_PACKET Q49, so that goes to
    // counsel before day 45. From day 45 the row stays first until it closes: an unanswered Q49 is never read as a no.
    const first = !r.acknowledged && day >= 1;
    const check = day >= FIRST_DAY && day < DUE_DAY;
    const late = day >= DUE_DAY;
    const counsel = check
      ? "with counsel: check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date; if it is an executor, relative or guardian row (never a custody or family dispute, and never a parent or guardian who says the holder is under 18) and the email does not say the holder died or cannot act, log it under its route's kind today with the same received date and close this row; if it is an executor, relative or guardian of a living holder who cannot act, ask counsel before day 45 whether the 45 days apply (Q49)"
      : late
        ? "with counsel: still open past day 44; check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date; if it is an executor, relative or guardian row (never a custody or family dispute, and never a parent or guardian who says the holder is under 18) and the email does not say the holder died or cannot act, log it under its route's kind today with the same received date and close this row; if it is an executor, relative or guardian of a living holder who cannot act and counsel has not said the 45 days do not apply, to counsel today (Q49); no reply beyond the fixed first reply; change nothing on any account"
        : 'with counsel: no reply beyond the fixed first reply; change nothing on any account';
    return {
      ...offClock,
      left: check ? DUE_DAY - day : late ? 0 : offClock.left,
      nextActionDate: iso(today),
      nextAction: first ? `${firstMessage(r.kind)}${check || late ? `; then ${counsel.replace(/^with counsel: /, 'with counsel, ')}` : ''}` : counsel,
      urgent: check || late,
    };
  }
  // Section 0, safety row: the first message is the pointer to help, the day it arrives. So an unacknowledged safety
  // row asks for it from day 0, not "day 7 follow-up", and is listed first until the date is logged in `acknowledged`,
  // past the due date too.
  const safetyFirst = r.kind === 'safety' && !r.acknowledged;
  if (day > dueDay) {
    const why = extended ? 'past the extended due date' : lateExtension ? 'the extension notice did not go before day 45' : 'past day 45 with no extension notice';
    // A safety row still waiting for the pointer to help keeps asking for it, and keeps leading, past its due date.
    if (safetyFirst) return { ...base, nextActionDate: iso(today), nextAction: `${firstMessage(r.kind!)}; then P0: ${why}; to counsel today`, urgent: true, lead: true };
    return { ...base, nextActionDate: iso(today), nextAction: `P0: ${why}; to counsel today`, urgent: true };
  }
  if (!r.acknowledged && (day >= 1 || safetyFirst)) {
    // FR-BKO-13: the first message goes the day it is read.
    // An extended row on its day 90 is due today too; before that an extended row needs no extension step.
    const later = day < FIRST_DAY ? '' : day === dueDay ? step('; it is due today') : extended ? '' : step('; then finish, or send the extension notice with its reason before day 45');
    return { ...base, nextActionDate: iso(today), nextAction: firstMessage(r.kind!) + later, urgent: day >= FIRST_DAY || safetyFirst, ...(safetyFirst ? { lead: true as const } : {}) };
  }
  if (day === dueDay) {
    return { ...base, nextActionDate: iso(today), nextAction: step('due today: reply with what was done'), urgent: true };
  }
  if (!extended && day >= FIRST_DAY) {
    return { ...base, nextActionDate: iso(addDays(received, DUE_DAY - 1)), nextAction: step('finish, or send the extension notice with its reason before day 45'), urgent: true };
  }
  const steps: readonly number[] = r.kind === 'under_18' ? [FOLLOW_UPS[0], UNDER_13_DAY, ...FOLLOW_UPS.slice(1)] : FOLLOW_UPS;
  const nextDay = [...steps, dueDay].find((d) => d >= day) ?? dueDay;
  const label = nextDay === UNDER_13_DAY && r.kind === 'under_18' ? UNDER_13_NEXT : step(nextDay === dueDay ? 'due: reply with what was done' : `day ${nextDay} follow-up`);
  return { ...base, nextActionDate: iso(addDays(received, nextDay)), nextAction: label, urgent: day >= FIRST_DAY };
}

/** Rows to act on first (day 35 or later on the clock, a dispute row at day 35 or later, an under_18 row from day 10, a safety row with no first message logged, or a letter's date passed): a safety row with no first message logged leads, because someone may be in danger today; then fewest days left first so a P0 comes next, a row on the clock before one off it on a tie; then the rest by next action date, then ticket. */
export function order(a: CardRow, b: CardRow): number {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (Boolean(a.lead) !== Boolean(b.lead)) return a.lead ? -1 : 1;
  // On a tie in days left, a row on the clock comes before one off it, so a request due today is never behind a dispute row.
  if (a.urgent) return a.left - b.left || Number(a.due === '-') - Number(b.due === '-') || b.day - a.day || a.ticket.localeCompare(b.ticket);
  return a.nextActionDate.localeCompare(b.nextActionDate) || a.ticket.localeCompare(b.ticket);
}

export function buildCard(text: string, todayIso: string): Card {
  const today = parseDate(todayIso);
  if (today === null) throw new LogError('--today is not a YYYY-MM-DD date');
  const rows = parseLog(text)
    .map((r) => (checkDates(r, today), r)) // closed rows too: a future `completed` would hide an open request
    .filter(isOpen)
    .map((r) => cardRow(r, today))
    .sort(order);
  const urgent = rows.filter((r) => r.urgent).length;
  const lines = [
    `Data requests, week of ${todayIso}: ${rows.length} open, ${urgent} to act on first`,
    '',
    '| ticket | kind | day | due | next action date | next action |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.ticket} | ${r.kind} | ${r.day} | ${r.due} | ${r.nextActionDate} | ${r.nextAction} |`),
  ];
  if (!rows.length) lines.push('| none open | | | | | |');
  return { today: todayIso, rows, lines };
}
