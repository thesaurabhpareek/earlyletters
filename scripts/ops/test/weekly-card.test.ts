// BL-2102 (FR-BKO-09, FR-BKO-13, FR-BKO-16): the weekly request clock. Run: npm run test:functions
// The log here is fictional: tickets, kinds and dates only, which is all the runbook lets the log hold.
import assert from 'node:assert/strict';
import { buildCard, cardRow, FIELDS, HOLDER_ONLY, KINDS, LogError, order, parseDate, parseLog } from '../lib/weekly-card.ts';

const TODAY = '2026-12-14';
const HEAD = 'ticket,kind,channel,received,acknowledged,verified,extended,completed,due,legal_date,next_action,verified_by,outcome';
// A ticket carries its received date (runbook section 1), so the helper writes that date into it.
const row = (ticket: string, kind: string, received: string, more: Partial<Record<'acknowledged' | 'extended' | 'completed' | 'legal_date', string>> = {}) =>
  [ticket.replace(/^DREQ-\d{8}/, `DREQ-${received.replaceAll('-', '')}`), kind, 'email', received, more.acknowledged ?? received, '', more.extended ?? '', more.completed ?? '', '', more.legal_date ?? '', '', '', ''].join(',');
const log = (...rows: string[]) => [HEAD, ...rows].join('\n');
const card = (...rows: string[]) => buildCard(log(...rows), TODAY);
const day = (n: number) => new Date(parseDate(TODAY)! - n * 86_400_000).toISOString().slice(0, 10);
const plus = (d: string, n: number) => new Date(parseDate(d)! + n * 86_400_000).toISOString().slice(0, 10);
// Runbook section 0, safety row: the pointer to help, not the section 1 reply; no data-request process that day.
const SAFETY_FIRST = 'first message not logged: send the pointer to help today, not the section 1 reply: local emergency services and the help the app shows by region in Settings, If you are struggling; start no data-request process today and answer the data request afterwards; log it';
const FIRST_REPLY = 'first reply not logged: send what its section 0 row says today, the section 1 first reply unless the row says otherwise, and log it';
// What the card may print (the last test below): tickets, kinds, numbers, dates and plain words.
const CARD_LINE = /^\|[ A-Za-z0-9_:;,.'|-]*\|$/;

Deno.test('[FR-BKO-09] a request at day 35 or later is listed first, ahead of one whose next action date is sooner', () => {
  const c = card(
    row('DREQ-20261212-1', 'see_export', day(2)), // day 2: next action is the day-7 follow-up, in 5 days
    row('DREQ-20261108-1', 'withdraw_sync', day(36)), // day 36: next action is before day 45, in 8 days
    row('DREQ-20261129-1', 'correct', day(15)),
  );
  assert.deepEqual(c.rows.map((r) => r.ticket), ['DREQ-20261108-1', 'DREQ-20261212-1', 'DREQ-20261129-1']);
  assert.equal(c.rows[0].urgent, true);
  assert.match(c.lines[0], /3 open, 1 to act on first/);
  // Whatever order the log is in, and in both directions of the comparison.
  const [late, soon] = [c.rows[0], c.rows[1]];
  assert.ok(soon.nextActionDate < late.nextActionDate, 'the fixture puts the late row behind on date');
  assert.ok(order(late, soon) < 0 && order(soon, late) > 0);
  const reversed = card(row('DREQ-20261129-1', 'correct', day(15)), row('DREQ-20261212-1', 'see_export', day(2)), row('DREQ-20261108-1', 'withdraw_sync', day(36)));
  assert.equal(reversed.rows[0].ticket, 'DREQ-20261108-1');
});

Deno.test('[FR-BKO-09] several late requests are oldest first', () => {
  const c = card(row('DREQ-20261108-1', 'see_export', day(36)), row('DREQ-20261103-1', 'correct', day(41)), row('DREQ-20261106-1', 'other', day(38)));
  assert.deepEqual(c.rows.map((r) => r.day), [41, 38, 36]);
});

Deno.test('[FR-BKO-09] due is received plus 45 days, and the next action date walks the day 7, 30 and 40 follow-ups', () => {
  const t = parseDate(TODAY)!;
  const at = (n: number) => cardRow(parseLog(log(row('DREQ-20261101-1', 'see_export', day(n))))[0], t);
  assert.equal(at(0).due, '2027-01-28');
  assert.deepEqual([at(0), at(7), at(8), at(31)].map((r) => [r.day, r.nextAction]), [
    [0, 'day 7 follow-up'],
    [7, 'day 7 follow-up'],
    [8, 'day 30 follow-up'],
    [31, 'day 40 follow-up'],
  ]);
  assert.equal(at(8).nextActionDate, new Date(parseDate(day(8))! + 30 * 86_400_000).toISOString().slice(0, 10));
});

Deno.test('[FR-BKO-09] from day 35 the card asks for the extension notice before day 45, dated day 44', () => {
  const r = card(row('DREQ-20261108-1', 'see_export', day(35))).rows[0];
  assert.equal(r.nextAction, 'finish, or send the extension notice with its reason before day 45');
  assert.equal(r.nextActionDate, new Date(parseDate(day(35))! + 44 * 86_400_000).toISOString().slice(0, 10));
});

Deno.test('[FR-BKO-09] past day 45 with no extension is a P0 for counsel today; an extension moves the due date to day 90', () => {
  const late = card(row('DREQ-20261025-1', 'see_export', day(46))).rows[0];
  assert.equal(late.nextAction, 'P0: past day 45 with no extension notice; to counsel today');
  assert.equal(late.nextActionDate, TODAY);
  const ext = card(row('DREQ-20261025-1', 'see_export', day(46), { extended: day(40) })).rows[0];
  assert.equal(ext.due, new Date(parseDate(day(46))! + 90 * 86_400_000).toISOString().slice(0, 10));
  assert.equal(ext.nextAction, 'due: reply with what was done');
  assert.equal(ext.urgent, true, 'still day 35 or later, so still listed first');
});

Deno.test('[FR-BKO-09] a completed request is off the card; an empty card says so', () => {
  const c = card(row('DREQ-20261101-1', 'see_export', day(20), { completed: day(3) }));
  assert.equal(c.rows.length, 0);
  assert.match(c.lines.at(-1)!, /none open/);
});

Deno.test('[FR-BKO-13] a request read on an earlier day with no first reply logged is flagged for today, with the message its kind needs', () => {
  const r = card(row('DREQ-20261212-1', 'abuse_report', day(2), { acknowledged: '' })).rows[0];
  assert.equal(r.nextAction, 'first reply not logged: send what its section 0 row says today, the section 1 first reply unless the row says otherwise, and log it');
  assert.equal(r.nextActionDate, TODAY);
  const safety = card(row('DREQ-20261212-1', 'safety', day(2), { acknowledged: '' })).rows[0];
  assert.equal(safety.nextAction, SAFETY_FIRST);
  const late = card(row('DREQ-20261108-1', 'see_export', day(36), { acknowledged: '' })).rows[0];
  assert.match(late.nextAction, /^first reply not logged: .*; then finish, or send the extension notice with its reason before day 45$/);
  assert.equal(late.urgent, true);
  assert.match(card(row('DREQ-20261030-1', 'see_export', day(45), { acknowledged: '' })).rows[0].nextAction, /; it is due today$/);
});

Deno.test('[FR-BKO-09] day 44 asks for the extension, day 45 is due today, day 46 is a P0', () => {
  const at = (n: number) => card(row('DREQ-20261030-1', 'see_export', day(n))).rows[0];
  assert.equal(at(44).nextAction, 'finish, or send the extension notice with its reason before day 45');
  assert.equal(at(44).nextActionDate, TODAY);
  assert.equal(at(45).nextAction, 'due today: reply with what was done');
  assert.equal(at(45).nextActionDate, TODAY);
  assert.equal(at(45).urgent, true);
  assert.equal(at(46).nextAction, 'P0: past day 45 with no extension notice; to counsel today');
  const ext90 = card(row('DREQ-20260915-1', 'see_export', day(90), { extended: day(50) })).rows[0];
  assert.equal(ext90.nextAction, 'due today: reply with what was done');
});

Deno.test('[FR-BKO-09] an extension notice that did not go before day 45 does not move the clock: the row stays a P0', () => {
  const r = card(row('DREQ-20261025-1', 'see_export', day(50), { extended: day(2) })).rows[0];
  assert.equal(r.nextAction, 'P0: the extension notice did not go before day 45; to counsel today');
  assert.equal(r.due, new Date(parseDate(day(50))! + 45 * 86_400_000).toISOString().slice(0, 10));
  const onDue = card(row('DREQ-20261025-1', 'see_export', day(50), { extended: day(5) })).rows[0];
  assert.equal(onDue.nextAction, 'P0: the extension notice did not go before day 45; to counsel today', 'a notice on day 45 itself is late');
  const day44 = card(row('DREQ-20261025-1', 'see_export', day(50), { extended: day(6) })).rows[0];
  assert.equal(day44.nextAction, 'due: reply with what was done', 'a notice on day 44 is in time');
});

Deno.test('[FR-BKO-09] an extended request still walks the day 30 and day 40 follow-ups before day 90', () => {
  const r = card(row('DREQ-20261117-1', 'see_export', day(27), { extended: day(17) })).rows[0];
  assert.equal(r.nextAction, 'day 30 follow-up');
  assert.equal(card(row('DREQ-20261103-1', 'see_export', day(41), { extended: day(31) })).rows[0].nextAction, 'due: reply with what was done');
});

Deno.test('[FR-BKO-09] the rows to act on first are ordered by days left, so a P0 leads an older extended row', () => {
  const c = card(row('DREQ-20260925-1', 'see_export', day(80), { extended: day(50) }), row('DREQ-20261029-1', 'see_export', day(46)), row('DREQ-20261030-1', 'see_export', day(44)));
  assert.deepEqual(c.rows.map((r) => r.day), [46, 44, 80]);
});

Deno.test('[FR-BKO-13] an abuse report stays off the 45-day clock: one fixed first reply, then with counsel, never a "what was done" reply or an extension', () => {
  for (const n of [2, 36, 45, 46, 60]) {
    const r = card(row('DREQ-20261212-1', 'abuse_report', day(n))).rows[0];
    assert.equal(r.nextAction, 'with counsel: no reply beyond the fixed first reply; change nothing on any account', String(n));
    assert.equal(r.due, '-');
    assert.equal(r.urgent, false);
    assert.doesNotMatch(r.nextAction, /extension|what was done|P0/);
  }
  const first = card(row('DREQ-20261212-1', 'abuse_report', day(46), { acknowledged: '' })).rows[0];
  assert.match(first.nextAction, /^first reply not logged: /);
  assert.doesNotMatch(first.nextAction, /extension|due today/);
});

Deno.test('[FR-BKO-13] a dispute or third-party request stays off the 45-day clock; from day 35 it is checked and stays first until it closes', () => {
  const counsel = 'with counsel: no reply beyond the fixed first reply; change nothing on any account';
  const check = "with counsel: check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date; if it is an executor, relative or guardian row (never a custody or family dispute, and never a parent or guardian who says the holder is under 18) and the email does not say the holder died or cannot act, log it under its route's kind today with the same received date and close this row; if it is an executor, relative or guardian of a living holder who cannot act, ask counsel before day 45 whether the 45 days apply (Q49)";
  const late = "with counsel: still open past day 44; check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date; if it is an executor, relative or guardian row (never a custody or family dispute, and never a parent or guardian who says the holder is under 18) and the email does not say the holder died or cannot act, log it under its route's kind today with the same received date and close this row; if it is an executor, relative or guardian of a living holder who cannot act and counsel has not said the 45 days do not apply, to counsel today (Q49); no reply beyond the fixed first reply; change nothing on any account";
  const at = (n: number, more = {}) => card(row('DREQ-20261212-1', 'dispute_or_third_party', day(n), more)).rows[0];
  for (const n of [2, 34]) {
    const r = at(n);
    assert.equal(r.nextAction, counsel, String(n));
    assert.equal(r.urgent, false, String(n));
  }
  for (const n of [35, 38, 44]) {
    const r = at(n);
    assert.equal(r.nextAction, check, String(n));
    assert.equal(r.urgent, true, String(n));
    assert.equal(r.left, 45 - n, String(n));
    assert.match(r.nextAction, /never a custody or family dispute, and never a parent or guardian who says the holder is under 18/, `${n}: the card itself limits the re-log to the executor row`);
  }
  for (const n of [45, 46, 60, 200]) {
    const r = at(n);
    assert.equal(r.nextAction, late, `${n}: an unanswered Q49 is never read as a no`);
    assert.equal(r.urgent, true, String(n));
    assert.equal(r.left, 0, String(n));
  }
  for (const n of [0, 1, 2, 34, 35, 38, 44, 45, 46, 60]) {
    const flagged = n >= 35;
    for (const r of [at(n), at(n, { acknowledged: '' }), at(n, { extended: day(Math.max(n - 1, 0)) }), at(n, { legal_date: day(Math.max(n - 1, 0)) })]) {
      assert.equal(r.due, '-', String(n));
      assert.equal(r.nextActionDate, TODAY, String(n));
      assert.equal(r.urgent, flagged, `${n}: urgent from day 35, acknowledged or not, whatever else the row holds`);
      assert.doesNotMatch(r.nextAction, /extension|what was done|P0|due today/, String(n));
      assert.equal(/; then with counsel, /.test(r.nextAction), flagged && /^first reply/.test(r.nextAction), String(n));
    }
  }
  assert.doesNotMatch(at(0, { acknowledged: '' }).nextAction, /^first reply not logged/, 'day 0 is the day it arrived');
  assert.match(at(1, { acknowledged: '' }).nextAction, /^first reply not logged: /);
  assert.match(at(2, { acknowledged: '' }).nextAction, /^first reply not logged: /);
  assert.match(at(38, { acknowledged: '' }).nextAction, /^first reply not logged: .*; then with counsel, check no request about the sender's own data/);
  assert.match(at(46, { acknowledged: '' }).nextAction, /^first reply not logged: .*; then with counsel, still open past day 44; .*to counsel today \(Q49\)/);
  const firstOnly = at(2, { acknowledged: '' }).nextAction;
  assert.equal(at(34, { acknowledged: '' }).nextAction, firstOnly, 'before day 35 an unacknowledged row shows the first reply alone');
  assert.equal(firstOnly, 'first reply not logged: send what its section 0 row says today, the section 1 first reply unless the row says otherwise, and log it');
  // A dispute row sorts with the clock rows by days left: a P0 leads; from day 45 it ties a row due today, which comes first.
  const c = card(
    row('DREQ-20261212-1', 'dispute_or_third_party', day(38)),
    row('DREQ-20261212-2', 'see_export', day(36)),
    row('DREQ-20261212-3', 'dispute_or_third_party', day(50)),
    row('DREQ-20261212-4', 'see_export', day(46)),
    row('DREQ-20261212-5', 'see_export', day(45)),
    row('DREQ-20261212-6', 'see_export', day(42)),
    row('DREQ-20261212-7', 'see_export', day(38)),
    row('DREQ-20261212-8', 'dispute_or_third_party', day(20)),
    row('DREQ-20261212-9', 'dispute_or_third_party', day(60)),
  );
  assert.deepEqual(c.rows.map((r) => [r.ticket.slice(-1), r.kind, r.day]), [
    ['4', 'see_export', 46], ['5', 'see_export', 45], ['9', 'dispute_or_third_party', 60], ['3', 'dispute_or_third_party', 50], ['6', 'see_export', 42],
    ['7', 'see_export', 38], ['1', 'dispute_or_third_party', 38], ['2', 'see_export', 36], ['8', 'dispute_or_third_party', 20],
  ], 'a P0 leads; on a tie in days left a clock row comes before a dispute row, whatever the ticket; the older of two tied rows first; one before day 35 does not lead');
  assert.match(c.lines[0], /9 open, 8 to act on first/);
});

Deno.test('[FR-BKO-16] a letter whose named date has passed goes to counsel today and is listed first', () => {
  const r = card(row('DREQ-20261101-1', 'legal_process', day(30), { legal_date: day(1) }), row('DREQ-20261108-1', 'see_export', day(36))).rows;
  assert.equal(r[0].nextAction, 'with counsel: the date the letter names has passed; to counsel today');
  assert.equal(r[0].urgent, true);
  assert.equal(r[0].due, '-');
});

Deno.test('[FR-BKO-13] every closed-list field, a repeated column, an extra cell and a received date after today stop the card; a BOM does not', () => {
  const base = row('DREQ-20261212-1', 'see_export', day(2));
  const cells = base.split(',');
  const at = (i: number, v: string) => log(cells.map((c, j) => (j === i ? v : c)).join(','));
  for (const [i, field] of [[2, 'channel'], [11, 'verified_by'], [12, 'outcome']] as const) {
    assert.throws(() => buildCard(at(i, 'asha'), TODAY), (e) => e instanceof LogError && new RegExp(`line 2, ${field}`).test(e.message), field);
  }
  assert.throws(() => buildCard([HEAD + ',kind', base + ',other'].join('\n'), TODAY), (e) => e instanceof LogError && /twice/.test(e.message));
  assert.throws(() => buildCard(log(base + ',asha said hi'), TODAY), (e) => e instanceof LogError && /cells for/.test(e.message));
  const ahead = row('DREQ-20261216-1', 'see_export', '2026-12-16', { acknowledged: '' });
  assert.throws(() => buildCard(log(ahead), TODAY), (e) => e instanceof LogError && /received: after today/.test(e.message));
  assert.equal(buildCard('\uFEFF' + log(base), TODAY).rows.length, 1);
});


Deno.test('[FR-BKO-13] an impossible date, a step dated after today or before received, or a ticket whose date is not received stops the card', () => {
  assert.throws(() => card(row('DREQ-20260230-1', 'see_export', '2026-02-30')), (e) => e instanceof LogError && /line 2, /.test(e.message));
  assert.throws(() => card(row('DREQ-20261212-1', 'see_export', day(2), { extended: '2026-12-20' })), (e) => e instanceof LogError && /extended: after today/.test(e.message));
  assert.throws(() => card(row('DREQ-20261212-1', 'see_export', day(2), { acknowledged: day(3) })), (e) => e instanceof LogError && /acknowledged: before received/.test(e.message));
  assert.throws(() => card(row('DREQ-20261101-1', 'see_export', day(20), { completed: '2026-12-31' })), (e) => e instanceof LogError && /completed: after today/.test(e.message), 'a closed row is checked too');
  const mismatch = log(row('DREQ-20261212-1', 'see_export', day(2))).replace(/DREQ-\d{8}-1/, 'DREQ-20261201-1');
  assert.throws(() => buildCard(mismatch, TODAY), (e) => e instanceof LogError && /ticket: its date is not the received date/.test(e.message));
});

Deno.test('[FR-BKO-13] the log holds no free text: an unknown column, an unknown kind or text in a date field stops the card', () => {
  assert.throws(() => card(row('DREQ-20261212-1', 'complaint', day(2))), (e) => e instanceof LogError && /line 2, kind/.test(e.message));
  assert.throws(() => buildCard([HEAD + ',note', row('DREQ-20261212-1', 'safety', day(2)) + ',asha said'].join('\n'), TODAY), (e) => e instanceof LogError && /column 14/.test(e.message));
  assert.throws(() => buildCard([HEAD.replace('outcome', 'email'), row('DREQ-20261212-1', 'safety', day(2))].join('\n'), TODAY), LogError);
  const bad = row('DREQ-20261212-1', 'safety', day(2)).replace(day(2) + ',' + day(2), `${day(2)},asha wrote back`);
  assert.throws(() => card(bad), (e) => e instanceof LogError && /line 2, acknowledged/.test(e.message));
});

Deno.test('[FR-BKO-13] an error names the line and the field, never the value it refused', () => {
  try {
    card(row('DREQ-20261212-1', 'asha-family-request', day(2)));
    assert.fail('expected a LogError');
  } catch (e) {
    assert.ok(e instanceof LogError);
    assert.doesNotMatch(e.message, /asha/i);
  }
});

Deno.test('[FR-BKO-13] a ticket that is not DREQ-yyyymmdd-n, a repeated ticket, or a received date after today stops the card', () => {
  assert.throws(() => card(row('asha@example.com', 'safety', day(2))), LogError);
  assert.throws(() => card(row('DREQ-20261212-1', 'safety', day(2)), row('DREQ-20261212-1', 'other', day(2))), LogError);
  assert.throws(() => card(row('DREQ-20261216-1', 'safety', '2026-12-16')), LogError);
});

Deno.test('[FR-BKO-16] a letter from a lawyer, court or the police stays with counsel: no reply step, off the 45-day clock, its named date shown', () => {
  const named = card(row('DREQ-20261101-1', 'legal_process', day(44), { legal_date: '2027-01-05' })).rows[0];
  assert.equal(named.nextAction, 'with counsel: no reply until counsel says so; the letter names this date');
  assert.equal(named.nextActionDate, '2027-01-05');
  assert.equal(named.due, '-');
  assert.equal(named.urgent, false);
  const unnamed = card(row('DREQ-20261212-1', 'legal_process', day(2))).rows[0];
  assert.match(unnamed.nextAction, /^with counsel: no reply until counsel says so/);
});

Deno.test('[FR-BKO-09] the card prints tickets, kinds, numbers and dates only', () => {
  const c = card(row('DREQ-20261108-1', 'withdraw_sync', day(36)), row('DREQ-20261212-1', 'legal_process', day(2)));
  for (const line of c.lines.slice(2)) assert.match(line, /^\|[ A-Za-z0-9_:;,.'|-]*\|$/);
  assert.equal(c.lines[2], '| ticket | kind | day | due | next action date | next action |');
});

Deno.test('[FR-BKO-13] FU-15a: a safety first message follows its section 0 row: the pointer to help, not the section 1 reply', () => {
  for (const n of [1, 2, 34]) {
    const r = card(row('DREQ-20261212-1', 'safety', day(n), { acknowledged: '' })).rows[0];
    assert.equal(r.nextAction, SAFETY_FIRST, String(n));
    assert.equal(r.nextActionDate, TODAY);
  }
  const s = SAFETY_FIRST;
  assert.match(s, /pointer to help today, not the section 1 reply/);
  assert.match(s, /local emergency services/);
  assert.match(s, /Settings, If you are struggling/);
  assert.match(s, /start no data-request process today and answer the data request afterwards/);
  assert.doesNotMatch(s, /first reply/, 'the section 1 first reply is not the first message for safety');
  // On the clock like any request: from day 35 the clock step follows the pointer to help.
  assert.equal(card(row('DREQ-20261108-1', 'safety', day(36), { acknowledged: '' })).rows[0].nextAction, `${SAFETY_FIRST}; then finish, or send the extension notice with its reason before day 45`);
  // Every other kind that can reach the first-message step defers to its own section 0 row.
  for (const kind of ['delete_account', 'withdraw_sync', 'see_export', 'correct', 'under_18', 'testflight_feedback', 'email_list', 'abuse_report', 'dispute_or_third_party', 'other']) {
    const r = card(row('DREQ-20261212-1', kind, day(2), { acknowledged: '' })).rows[0];
    assert.equal(r.nextAction, FIRST_REPLY, kind);
  }
  // legal_process never gets a first-message step: no reply until counsel says so.
  assert.doesNotMatch(card(row('DREQ-20261212-1', 'legal_process', day(2), { acknowledged: '' })).rows[0].nextAction, /first|send/);
  for (const line of card(row('DREQ-20261212-1', 'safety', day(2), { acknowledged: '' })).lines.slice(2)) assert.match(line, CARD_LINE);
});

Deno.test('[FR-BKO-16] FU-15a: a legal_process row turns urgent the day after its legal_date, not on it or before it', () => {
  const received = day(30);
  const at = (todayIso: string) => buildCard(log(row('DREQ-20261114-1', 'legal_process', received, { legal_date: TODAY })), todayIso).rows[0];
  const before = at(day(1));
  assert.equal(before.urgent, false);
  assert.equal(before.nextActionDate, TODAY, 'the day before: the named date is next');
  assert.equal(before.nextAction, 'with counsel: no reply until counsel says so; the letter names this date');
  assert.equal(before.due, '-');
  assert.equal(before.left, Number.POSITIVE_INFINITY);
  const on = at(TODAY);
  assert.equal(on.urgent, false, 'on the named date it has not passed yet (section 11: once that date has passed)');
  assert.equal(on.nextActionDate, TODAY);
  assert.equal(on.nextAction, 'with counsel: no reply until counsel says so; the letter names this date');
  assert.equal(on.left, Number.POSITIVE_INFINITY);
  const after = at(plus(TODAY, 1));
  assert.equal(after.urgent, true);
  assert.equal(after.nextActionDate, plus(TODAY, 1), 'the day after: to counsel that day');
  assert.equal(after.nextAction, 'with counsel: the date the letter names has passed; to counsel today');
  assert.equal(after.due, '-');
  assert.equal(after.left, -1);
  // Listed first once passed, and ahead of a row on the clock at day 36 (fewer days left).
  const c = buildCard(log(row('DREQ-20261114-1', 'legal_process', received, { legal_date: TODAY }), row('DREQ-20261108-1', 'see_export', day(36))), plus(TODAY, 1));
  assert.deepEqual(c.rows.map((r) => r.kind), ['legal_process', 'see_export']);
  assert.match(c.lines[0], /2 open, 2 to act on first/);
  // None of the three ever asks for a reply, an extension or a P0: the row stays with counsel.
  for (const r of [before, on, after]) assert.doesNotMatch(r.nextAction, /extension|what was done|P0|first reply/);
});

Deno.test('[FR-BKO-09] FU-15a: the exact P0 and due wording on the boundary days, with no extension, a timely one and a late one', () => {
  const at = (n: number, more = {}) => card(row('DREQ-20261030-1', 'see_export', day(n), more)).rows[0];
  // No extension: day 45 is due today, day 46 the P0.
  assert.equal(at(45).nextAction, 'due today: reply with what was done');
  const p0 = at(46);
  assert.equal(p0.nextAction, 'P0: past day 45 with no extension notice; to counsel today');
  assert.deepEqual([p0.nextActionDate, p0.urgent, p0.left, p0.due], [TODAY, true, -1, plus(day(46), 45)]);
  assert.equal(at(46, { acknowledged: '' }).nextAction, 'P0: past day 45 with no extension notice; to counsel today', 'the P0 leads even with no first reply logged');
  // A notice on day 44 counts: day 89 walks to the day-90 due date, day 90 is due today, day 91 is the extended P0.
  const ext = (n: number, more = {}) => at(n, { extended: plus(day(n), 44), ...more });
  const d89 = ext(89);
  assert.deepEqual([d89.nextAction, d89.nextActionDate, d89.urgent, d89.left], ['due: reply with what was done', plus(day(89), 90), true, 1]);
  const d90 = ext(90);
  assert.deepEqual([d90.nextAction, d90.nextActionDate, d90.left, d90.due], ['due today: reply with what was done', TODAY, 0, TODAY]);
  const d91 = ext(91);
  assert.equal(d91.nextAction, 'P0: past the extended due date; to counsel today');
  assert.deepEqual([d91.nextActionDate, d91.urgent, d91.left, d91.due], [TODAY, true, -1, plus(day(91), 90)]);
  assert.equal(ext(91, { acknowledged: '' }).nextAction, 'P0: past the extended due date; to counsel today');
  // With no first reply logged, an extended row says only the first reply until its day 90, which is due today.
  assert.equal(ext(89, { acknowledged: '' }).nextAction, FIRST_REPLY);
  assert.equal(ext(90, { acknowledged: '' }).nextAction, `${FIRST_REPLY}; it is due today`);
  assert.equal(at(45, { acknowledged: '' }).nextAction, `${FIRST_REPLY}; it is due today`);
  assert.equal(at(44, { acknowledged: '' }).nextAction, `${FIRST_REPLY}; then finish, or send the extension notice with its reason before day 45`);
  // A notice on day 45 is late: day 45 is still due today, day 46 is the late-notice P0 and the due date stays day 45.
  const late = (n: number) => at(n, { extended: plus(day(n), 45) });
  assert.equal(late(45).nextAction, 'due today: reply with what was done');
  assert.equal(late(45).due, TODAY);
  const l46 = late(46);
  assert.equal(l46.nextAction, 'P0: the extension notice did not go before day 45; to counsel today');
  assert.deepEqual([l46.nextActionDate, l46.urgent, l46.left, l46.due], [TODAY, true, -1, plus(day(46), 45)]);
});

Deno.test('[FR-BKO-09] FU-15a: an under_18 row is flagged from day 10, the under-13 internal target, and its 45-day clock is unchanged', () => {
  const at = (n: number, more = {}) => card(row('DREQ-20261204-1', 'under_18', day(n), more)).rows[0];
  const before = 'day 10 under-13 internal target: if the holder is under 13, finish Route 4 by then; opening the deletion waits on BL-551: follow underage-account.md step 4, and never delete a user in the dashboard; an internal target, not the 45-day due date';
  const today = 'under-13 internal target: day 10 is today; if the holder is under 13, finish Route 4 today; opening the deletion waits on BL-551: follow underage-account.md step 4, and never delete a user in the dashboard; an internal target, not the 45-day due date';
  const passed = 'under-13 internal target: day 10 has passed; if the holder is under 13, finish Route 4 today; opening the deletion waits on BL-551: follow underage-account.md step 4, and never delete a user in the dashboard; an internal target, not the 45-day due date';
  // Day 7 is still the first follow-up; days 8 and 9 point at day 10.
  assert.deepEqual([at(7).nextAction, at(7).urgent], [`day 7 follow-up; ${HOLDER_ONLY}`, false]);
  const d9 = at(9);
  assert.deepEqual([d9.nextAction, d9.nextActionDate, d9.urgent], [before, plus(day(9), 10), false]);
  assert.equal(at(8).nextActionDate, plus(day(8), 10));
  const d10 = at(10);
  assert.deepEqual([d10.nextAction, d10.nextActionDate, d10.urgent], [today, TODAY, true]);
  const d11 = at(11);
  assert.deepEqual([d11.nextAction, d11.nextActionDate, d11.urgent], [`${passed}; then day 30 follow-up; ${HOLDER_ONLY}`, TODAY, true]);
  for (const r of [d9, d10, d11]) {
    assert.match(r.nextAction, /an internal target, not the 45-day due date/);
    assert.equal(r.due, plus(day(r.day), 45), `${r.day}: the 45-day due date stays`);
    assert.equal(r.left, 45 - r.day, String(r.day));
  }
  // The clock steps still follow the target, and the P0 wording is the clock's own.
  assert.equal(at(36).nextAction, `${passed}; then finish, or send the extension notice with its reason before day 45; ${HOLDER_ONLY}`);
  assert.equal(at(45).nextAction, `${passed}; then due today: reply with what was done; ${HOLDER_ONLY}`);
  assert.equal(at(46).nextAction, 'P0: past day 45 with no extension notice; to counsel today');
  assert.equal(at(46).left, -1);
  // With no first reply logged, the first reply goes first, then the target.
  assert.equal(at(9, { acknowledged: '' }).nextAction, FIRST_REPLY);
  assert.equal(at(9, { acknowledged: '' }).urgent, false);
  assert.equal(at(10, { acknowledged: '' }).nextAction, `${FIRST_REPLY}; then ${today}`);
  assert.equal(at(11, { acknowledged: '' }).nextAction, `${FIRST_REPLY}; then ${passed}`);
  // Other kinds keep their walk: day 10 is not a step for them.
  assert.deepEqual([card(row('DREQ-20261204-1', 'see_export', day(11))).rows[0].nextAction, card(row('DREQ-20261204-1', 'see_export', day(11))).rows[0].urgent], ['day 30 follow-up', false]);
  assert.equal(card(row('DREQ-20261204-1', 'see_export', day(9))).rows[0].nextAction, 'day 30 follow-up');
  // Listed first from day 10, behind rows with fewer days left; the card counts it and stays printable.
  const c = card(row('DREQ-20261204-1', 'under_18', day(10)), row('DREQ-20261205-1', 'under_18', day(9)), row('DREQ-20261108-1', 'see_export', day(36)));
  assert.deepEqual(c.rows.map((r) => [r.kind, r.day]), [['see_export', 36], ['under_18', 10], ['under_18', 9]]);
  assert.match(c.lines[0], /3 open, 2 to act on first/);
  for (const line of c.lines.slice(2)) assert.match(line, CARD_LINE);
});

// BL-237: the request log of record for 1.0 is this CSV file (runbook section 1; TDD 10 section 7). The card and the
// runbook must name the same columns, so a founder who copies the runbook's header line gets a log the card reads.
Deno.test('[FR-BKO-09] BL-237: the log columns are pinned, and the runbook header line is exactly the columns the card reads', () => {
  assert.deepEqual([...FIELDS], [
    'ticket', 'kind', 'channel', 'received', 'acknowledged', 'verified', 'extended', 'completed', 'due', 'legal_date',
    'next_action', 'verified_by', 'outcome',
  ]);
  const runbook = Deno.readTextFileSync(new URL('../../../docs/ops/runbooks/data-requests-by-email.md', import.meta.url));
  const header = FIELDS.join(',');
  const lines = runbook.split('\n').map((l) => l.trim());
  assert.ok(lines.includes(header), 'section 1 gives the header line, spelled as the card reads it');
  assert.equal(HEAD, header, 'the fixtures in this file use the same header');
  // A log that starts with that line and one fictional row reads.
  assert.equal(buildCard([header, row('DREQ-20261212-1', 'see_export', day(2))].join('\n'), TODAY).rows.length, 1);
  // The runbook names the kinds the card reads, and calls the file the log of record.
  for (const kind of KINDS) assert.ok(runbook.includes(`\`${kind}\``), kind);
  assert.match(runbook, /privacy_requests` log of record for 1\.0/);
  assert.match(runbook, /TDD 10 section 7/);
});

Deno.test('[FR-BKO-13] BL-237: a safety row with no first message logged asks for the pointer to help from day 0 and is listed first', () => {
  for (const n of [0, 1, 2, 34]) {
    const r = card(row('DREQ-20261212-1', 'safety', day(n), { acknowledged: '' })).rows[0];
    assert.equal(r.nextAction, SAFETY_FIRST, String(n));
    assert.equal(r.nextActionDate, TODAY, String(n));
    assert.equal(r.urgent, true, `${n}: urgent until the pointer to help is logged`);
    assert.doesNotMatch(r.nextAction, /follow-up/, String(n));
  }
  // Logged on day 0: the walk goes on as for any request, not urgent before day 35.
  const logged = card(row('DREQ-20261212-1', 'safety', day(0))).rows[0];
  assert.deepEqual([logged.nextAction, logged.urgent], ['day 7 follow-up', false]);
  // Other kinds still wait for day 1 before the first-message step.
  assert.deepEqual([card(row('DREQ-20261212-1', 'see_export', day(0), { acknowledged: '' })).rows[0].nextAction, card(row('DREQ-20261212-1', 'see_export', day(0), { acknowledged: '' })).rows[0].urgent], ['day 7 follow-up', false]);
  // Listed first, ahead of a row whose next action date is sooner, and counted in the headline.
  const c = card(row('DREQ-20261212-1', 'see_export', day(6)), row('DREQ-20261214-1', 'safety', day(0), { acknowledged: '' }));
  assert.deepEqual(c.rows.map((r) => r.kind), ['safety', 'see_export']);
  assert.match(c.lines[0], /2 open, 1 to act on first/);
  for (const line of c.lines.slice(2)) assert.match(line, CARD_LINE);
});

Deno.test('[FR-BKO-09] BL-237: every clock step on an under_18 row goes to the holder only, never to a parent; the P0 and the day 10 target do not carry it', () => {
  const at = (n: number, more = {}) => card(row('DREQ-20261204-1', 'under_18', day(n), more)).rows[0].nextAction;
  const holder = `; ${HOLDER_ONLY}`;
  assert.equal(HOLDER_ONLY, 'to the holder only; never to a parent (section 11)');
  assert.equal(at(2), `day 7 follow-up${holder}`);
  assert.ok(at(20).endsWith(`then day 30 follow-up${holder}`), 'day 30 follow-up');
  assert.ok(at(31).endsWith(`then day 40 follow-up${holder}`), 'day 40 follow-up');
  assert.ok(at(35).endsWith(`then finish, or send the extension notice with its reason before day 45${holder}`), 'the extension step');
  assert.ok(at(45).endsWith(`then due today: reply with what was done${holder}`), 'due today');
  assert.ok(at(44, { acknowledged: '' }).endsWith(`; then finish, or send the extension notice with its reason before day 45${holder}`), 'the extension step after the first reply');
  assert.ok(at(45, { acknowledged: '' }).endsWith(`; it is due today${holder}`), 'due today after the first reply');
  assert.ok(at(60, { extended: day(30) }).endsWith(`then due: reply with what was done${holder}`), 'an extended row');
  // Said once per row, and never on the P0 (that goes to counsel) or on the day 10 step itself.
  for (const n of [2, 20, 31, 35, 45]) assert.equal(at(n).split(HOLDER_ONLY).length, 2, String(n));
  assert.equal(at(46), 'P0: past day 45 with no extension notice; to counsel today');
  assert.doesNotMatch(at(9), /holder only/);
  assert.doesNotMatch(at(10), /holder only/);
  assert.doesNotMatch(at(5, { acknowledged: '' }), /holder only/, 'the first reply before day 35');
  // No other kind carries it.
  for (const kind of KINDS.filter((k) => k !== 'under_18')) {
    for (const n of [2, 20, 35, 45]) assert.doesNotMatch(card(row('DREQ-20261204-1', kind, day(n))).rows[0].nextAction, /holder only/, `${kind} ${n}`);
  }
  // The card stays printable: only plain words, numbers and the parentheses the dispute row already prints.
  for (const line of card(row('DREQ-20261204-1', 'under_18', day(20))).lines.slice(2)) assert.match(line, /^\|[ A-Za-z0-9_:;,.'()|-]*\|$/);
});

Deno.test('[FR-BKO-09] BL-237: the day 10 under_18 line names BL-551, underage-account.md step 4 and the dashboard rule, and calls 45 days the due date, not a legal clock', () => {
  const at = (n: number, more = {}) => card(row('DREQ-20261204-1', 'under_18', day(n), more)).rows[0].nextAction;
  for (const [n, more] of [[8, {}], [9, {}], [10, {}], [11, {}], [36, {}], [45, {}], [10, { acknowledged: '' }]] as const) {
    const a = at(n, more);
    assert.match(a, /opening the deletion waits on BL-551: follow underage-account\.md step 4, and never delete a user in the dashboard/, String(n));
    assert.match(a, /an internal target, not the 45-day due date/, String(n));
    assert.doesNotMatch(a, /legal/, `${n}: whether 45 days is a legal limit here is for counsel`);
  }
  for (const line of card(row('DREQ-20261204-1', 'under_18', day(10))).lines.slice(2)) assert.match(line, CARD_LINE);
});

Deno.test('[FR-BKO-13] BL-237: an under_18 row with no first reply on day 35 or later reads first reply, then the day 10 target, then the clock step', () => {
  const passed = 'under-13 internal target: day 10 has passed; if the holder is under 13, finish Route 4 today; opening the deletion waits on BL-551: follow underage-account.md step 4, and never delete a user in the dashboard; an internal target, not the 45-day due date';
  const d36 = card(row('DREQ-20261108-1', 'under_18', day(36), { acknowledged: '' })).rows[0];
  assert.equal(d36.nextAction, `${FIRST_REPLY}; then ${passed}; then finish, or send the extension notice with its reason before day 45; ${HOLDER_ONLY}`);
  assert.deepEqual([d36.nextActionDate, d36.urgent], [TODAY, true]);
  const a = d36.nextAction;
  assert.ok(a.indexOf(FIRST_REPLY) === 0 && a.indexOf(passed) > 0 && a.indexOf(passed) < a.indexOf('then finish, or send the extension notice'), 'first reply, target, clock step');
  assert.equal(card(row('DREQ-20261030-1', 'under_18', day(45), { acknowledged: '' })).rows[0].nextAction, `${FIRST_REPLY}; then ${passed}; it is due today; ${HOLDER_ONLY}`);
  // Day 46 is the P0 alone, as for any request.
  assert.equal(card(row('DREQ-20261029-1', 'under_18', day(46), { acknowledged: '' })).rows[0].nextAction, 'P0: past day 45 with no extension notice; to counsel today');
});

Deno.test('[FR-BKO-13] BL-237: from day 45 a dispute row still repeats the executor re-log and the own-data split, with the same exclusions as days 35 to 44', () => {
  for (const n of [35, 44, 45, 46, 60, 200]) {
    const a = card(row('DREQ-20261212-1', 'dispute_or_third_party', day(n))).rows[0].nextAction;
    assert.match(a, /check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date/, String(n));
    assert.match(a, /if it is an executor, relative or guardian row \(never a custody or family dispute, and never a parent or guardian who says the holder is under 18\) and the email does not say the holder died or cannot act, log it under its route's kind today with the same received date and close this row/, String(n));
    assert.doesNotMatch(a, /extension|what was done|P0|due today/, String(n));
  }
});
