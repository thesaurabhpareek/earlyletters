/**
 * The insights engine: server aggregates plus PostHog counts in, metrics,
 * findings, anomalies and ranked backlog proposals out. Pure and
 * deterministic (test/insights.test.ts). Every string it produces is a
 * template filled with numbers, week dates and catalogue enum values; it has
 * no path by which a person's words, a name or an id could reach a report.
 *
 * Thresholds are Decisions in TRACKING_PLAN 1.2 and 1.3 unless marked A.
 */
import { K_MIN } from './hogql';
import type { Anomaly, Confidence, DeviceRow, Finding, InsightsInput, InsightsReport, Metric, Proposal } from './types';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
/** A k-safe count: null below k (0 is allowed). */
const kc = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : n === 0 || n >= K_MIN ? n : null;
};
const rate = (part: number | null, whole: number | null): number | null =>
  part === null || whole === null || whole <= 0 ? null : part / whole;
export const pct = (r: number | null, digits = 0): string => (r === null ? 'n/a' : `${(r * 100).toFixed(digits)}%`);
const fmt = (n: number | null): string => (n === null ? 'n/a' : Number.isInteger(n) ? String(n) : n.toFixed(2));
const week = (s: string) => String(s).slice(0, 10);
const CONF_WEIGHT: Record<Confidence, number> = { high: 1, medium: 0.6, low: 0.3 };

function sortedWeeks<T extends { week: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => week(a.week).localeCompare(week(b.week)));
}

/** Week start (Monday, UTC) of a YYYY-MM-DD date. */
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Device data access
// ---------------------------------------------------------------------------

class Device {
  constructor(private readonly rows: DeviceRow[]) {}

  weeks(): string[] {
    return [...new Set(this.rows.map((r) => r.week))].sort();
  }

  total(event: string, wk: string, field: 'events' | 'people' = 'events'): number | null {
    const r = this.rows.find((x) => x.event === event && !x.dim && x.week === wk);
    return r ? r[field] : null;
  }

  split(event: string, dim: string, wk: string): Map<string, { events: number; people: number }> {
    const out = new Map<string, { events: number; people: number }>();
    for (const r of this.rows) {
      if (r.event === event && r.dim === dim && r.week === wk) out.set(String(r.value), { events: r.events, people: r.people });
    }
    return out;
  }

