// BL-2102 (FR-BKO-09, FR-BKO-13, FR-BKO-16): the weekly request clock. Run: npm run test:functions
// The log here is fictional: tickets, kinds and dates only, which is all the runbook lets the log hold.
import assert from 'node:assert/strict';
import { buildCard, cardRow, LogError, order, parseDate, parseLog } from '../lib/weekly-card.ts';

const TODAY = '2026-12-14';
const HEAD = 'ticket,kind,channel,received,acknowledged,verified,extended,completed,due,legal_date,next_action,verified_by,outcome';
// A ticket carries its received date (runbook section 1), so the helper writes that date into it.
const row = (ticket: string, kind: string, received: string, more: Partial<Record<'acknowledged' | 'extended' | 'completed' | 'legal_date', string>> = {}) =>
  [ticket.replace(/^DREQ-\d{8}/, `DREQ-${received.replaceAll('-', '')}`), kind, 'email', received, more.acknowledged ?? received, '', more.extended ?? '', more.completed ?? '', '', more.legal_date ?? '', '', '', ''].join(',');
const log = (...rows: string[]) => [HEAD, ...rows].join('\n');
const card = (...rows: string[]) => buildCard(log(...rows), TODAY);
const day = (n: number) => new Date(parseDate(TODAY)! - n * 86_400_000).toISOString().slice(0, 10);

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
  assert.equal(safety.nextAction, 'first message not logged: send the pointer to help today, as the safety row says, and log it');
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
  const check = "with counsel: check no request about the sender's own data is inside it, and if one is, log it as its own row today with the same received date; if the email does not say the holder died or cannot act, log it under its route's kind today with the same received date; if the sender acts for a living holder who cannot act, ask counsel before day 45 whether the 45 days apply (Q49)";
  const late = 'with counsel: still open past day 44; if the sender acts for a living holder who cannot act and counsel has not said the 45 days do not apply, to counsel today (Q49); no reply beyond the fixed first reply; change nothing on any account';
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
  // A dispute row sorts with the clock rows by days left: a P0 leads; from day 45 it is level with a row due today.
  const c = card(
    row('DREQ-20261212-1', 'dispute_or_third_party', day(38)),
    row('DREQ-20261212-2', 'see_export', day(36)),
    row('DREQ-20261212-3', 'dispute_or_third_party', day(50)),
    row('DREQ-20261212-4', 'see_export', day(46)),
    row('DREQ-20261212-5', 'see_export', day(45)),
    row('DREQ-20261212-6', 'see_export', day(42)),
    row('DREQ-20261212-7', 'see_export', day(38)),
    row('DREQ-20261212-8', 'dispute_or_third_party', day(20)),
  );
  assert.deepEqual(c.rows.map((r) => [r.ticket.slice(-1), r.kind, r.day]), [
    ['4', 'see_export', 46], ['3', 'dispute_or_third_party', 50], ['5', 'see_export', 45], ['6', 'see_export', 42],
    ['1', 'dispute_or_third_party', 38], ['7', 'see_export', 38], ['2', 'see_export', 36], ['8', 'dispute_or_third_party', 20],
  ], 'a P0 leads; a dispute row ties a clock row on the same day; one before day 35 does not lead');
  assert.match(c.lines[0], /8 open, 7 to act on first/);
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
