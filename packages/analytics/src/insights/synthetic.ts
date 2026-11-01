/**
 * Synthetic inputs for the dry run and the tests. Deterministic (seeded), shaped
 * exactly like the real sources, with known problems planted so the engine's
 * findings can be checked:
 * - a 30% drop in weekly keeping families in the latest week;
 * - Hindi rules pack failures for lack of space;
 * - 14% of transcriptions hear no speech;
 * - a third of verifier refusals are `not_vetted_for_language`;
 * - week-4 retention under target; few two-voice families;
 * - a spike of `save_failed` errors in the latest week.
 * No row describes a real person.
 */
import { weekStart } from './engine';
import type { DeviceData, DeviceRow, InsightsInput, ServerAggregates } from './types';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const k = (n: number) => (n === 0 || n >= 10 ? n : null);

export function syntheticInput(date: string, opts: { weeks?: number; seed?: number } = {}): InsightsInput {
  const weeks = opts.weeks ?? 12;
  const r = rng(opts.seed ?? 7);
  const current = weekStart(date);
  const W = Array.from({ length: weeks }, (_, i) => addDays(current, -7 * (weeks - i)));
  const last = W[W.length - 1];
  const jitter = (base: number, spread = 0.06) => Math.round(base * (1 + (r() * 2 - 1) * spread));

  // --- Server ----------------------------------------------------------------
  const families = W.map((w, i) => (w === last ? Math.round(jitter(220 + i * 12) * 0.7) : jitter(220 + i * 12)));
  const server: ServerAggregates = {
    schema: 1,
    k_min: 10,
    since: W[0],
    weekly_keeping_families: W.map((w, i) => {
      const f = families[i];
      const letters = Math.round(f * 1.9);
      const spoken = Math.round(letters * 0.62);
      return { week: w, complete: true, families: k(f), families_with_book_letter: k(Math.round(f * 0.8)), letters: k(letters), spoken_letters: k(spoken), typed_letters: k(letters - spoken) };
    }),
    letters_per_active_family: W.map((w, i) => ({
      week: w, complete: true, active_families: k(families[i]), letters_per_family_mean: 1.9, letters_per_family_p50: 1, letters_per_family_p90: 4,
      families_two_plus_voices: k(Math.round(families[i] * 0.22)),
    })),
    first_letter_conversion: W.map((w, i) => {
      const n = jitter(90 + i * 4);
      return {
        cohort_week: w, d7_matured: i < W.length - 1, d30_matured: i < W.length - 5, new_accounts: k(n),
        first_letter_d1: k(Math.round(n * 0.55)), first_letter_d7: k(Math.round(n * 0.64)), first_letter_d30: i < W.length - 5 ? k(Math.round(n * 0.7)) : null,
      };
    }),
    family_invites: W.flatMap((w) => [
      { week: w, role: 'co_parent' as const, sent: k(jitter(60)), accepted: k(jitter(33)), accepted_within_7d: k(jitter(28)) },
      { week: w, role: 'contributor' as const, sent: null, accepted: null, accepted_within_7d: null },
    ]),
    retention_cohorts: W.flatMap((cw, ci) => {
      const size = jitter(140);
      return Array.from({ length: Math.min(13, W.length - ci) }, (_, off) => ({
        cohort_week: cw, week_offset: off, cohort_writers: k(size),
        active_writers: k(off === 0 ? size : Math.round(size * Math.max(0.2, 0.62 - off * 0.085))),
      }));
    }),
    language_mix: {
      available: true,
      rows: W.flatMap((w, i) => [
        { week: w, lang: 'en', families: Math.round(families[i] * 0.66) },
        { week: w, lang: 'hi', families: Math.round(families[i] * 0.14) },
        { week: w, lang: 'es', families: Math.round(families[i] * 0.12) },
        { week: w, lang: 'other', families: Math.max(10, families[i] - Math.round(families[i] * 0.92)) },
      ]),
    },
  };

  // --- Device (consenting share, about 40%) --------------------------------------
  const rows: DeviceRow[] = [];
  const add = (week: string, event: string, events: number, people: number, dim?: string, value?: string) => {
    if (people >= 10) rows.push({ week, event, events, people, ...(dim ? { dim, value } : {}) });
  };
  const funnel = W.map((w, i) => {
    const opened = Math.round(families[i] * 0.8);
    const started = Math.round(opened * 0.7);
    const saved = Math.round(started * 0.62);
    add(w, 'app_opened', opened * 4, opened);
    add(w, 'capture_started', Math.round(started * 1.6), started);
    add(w, 'letter_saved', Math.round(saved * 1.5), saved);
    add(w, 'capture_discarded', Math.round(started * 0.5), Math.round(started * 0.35));
    add(w, 'capture_discarded', Math.round(started * 0.35), Math.round(started * 0.25), 'stage', 'listening');
    add(w, 'capture_discarded', Math.round(started * 0.15), Math.round(started * 0.12), 'stage', 'review');
    const t = Math.round(saved * 1.2);
    add(w, 'transcription_completed', t, saved);
    add(w, 'transcription_completed', Math.round(t * 0.8), Math.round(saved * 0.8), 'outcome', 'ok');
    add(w, 'transcription_completed', Math.round(t * 0.14), Math.round(saved * 0.14), 'outcome', 'no_speech');
    add(w, 'transcription_completed', Math.round(t * 0.06), Math.round(saved * 0.06), 'outcome', 'queued_for_model');
    add(w, 'transcription_completed', Math.round(t * 0.85), Math.round(saved * 0.85), 'model', 'turbo');
    add(w, 'transcription_completed', Math.round(t * 0.15), Math.round(saved * 0.15), 'model', 'hindi_small');
    add(w, 'pack_download', 60, 40, 'stage', 'started');
    add(w, 'pack_download', 48, 35, 'stage', 'completed');
    add(w, 'pack_download', 12, 10, 'stage', 'failed');
    add(w, 'pack_download', 12, 10, 'failure', 'no_space');
    add(w, 'pack_download', 70, 30, 'pack', 'rules_hi');
    add(w, 'pack_download', 50, 25, 'pack', 'model_hindi_small');
    add(w, 'machine_edit_rejected', 120, 40, 'reason', 'not_vetted_for_language');
    add(w, 'machine_edit_rejected', 150, 50, 'reason', 'not_a_filler');
    add(w, 'machine_edit_rejected', 90, 30, 'reason', 'changes_word');
    add(w, 'machine_edit_rejected', 160, 45, 'edit_type', 'filler');
    add(w, 'machine_edit_rejected', 200, 60, 'edit_type', 'agreement');
    add(w, 'read_together_started', 40, Math.round(opened * 0.1));
    add(w, 'plus_offer_closed', 30, 25, 'outcome', 'dismissed');
    add(w, 'plus_offer_closed', 3, 3, 'outcome', 'purchased');
    add(w, 'language_set', 25, 20, 'lang', 'hi');
    add(w, 'language_set', 15, 12, 'lang', 'es');
    add(w, 'error_shown', w === last ? 120 : jitter(30, 0.1), w === last ? 70 : 20, 'code', 'save_failed');
    add(w, 'error_shown', jitter(40, 0.1), 25, 'code', 'offline');
    return { week: w, opened, started, saved };
  });

  const device: DeviceData = { source: 'synthetic', rows, funnel };
  return { date, server, device, synthetic: true };
}