  /** Two-way split built from separate breakdowns is not possible; this reads one dimension summed over weeks. */
  splitOver(event: string, dim: string, weeks: string[]): Map<string, number> {
    const out = new Map<string, number>();
    for (const r of this.rows) {
      if (r.event === event && r.dim === dim && weeks.includes(r.week)) out.set(String(r.value), (out.get(String(r.value)) ?? 0) + r.events);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------

export interface SeriesPoint {
  week: string;
  value: number | null;
}

/**
 * Latest point against the mean of up to 4 earlier points. Flags a change of
 * 25% or more when the baseline is at least `minBase`, and, with 3 or more
 * earlier points, only when the latest is also 2 standard deviations away.
 */
export function detectAnomaly(series: SeriesPoint[], opts: { metric: string; label: string; source: 'server' | 'device'; minBase: number; isRate?: boolean }): Anomaly | null {
  const pts = series.filter((p): p is { week: string; value: number } => p.value !== null);
  if (pts.length < 3) return null;
  const last = pts[pts.length - 1];
  const prior = pts.slice(-5, -1).map((p) => p.value);
  const mean = prior.reduce((a, b) => a + b, 0) / prior.length;
  if (!opts.isRate && mean < opts.minBase) return null;
  if (mean === 0) return null;
  const change = (last.value - mean) / mean;
  if (Math.abs(change) < 0.25) return null;
  if (prior.length >= 3) {
    const sd = Math.sqrt(prior.reduce((a, b) => a + (b - mean) ** 2, 0) / (prior.length - 1));
    if (sd > 0 && Math.abs(last.value - mean) < 2 * sd) return null;
  }
  return { metric: opts.metric, label: opts.label, week: last.week, value: last.value, baseline: mean, change, direction: change > 0 ? 'up' : 'down', source: opts.source };
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const PACK_FIX: Record<string, string> = {
  no_space: 'check free space before a download starts and say how much is needed, in the calm storage copy',
  hash_mismatch: 'check the hosted file against the manifest hash and the CDN cache headers; re-publish the pack',
  download_failed: 'resume interrupted downloads from the last chunk and retry on the next Wi-Fi connection',
  offline: 'queue the download for the next connection instead of failing',
  storage_error: 'look at the install step (rename into place) on low-storage phones',
  needs_app_update: 'keep the previous pack version in the manifest until most phones run the new app',
  no_manifest: 'check the manifest host and its cache; ship the last good manifest in the app as a fallback',
  not_in_manifest: 'publish the missing pack or stop offering its language until it is hosted',
  cancelled: 'show the pack size before the download so people choose knowingly',
};

export function computeInsights(input: InsightsInput): InsightsReport {
  const metrics: Metric[] = [];
  const findings: Finding[] = [];
  const anomalies: Anomaly[] = [];
  const proposals: Proposal[] = [];
  const current = weekStart(input.date);
  const s = input.server;
  const d = input.device ? new Device(input.device.rows) : null;
  const propose = (p: Omit<Proposal, 'score'> & { impact: number; reach: number }) => {
    const { impact, reach, ...rest } = p;
    proposals.push({ ...rest, score: Math.round(impact * Math.log10(10 + reach) * CONF_WEIGHT[p.confidence] * 100) / 100 });
  };

  // --- Server: WKF, letters per family, voices ---------------------------------
  let latestWeek: string | null = null;
  if (s) {
    const wkf = sortedWeeks(s.weekly_keeping_families.filter((r) => r.complete && week(r.week) < current));
    const lpf = sortedWeeks(s.letters_per_active_family.filter((r) => r.complete && week(r.week) < current));
    const last = wkf[wkf.length - 1];
    const prev = wkf[wkf.length - 2];
    latestWeek = last ? week(last.week) : null;
    metrics.push({ key: 'wkf', label: 'Weekly keeping families', value: kc(last?.families), previous: kc(prev?.families), unit: 'count', source: 'server', week: latestWeek });
    const spokenShare = rate(kc(last?.spoken_letters), kc(last?.letters));
    metrics.push({ key: 'spoken_share', label: 'Share of letters spoken', value: spokenShare, previous: rate(kc(prev?.spoken_letters), kc(prev?.letters)), unit: 'rate', source: 'server', week: latestWeek });
    const l = lpf[lpf.length - 1];
    const lp = lpf[lpf.length - 2];
    metrics.push({ key: 'letters_per_family', label: 'Letters per active family (mean)', value: num(l?.letters_per_family_mean), previous: num(lp?.letters_per_family_mean), unit: 'number', source: 'server', week: l ? week(l.week) : null });
    const voices = rate(kc(l?.families_two_plus_voices), kc(l?.active_families));
    metrics.push({ key: 'two_voices', label: 'Active families with two or more voices', value: voices, previous: rate(kc(lp?.families_two_plus_voices), kc(lp?.active_families)), unit: 'rate', source: 'server', week: l ? week(l.week) : null });

    const a = detectAnomaly(wkf.map((r) => ({ week: week(r.week), value: kc(r.families) })), { metric: 'wkf', label: 'Weekly keeping families', source: 'server', minBase: 30 });
    if (a) anomalies.push(a);
    if (a && a.direction === 'down') {
      propose({
        id: 'wkf-drop', area: 'anomaly', title: 'Find why fewer families kept a letter this week',
        problem: `Weekly keeping families fell to ${fmt(a.value)} in the week of ${a.week}, ${pct(Math.abs(a.change))} below the recent average of ${fmt(Math.round(a.baseline))}.`,
        evidence: [`server weekly_keeping_families: ${fmt(a.value)} vs ${fmt(Math.round(a.baseline))}`],
        hypothesis: 'A release, a reminder change or an outage (sync, transcription, packs) reduced letters that week.',
        change: 'Check releases, remote config changes and error and sync events for that week before changing the product.',
        metric: 'Weekly keeping families back within 10% of the 4-week average.',
        confidence: 'low', impact: 5, reach: a.baseline,
      });
    }
    if (voices !== null && voices < 0.3 && kc(l?.active_families) !== null && (kc(l?.active_families) ?? 0) >= 30) {
      propose({
        id: 'two-voices-low', area: 'adoption', title: 'Help more books get a second voice',
        problem: `Only ${pct(voices)} of active families had letters from two or more people in the week of ${week(l!.week)}.`,
        evidence: [`server letters_per_active_family: ${fmt(kc(l?.families_two_plus_voices))} of ${fmt(kc(l?.active_families))} families`],
        hypothesis: 'Co-parents are not invited at a moment that feels natural, or do not write once they join.',
        change: 'Offer the co-parent invite on the book after the third letter (one ask per session rule) and test a first-letter prompt written for the second parent.',
        metric: 'Share of active families with two voices (target 40%, A).',
        confidence: 'medium', impact: 4, reach: kc(l?.active_families) ?? 0,
      });
    }
    findings.push({ area: 'funnel', source: 'server', text: `Weekly keeping families: ${fmt(kc(last?.families))} in the week of ${latestWeek ?? 'n/a'} (previous ${fmt(kc(prev?.families))}). Spoken share ${pct(spokenShare)}.` });

    // --- First-letter conversion ------------------------------------------------
    const flc = s.first_letter_conversion.filter((r) => r.d7_matured).sort((x, y) => week(x.cohort_week).localeCompare(week(y.cohort_week)));
    const c = flc[flc.length - 1];
    const cp = flc[flc.length - 2];
    const d1 = rate(kc(c?.first_letter_d1), kc(c?.new_accounts));
    const d7 = rate(kc(c?.first_letter_d7), kc(c?.new_accounts));
    metrics.push({ key: 'first_letter_d1', label: 'New accounts with a first letter within a day', value: d1, previous: rate(kc(cp?.first_letter_d1), kc(cp?.new_accounts)), unit: 'rate', source: 'server', week: c ? week(c.cohort_week) : null });
    metrics.push({ key: 'first_letter_d7', label: 'New accounts with a first letter within 7 days', value: d7, previous: rate(kc(cp?.first_letter_d7), kc(cp?.new_accounts)), unit: 'rate', source: 'server', week: c ? week(c.cohort_week) : null });
    if (d7 !== null && d7 < 0.7 && (kc(c?.new_accounts) ?? 0) >= 30) {
      propose({
        id: 'first-letter-conversion', area: 'funnel', title: 'Get more new accounts to a first letter',
        problem: `${pct(1 - d7)} of accounts created in the week of ${week(c!.cohort_week)} saved no letter within 7 days.`,
        evidence: [`server first_letter_conversion: ${fmt(kc(c?.first_letter_d7))} of ${fmt(kc(c?.new_accounts))} within 7 days, ${fmt(kc(c?.first_letter_d1))} within a day`],
        hypothesis: 'People who sign in before writing (for example from an invite) meet an empty Tonight screen without a clear first step.',
        change: 'Open Tonight with the first-letter prompt and one large Speak button for accounts with no letters; check the invite path lands on it too.',
        metric: 'First letter within 7 days of account creation (target 80%, A).',
        confidence: 'medium', impact: 5, reach: kc(c?.new_accounts) ?? 0,
      });
    }

    // --- Retention ----------------------------------------------------------------
    const ret = s.retention_cohorts;
    const cohorts = [...new Set(ret.map((r) => week(r.cohort_week)))].sort();
    const at = (cw: string, off: number) => {
      const r = ret.find((x) => week(x.cohort_week) === cw && x.week_offset === off);
      return r ? rate(kc(r.active_writers), kc(r.cohort_writers)) : null;
    };
    const w4 = cohorts.filter((cw) => at(cw, 4) !== null);
    const w1 = cohorts.filter((cw) => at(cw, 1) !== null);
    const lastW4 = w4[w4.length - 1];
    const lastW1 = w1[w1.length - 1];
    metrics.push({ key: 'retention_w1', label: 'Writers active in week 1 of their cohort', value: lastW1 ? at(lastW1, 1) : null, previous: w1.length > 1 ? at(w1[w1.length - 2], 1) : null, unit: 'rate', source: 'server', week: lastW1 ?? null });
    metrics.push({ key: 'retention_w4', label: 'Writers active in week 4 of their cohort', value: lastW4 ? at(lastW4, 4) : null, previous: w4.length > 1 ? at(w4[w4.length - 2], 4) : null, unit: 'rate', source: 'server', week: lastW4 ?? null });
    const r4 = lastW4 ? at(lastW4, 4) : null;
    const size4 = lastW4 ? kc(ret.find((x) => week(x.cohort_week) === lastW4 && x.week_offset === 4)?.cohort_writers) ?? 0 : 0;
    if (r4 !== null && r4 < 0.35 && size4 >= 30) {
      propose({
        id: 'week4-retention', area: 'retention', title: 'Bring writers back in their first month',
        problem: `${pct(r4)} of writers who started in the week of ${lastW4} wrote again in their fourth week (target 35%).`,
        evidence: [`server retention_cohorts: week 4 rate ${pct(r4)} for a cohort of ${size4}`, `week 1 rate ${pct(lastW1 ? at(lastW1, 1) : null)}`],
        hypothesis: 'After the first week the reminder is the only pull back, and it is easy to mute.',
        change: 'Test an "On this day" resurfacing card at one month and a reminder that names the book (names off by default stays).',
        metric: 'Week-4 writer retention (target 35%, C section 9).',
        confidence: 'medium', impact: 5, reach: size4,
      });
    }

    // --- Co-parent invites --------------------------------------------------------
    const inv = s.family_invites.filter((r) => r.role === 'co_parent' && week(r.week) < current);
    const sent = inv.reduce((n, r) => n + (kc(r.sent) ?? 0), 0);
    const acc = inv.reduce((n, r) => n + (kc(r.accepted) ?? 0), 0);
    const accRate = sent >= K_MIN ? acc / sent : null;
    metrics.push({ key: 'coparent_accept', label: 'Co-parent invites accepted (all weeks in window)', value: accRate, previous: null, unit: 'rate', source: 'server', week: null });
    if (accRate !== null && accRate < 0.5 && sent >= 30) {
      propose({
        id: 'coparent-accept', area: 'adoption', title: 'Make co-parent invites easier to accept',
        problem: `${pct(accRate)} of co-parent invites in the window were accepted.`,
        evidence: [`server family_invites: ${acc} accepted of ${sent} sent (cells under 10 suppressed)`],
        hypothesis: 'The invite link opens before the app is installed, and the pending invite is lost on the way through the App Store.',
        change: 'Check the deferred invite path (universal link, install, first launch) on a clean phone and keep the code fallback visible.',
        metric: 'Co-parent invite acceptance within 7 days (target 60%, A).',
        confidence: 'medium', impact: 4, reach: sent,
      });
    }

    // --- Language mix ---------------------------------------------------------------
    if (s.language_mix.available && s.language_mix.rows.length) {
      const lastLangWeek = [...new Set(s.language_mix.rows.map((r) => week(r.week)))].filter((w) => w < current).sort().pop();
      const rows = s.language_mix.rows.filter((r) => week(r.week) === lastLangWeek);
      const total = rows.reduce((n, r) => n + Number(r.families), 0);
      const mix = rows.sort((x, y) => Number(y.families) - Number(x.families)).map((r) => `${r.lang} ${pct(Number(r.families) / total)}`).join(', ');
      findings.push({ area: 'languages', source: 'server', text: `Families by spoken-letter language, week of ${lastLangWeek}: ${mix}.` });
    } else {
      findings.push({ area: 'languages', source: 'server', text: 'Language mix is not available yet: the server has no letter language column (TRACKING_PLAN 4).' });
    }
  }

  // --- Device (consenting users only) -------------------------------------------
  if (d) {
    const weeks = d.weeks().filter((w) => w < current);
    const lw = weeks[weeks.length - 1] ?? null;
    const pw = weeks[weeks.length - 2] ?? null;
    latestWeek ??= lw;
    const last4 = weeks.slice(-4);

    // Funnel
    const funnel = sortedWeeks((input.device?.funnel ?? []).filter((r) => r.week < current));
    const f = funnel[funnel.length - 1];
    const fp = funnel[funnel.length - 2];
    const startRate = f ? rate(kc(f.started), kc(f.opened)) : null;
    const saveRate = f ? rate(kc(f.saved), kc(f.started)) : null;
    metrics.push({ key: 'start_rate', label: 'People who opened and started a letter (device)', value: startRate, previous: fp ? rate(kc(fp.started), kc(fp.opened)) : null, unit: 'rate', source: 'device', week: f?.week ?? null });
    metrics.push({ key: 'save_rate', label: 'People who started and saved a letter (device)', value: saveRate, previous: fp ? rate(kc(fp.saved), kc(fp.started)) : null, unit: 'rate', source: 'device', week: f?.week ?? null });
    if (saveRate !== null && saveRate < 0.7 && (kc(f?.started) ?? 0) >= 30) {
      propose({
        id: 'start-to-save', area: 'drop_off', title: 'Fewer letters lost between starting and saving',
        problem: `${pct(1 - saveRate)} of people who started a letter in the week of ${f!.week} did not save one (consenting users).`,
        evidence: [`device funnel: ${f!.saved} saved of ${f!.started} started`, `discarded at ${[...d.split('capture_discarded', 'stage', f!.week).entries()].map(([k, v]) => `${k} ${v.events}`).join(', ') || 'n/a'}`],
        hypothesis: 'Review asks for too much before Save, or the transcript wait feels too long.',
        change: 'Let Save work while words are still coming (the letter waits for its words), and check where discards happen.',
        metric: 'Saved / started people per week (target 80%, A).',
        confidence: 'medium', impact: 5, reach: kc(f!.started) ?? 0,
      });
    }

    // Capture discards
    if (lw) {
      const started = d.total('capture_started', lw);
      const discarded = d.total('capture_discarded', lw);
      const dr = rate(discarded, started);
      metrics.push({ key: 'discard_rate', label: 'Captures discarded / started (device)', value: dr, previous: pw ? rate(d.total('capture_discarded', pw), d.total('capture_started', pw)) : null, unit: 'rate', source: 'device', week: lw });
      const a = detectAnomaly(weeks.map((w) => ({ week: w, value: rate(d.total('capture_discarded', w), d.total('capture_started', w)) })), { metric: 'discard_rate', label: 'Captures discarded / started', source: 'device', minBase: 0, isRate: true });
      if (a && a.direction === 'up') anomalies.push(a);
    }

    // Transcription outcomes by model
    const outcomes = d.splitOver('transcription_completed', 'outcome', last4);
    const tTotal = [...outcomes.values()].reduce((a, b) => a + b, 0);
    const noSpeech = rate(outcomes.get('no_speech') ?? 0, tTotal);
    const failed = rate(outcomes.get('failed') ?? 0, tTotal);
    metrics.push({ key: 'no_speech', label: 'Transcriptions with no speech heard (4 weeks, device)', value: tTotal >= 30 ? noSpeech : null, previous: null, unit: 'rate', source: 'device', week: lw });
    metrics.push({ key: 'transcription_failed', label: 'Transcriptions failed (4 weeks, device)', value: tTotal >= 30 ? failed : null, previous: null, unit: 'rate', source: 'device', week: lw });
    if (tTotal >= 30 && noSpeech !== null && noSpeech > 0.1) {
      const models = [...d.splitOver('transcription_completed', 'model', last4).entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
      propose({
        id: 'no-speech', area: 'quality', title: 'Help people when the microphone hears nothing',
        problem: `${pct(noSpeech)} of transcriptions in the last 4 weeks heard no speech.`,
        evidence: [`device transcription_completed: ${outcomes.get('no_speech') ?? 0} no_speech of ${tTotal}`, `by model (all outcomes): ${models || 'n/a'}`],
        hypothesis: 'Recordings start before people speak and end early, or the phone is far away or covered.',
        change: 'Show a gentle level meter while listening and, after a silent take, offer "Try again" with a short tip instead of an empty Review.',
        metric: 'no_speech share under 5% (A).',
        confidence: tTotal >= 200 ? 'high' : 'medium', impact: 4, reach: tTotal,
      });
    }
    if (tTotal >= 30 && failed !== null && failed > 0.03) {
      propose({
        id: 'transcription-failures', area: 'quality', title: 'Make on-device transcription fail less',
        problem: `${pct(failed)} of transcriptions in the last 4 weeks failed.`,
        evidence: [`device transcription_completed: ${outcomes.get('failed') ?? 0} failed of ${tTotal}`],
        hypothesis: 'Memory pressure on smaller phones kills the larger model mid-letter.',
        change: 'Move phones with repeated failures to the compact model sooner and keep the letter waiting for its words.',
        metric: 'Failed transcriptions under 1% (A).',
        confidence: tTotal >= 200 ? 'high' : 'medium', impact: 5, reach: tTotal,
      });
    }

    // Pack downloads by pack
    const byPackStarted = new Map<string, number>();
    for (const r of input.device!.rows) {
      if (r.event === 'pack_download' && r.dim === 'pack' && last4.includes(r.week)) {
        // The pack breakdown counts every stage; the stage split gives the shares overall.
        byPackStarted.set(String(r.value), (byPackStarted.get(String(r.value)) ?? 0) + r.events);
      }
    }
    const stages = d.splitOver('pack_download', 'stage', last4);
    const failures = [...d.splitOver('pack_download', 'failure', last4).entries()].sort((a, b) => b[1] - a[1]);
    const starts = stages.get('started') ?? 0;
    const fails = stages.get('failed') ?? 0;
    const packFail = starts >= 30 ? fails / starts : null;
    metrics.push({ key: 'pack_failure', label: 'Pack downloads failed / started (4 weeks, device)', value: packFail, previous: null, unit: 'rate', source: 'device', week: lw });
    if (packFail !== null && packFail > 0.05) {
      const top = failures[0]?.[0] ?? 'unknown';
      const packs = [...byPackStarted.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${v}`).join(', ');
      propose({
        id: `pack-failures-${top}`, area: 'languages', title: 'Make language downloads more reliable',
        problem: `${pct(packFail)} of pack downloads in the last 4 weeks failed; the most common reason was ${top}.`,
        evidence: [`device pack_download: ${fails} failed of ${starts} started`, `failures by reason: ${failures.map(([k, v]) => `${k} ${v}`).join(', ') || 'n/a'}`, `busiest packs (all stages): ${packs || 'n/a'}`],
        hypothesis: `Downloads fail mostly for ${top}.`,
        change: PACK_FIX[top] ? `${PACK_FIX[top][0].toUpperCase()}${PACK_FIX[top].slice(1)}.` : 'Look at the failing step in the pack engine.',
        metric: 'Pack failures under 2% of starts (TRACKING_PLAN 1.3).',
        confidence: starts >= 100 ? 'high' : 'medium', impact: 4, reach: starts,
      });
    }

    // Verifier refusals
    const reasons = [...d.splitOver('machine_edit_rejected', 'reason', last4).entries()].sort((a, b) => b[1] - a[1]);
    const rejTotal = reasons.reduce((n, [, v]) => n + v, 0);
    const notVetted = rejTotal ? (reasons.find(([k]) => k === 'not_vetted_for_language')?.[1] ?? 0) / rejTotal : null;
    metrics.push({ key: 'not_vetted_share', label: 'Verifier refusals for language tables not signed off (4 weeks, device)', value: rejTotal >= 30 ? notVetted : null, previous: null, unit: 'rate', source: 'device', week: lw });
    if (rejTotal >= 30 && notVetted !== null && notVetted > 0.2) {
      const types = [...d.splitOver('machine_edit_rejected', 'edit_type', last4).entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
      propose({
        id: 'not-vetted-for-language', area: 'quality', title: 'Sign off the language tables the cleaner keeps asking for',
        problem: `${pct(notVetted)} of refused machine edits in the last 4 weeks were refused because a language pack table is not signed off.`,
        evidence: [`device machine_edit_rejected by reason: ${reasons.slice(0, 5).map(([k, v]) => `${k} ${v}`).join(', ')}`, `by edit type: ${types || 'n/a'}`],
        hypothesis: 'Letters in a newly added language get fewer slips fixed than English letters, because its filler or agreement tables are still pending review.',
        change: 'Have the language owner review and sign off the pending tables for the edit types above (packs/text-rules), then publish the packs.',
        metric: 'not_vetted_for_language share of refusals under 5%.',
        confidence: rejTotal >= 200 ? 'high' : 'medium', impact: 3, reach: rejTotal,
      });
    }
    if (rejTotal) findings.push({ area: 'quality', source: 'device', text: `Verifier refusals (4 weeks): ${reasons.slice(0, 5).map(([k, v]) => `${k} ${v}`).join(', ')}.` });

    // Adoption: Read together, Plus
    if (lw) {
      const rt = d.total('read_together_started', lw, 'people');
      const opened = d.total('app_opened', lw, 'people');
      const rtRate = rate(rt, opened);
      metrics.push({ key: 'read_together_adoption', label: 'People who started Read together / opened the app (device)', value: rtRate, previous: pw ? rate(d.total('read_together_started', pw, 'people'), d.total('app_opened', pw, 'people')) : null, unit: 'rate', source: 'device', week: lw });
      const closes = d.splitOver('plus_offer_closed', 'outcome', last4);
      const closed = [...closes.values()].reduce((a, b) => a + b, 0);
      const bought = closed >= 50 ? (closes.get('purchased') ?? 0) / closed : null;
      metrics.push({ key: 'offer_purchase', label: 'Store sheet closes with a purchase (4 weeks, device)', value: bought, previous: null, unit: 'rate', source: 'device', week: lw });
      const unavailable = closed >= 50 ? (closes.get('unavailable') ?? 0) / closed : null;
      if (unavailable !== null && unavailable > 0.05) {
        propose({
          id: 'store-unavailable', area: 'plus', title: "Find why Apple's subscription sheet does not open",
          problem: `${pct(unavailable)} of store sheet attempts in the last 4 weeks ended as unavailable.`,
          evidence: [`device plus_offer_closed: ${closes.get('unavailable') ?? 0} unavailable of ${closed}`],
          hypothesis: 'Phones below the minimum iOS for the subscription store view, or StoreKit not reachable offline.',
          change: 'Hide the offer when the store view cannot open (offline or old iOS) and show the quiet line instead.',
          metric: 'Unavailable under 1% of store sheet attempts.',
          confidence: 'medium', impact: 3, reach: closed,
        });
      }
    }

    // Errors: spikes by code
    for (const code of ['save_failed', 'transcription_failed', 'storage_low', 'offline', 'generic']) {
      const a = detectAnomaly(weeks.map((w) => ({ week: w, value: d.split('error_shown', 'code', w).get(code)?.events ?? null })), { metric: `error_${code}`, label: `Errors shown: ${code}`, source: 'device', minBase: 20 });
      if (a && a.direction === 'up') {
        anomalies.push(a);
        propose({
          id: `error-spike-${code}`, area: 'anomaly', title: `Look into more ${code} errors`,
          problem: `${code} errors rose to ${fmt(a.value)} in the week of ${a.week}, ${pct(a.change)} above the recent average.`,
          evidence: [`device error_shown{code: ${code}}: ${fmt(a.value)} vs ${fmt(Math.round(a.baseline))}`],
          hypothesis: 'A release or a server change that week.',
          change: 'Match the week against releases and server deploys; reproduce on the oldest supported phone.',
          metric: `${code} errors back to the recent average.`,
          confidence: 'low', impact: code === 'save_failed' ? 5 : 3, reach: a.baseline,
        });
      }
    }

    // Languages on device
    const langs = [...d.splitOver('language_set', 'lang', last4).entries()].sort((a, b) => b[1] - a[1]);
    if (langs.length) findings.push({ area: 'languages', source: 'device', text: `Language changes (4 weeks, consenting users, all actions): ${langs.map(([k, v]) => `${k} ${v}`).join(', ')}.` });
    if (starts) findings.push({ area: 'languages', source: 'device', text: `Pack downloads (4 weeks): ${starts} started, ${stages.get('completed') ?? 0} completed, ${fails} failed.` });
  }

  // Findings from metrics
  for (const m of metrics) {
    if (m.value === null || m.previous === null || m.unit === 'count') continue;
    const delta = m.value - m.previous;
    if (Math.abs(delta) >= 0.05 && m.unit === 'rate') {
      findings.push({ area: 'funnel', source: m.source, text: `${m.label}: ${pct(m.value)} (was ${pct(m.previous)}).` });
    }
  }

  proposals.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return {
    date: input.date,
    synthetic: !!input.synthetic,
    latestWeek,
    sources: { server: !!s, device: !!d, languageMix: !!s?.language_mix.available },
    metrics,
    findings,
    anomalies,
    proposals,
  };
}
