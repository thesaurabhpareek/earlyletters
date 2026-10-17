/**
 * Tonight's pure parts (EXPERIENCE_PASS_2026-10 S09 and S33, package P3). No React Native import, so they are unit
 * tested in test/draft-card.test.ts.
 *
 * Unfinished letters: one card per draft from listDrafts(childId), newest first, never a total. Each card's state is
 * read from the draft's own fields and nothing is inferred (S09):
 *
 *   state    read from                                   line                                      action
 *   held     Draft.held (local schema v8, #182)          first words, then tonight.draft.held       Keep it      (Review, then the gate)
 *   swept    Draft.recoveredAt (the launch sweep)        tonight.draft.swept                       Read it back (Review)
 *   typed    captureMode 'typed', no audioUri            first words                               Pick it up   (Write)
 *   waiting  audioUri, no rawTranscript and no typing    book.waitingForWords                      Open         (Review)
 *   ready    everything else (the first row)             first words, else draftWaiting.title       Read it back (Review)
 *
 * `held` arrives with #182 (S03, local schema v8). Until it merges no draft carries the field, so a draft held at
 * the Plus gate shows the first row; nothing is inferred from a second gate call. The card reads `held` through the
 * optional field below, so it turns on by itself when #182 adds `held?: boolean` to Draft.
 *
 * The words on a card are the person's own, as stored: the raw transcript (never the machine's proposed fixes) or
 * what they typed. Whitespace is folded for display only; the stored words are never cut or changed.
 */
import { reminderCopy } from '@scribe/content';
import { tokens, type Daypart, type TypeToken } from '@scribe/design-tokens';
import { copy, fill } from '@/lib/copy';
import { dayDate, isoOf } from '@/lib/dates';
import type { Draft, Entry } from '@/lib/store';

/* ------------------------------------------------------------------ */
/* Draft cards                                                         */
/* ------------------------------------------------------------------ */

/** What a card reads from a draft. `held` is optional until #182 adds it to Draft (local schema v8). */
export type DraftFields = Pick<Draft, 'id' | 'captureMode' | 'audioUri' | 'audioDurationMs' | 'rawTranscript' | 'typedText' | 'recoveredAt' | 'createdAt'> & {
  held?: boolean;
};

export type DraftCardState = 'ready' | 'waiting' | 'typed' | 'held' | 'swept';

/** The draft's words for display, or null: what was typed (on a typed or a mixed draft), else the raw transcript. */
export function draftWords(d: Pick<DraftFields, 'typedText' | 'rawTranscript'>): string | null {
  for (const t of [d.typedText, d.rawTranscript]) {
    const folded = (t ?? '').replace(/\s+/g, ' ').trim();
    if (folded) return folded;
  }
  return null;
}

/** The card's state, from the draft's own fields only. A state that cannot be read is the first row ('ready'). */
export function draftState(d: DraftFields): DraftCardState {
  if (d.held === true) return 'held';
  if (d.recoveredAt) return 'swept';
  if (!d.audioUri && d.captureMode === 'typed') return 'typed';
  if (d.audioUri && d.rawTranscript == null && !draftWords({ typedText: d.typedText, rawTranscript: null })) return 'waiting';
  return 'ready';
}

/** Where a card's action goes: Write to pick up a typed draft, Review for everything else (the gate opens from there). */
export type DraftRoute = { pathname: '/review' | '/write'; params: { draftId: string } };

export type DraftCard = {
  id: string;
  state: DraftCardState;
  /** The visible dateline: the weekday within the last week, else the full date. */
  dateline: string;
  /** The recording's length (m:ss), or null for typing. */
  clock: string | null;
  /** The person's first words, shown in letterBody with a fade, or null. */
  words: string | null;
  /** The state line (footnote, textMuted), or null. */
  line: string | null;
  /** The action's label, drawn as a text button. */
  action: string;
  route: DraftRoute;
  /** The whole card is one button: what VoiceOver reads, with no separator glyphs. */
  a11yLabel: string;
};

/** "0:42": a recording's length, as the Book's cards show it. */
export function clockOf(ms: number | null | undefined): string | null {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Whole calendar days from `from` to `to` (YYYY-MM-DD), by UTC noon so no time zone or clock change moves it. */
export function daysBetween(from: string, to: string): number {
  const noon = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((noon(to) - noon(from)) / 864e5);
}

/**
 * A draft's dateline. Within the last week, the weekday it was started ("Tuesday"); older, the full date
 * ("Tuesday, September 29, 2026"). The spec's "Tuesday evening" needs four time-of-day words that are not in
 * packages/content yet (a request to the content owner in P3's pull request), so no word is typed here.
 */
export function draftDateline(createdAt: string, now: Date = new Date()): string {
  const at = new Date(createdAt);
  if (Number.isNaN(at.getTime())) return '';
  const days = daysBetween(isoOf(at), isoOf(now));
  return days >= 0 && days < 7 ? reminderCopy.weekdays[at.getDay()] : dayDate(isoOf(at));
}

/** Sentences joined for a screen reader: each part ends in its own full stop, empty parts are dropped. */
export function spoken(parts: readonly (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(' ');
}

const t = copy.tonight;

const ACTION: Record<DraftCardState, string> = {
  ready: t.afterSave.reviewButton,
  waiting: t.draft.openButton,
  typed: t.draft.pickUpButton,
  held: t.draft.keepButton,
  swept: t.afterSave.reviewButton,
};

/** One card for one draft (S09). */
export function draftCard(d: DraftFields, now: Date = new Date()): DraftCard {
  const state = draftState(d);
  const words = state === 'swept' || state === 'waiting' ? null : draftWords(d);
  const line =
    state === 'held'
      ? t.draft.held
      : state === 'swept'
        ? t.draft.swept
        : state === 'waiting'
          ? copy.book.waitingForWords
          : state === 'ready' && !words
            ? t.draftWaiting.title
            : null;
  const typed = state === 'typed';
  const at = new Date(d.createdAt);
  const longDate = Number.isNaN(at.getTime()) ? '' : dayDate(isoOf(at));
  return {
    id: d.id,
    state,
    dateline: draftDateline(d.createdAt, now),
    clock: d.audioUri ? clockOf(d.audioDurationMs) : null,
    words,
    line,
    action: ACTION[state],
    route: { pathname: typed ? '/write' : '/review', params: { draftId: d.id } },
    a11yLabel: spoken([typed ? fill(t.draft.typedA11y, { date: longDate }) : longDate, words, line, ACTION[state]]),
  };
}

/** Every waiting draft as a card, in listDrafts' order (newest first). Never a total. */
export function draftCards(drafts: readonly DraftFields[], now: Date = new Date()): DraftCard[] {
  return drafts.map((d) => draftCard(d, now));
}

/** The excerpt on a draft or "A month ago" card: two whole lines of letterBody that end in a fade (ExcerptFade). */
export const EXCERPT: { lines: number; variant: TypeToken } = { lines: 2, variant: 'letterBody' };

/* ------------------------------------------------------------------ */
/* A month ago                                                         */
/* ------------------------------------------------------------------ */

/** A letter dated this many days ago may come back on Tonight (S09; DESIGN_LANGUAGE 12). */
export const RESURFACE_DAYS = { from: 28, to: 35 } as const;

export type ResurfacedCard = { id: string; kicker: string; words: string; a11yLabel: string };

/**
 * The one letter "A month ago" shows, or null: only when no draft is waiting; the newest letter in the book dated 28
 * to 35 days ago that has words; never a private letter, never a quiet-day mark, never a count or a gap.
 */
export function resurfaced(
  entries: readonly Pick<Entry, 'id' | 'kind' | 'inBook' | 'occurredOn' | 'capturedAt' | 'finalText'>[],
  today: string,
  draftsWaiting: number,
): ResurfacedCard | null {
  if (draftsWaiting > 0) return null;
  const pick = entries
    .filter((e) => {
      const age = daysBetween(e.occurredOn, today);
      return e.kind === 'letter' && e.inBook && age >= RESURFACE_DAYS.from && age <= RESURFACE_DAYS.to && e.finalText.trim() !== '';
    })
    .sort((a, b) => (a.occurredOn === b.occurredOn ? b.capturedAt.localeCompare(a.capturedAt) : b.occurredOn.localeCompare(a.occurredOn)))[0];
  if (!pick) return null;
  const words = pick.finalText.replace(/\s+/g, ' ').trim();
  const kicker = t.resurfaced.kicker;
  return { id: pick.id, kicker, words, a11yLabel: spoken([kicker, words, fill(t.resurfaced.a11y, { date: dayDate(pick.occurredOn) })]) };
}

/* ------------------------------------------------------------------ */
/* The top of Tonight                                                  */
/* ------------------------------------------------------------------ */

/**
 * The dateline ("Asha · 7 months"), and what VoiceOver reads instead ("Asha, 7 months"): the separator is never read
 * aloud. Before a birthday it is the day's date.
 */
export function tonightDateline(child: string, age: string | null, dayFallback: string): { text: string; a11y: string } {
  return age ? { text: `${child} · ${age}`, a11y: `${child}, ${age}` } : { text: dayFallback, a11y: dayFallback };
}

/**
 * The greeting in two tones, the website's "Asha is / asleep." move: what comes before the name in `text`, the name
 * and the rest in `textMuted` ("Good evening, " and "Mama.").
 */
export function greetingParts(template: string, name: string): { lead: string; rest: string } {
  const at = template.indexOf('{name}');
  if (at < 0) return { lead: fill(template, { name }), rest: '' };
  return { lead: template.slice(0, at), rest: fill(template.slice(at), { name }) };
}

/* ------------------------------------------------------------------ */
/* Not much today, and the light                                       */
/* ------------------------------------------------------------------ */

/** S33: the evening dayparts, where "Not much today" lowers Tonight's lamp. */
export const EVENING_DAYPARTS: readonly Daypart[] = ['evening', 'night', 'lateNight'];

/**
 * Tonight's lamp strength (a multiplier of the daypart's own intensity). Once today is kept as a quiet day, in the
 * evening dayparts the lights go down to tokens.motion.lamp.dimTo (70 percent): the Lamp eases there over arriveMs,
 * and jumps under Reduce Motion. It follows the stored mark, so it holds while the person comes and goes this evening
 * and Undo (which removes the mark) brings the light back. Mornings and afternoons are never dimmed.
 */
export function tonightLampIntensity(daypart: Daypart, quietDayKept: boolean): number {
  return quietDayKept && EVENING_DAYPARTS.includes(daypart) ? tokens.motion.lamp.dimTo : 1;
}

/* ------------------------------------------------------------------ */
/* Arrival: once per cold launch                                       */
/* ------------------------------------------------------------------ */

let entered = false;

/**
 * Tonight's lines enter once per cold launch (MOTION 5a, EXPERIENCE_PASS 5.8 rule 2). A warm resume, a tab switch and
 * a return from Listen, Review, Write or a letter move nothing, and a card that appears while Tonight is covered (a
 * typed draft when Write closes) is already in place.
 */
export const tonightArrival = {
  /** True until Tonight has shown its content once in this session. */
  pending: (): boolean => !entered,
  done: (): void => {
    entered = true;
  },
  /** Tests only. */
  reset: (): void => {
    entered = false;
  },
};
