/**
 * Typed helpers the app's screens call, one per event that needs mapping from
 * domain values (milliseconds, counts, book positions, language codes) to
 * catalogue buckets. Screens never build event properties by hand for these.
 * Events whose properties are already plain enums are sent with
 * `analytics.track(name, props)` directly (typed from the catalogue).
 *
 * The app binds these once: `export const t = createTrackers(analytics)` in
 * apps/mobile/src/lib/analytics/track.ts. Call sites are listed in
 * TRACKING_PLAN section 9 ("To wire").
 */
import {
  audioBucket,
  childOrdinal,
  clampInt,
  daysBucket,
  exportDurationBucket,
  exportSizeBucket,
  hourBucket,
  latencyBucket,
  lettersBucket,
  sessionBucket,
  timeToFirstLetterBucket,
  toV1Lang,
  ttfiBucket,
  wordsBucket,
} from './buckets';
import type { Catalog } from './catalog';
import type { Analytics, EventProps, TrackResult } from './client';
import { packAnalyticsId, speechModelValue } from './packs';

type V<E extends keyof Catalog, P extends keyof Catalog[E]['props']> = Catalog[E]['props'][P] extends { values: readonly (infer X)[] } ? X : never;

export type PromptKindValue = V<'letter_saved', 'prompt_kind'>;
export type MemberRole = 'parent' | 'contributor';
/** A member's role in a book: co-parents are `parent` (B section 6). */
export type InviteRoleInput = 'parent' | 'contributor';

const inviteRole = (r: InviteRoleInput) => r as V<'invite_created', 'role'>;

export interface LetterSavedInput {
  mode: 'spoken' | 'typed';
  /** true: added to the book; false: kept private. */
  inBook: boolean;
  /** 0-based position of this book among the viewer's books. */
  childIndex: number;
  role: MemberRole;
  promptKind: PromptKindValue | null;
  /** Recording length; omit for typed letters. */
  audioMs?: number | null;
  wordCount: number;
  machineEdits: number;
  editsReverted: number;
  /** Edits the verifier refused for this letter (optional). */
  editsRejected?: number;
  engine: V<'letter_saved', 'engine'>;
  /** Saved within 2 hours of opening the app from a reminder. */
  fromNotificationWithin2h: boolean;
}

export interface OptedInSummaryInput {
  surface: 'consent_sheet' | 'settings';
  now: number;
  /** ms epoch; null if unknown. */
  firstLaunchAt: number | null;
  /** ms epoch of the first saved letter on this phone; null if none. */
  firstLetterAt: number | null;
  firstLetterMode: 'spoken' | 'typed' | null;
  letters: number;
  signedIn: boolean;
  role: MemberRole;
  cameFromInvite: boolean;
}

export interface PackDownloadInput {
  /** The manifest pack id (`text-rules.pt`); only its short analytics id is sent. */
  packId: string;
  /** Manifest version number of the pack. */
  version: number | null;
  stage: V<'pack_download', 'stage'>;
  failure?: V<'pack_download', 'failure'>;
  network: V<'pack_download', 'network'>;
}

/** The parts of a verifier rejection this helper reads (packages/core RejectedEdit). */
export interface RejectedEditInput {
  edit: { type: V<'machine_edit_rejected', 'edit_type'>; source: V<'machine_edit_rejected', 'source'> };
  reason: V<'machine_edit_rejected', 'reason'>;
}

/** At most this many `machine_edit_rejected` events per letter (one per type, source and reason). */
export const MAX_REJECTED_EVENTS_PER_LETTER = 12;

/** `not_sent` means the helper refused before calling track (for example a language outside the v1.0 list). */
export type HelperResult = TrackResult | 'not_sent';

export function createTrackers(analytics: Pick<Analytics, 'track'>) {
  const track = <E extends keyof Catalog>(name: E, props: EventProps<E>): TrackResult => analytics.track(name, props);

  return {
    trackLetterSaved(i: LetterSavedInput): TrackResult {
      return track('letter_saved', {
        mode: i.mode,
        destination: i.inBook ? 'book' : 'private',
        child_ordinal: childOrdinal(i.childIndex),
        member_role: i.role,
        prompt_kind: i.promptKind ?? 'none',
        ...(i.mode === 'spoken' && i.audioMs != null ? { audio_bucket: audioBucket(i.audioMs) } : {}),
        words_bucket: wordsBucket(i.wordCount),
        machine_edit_count: clampInt(i.machineEdits, 0, 500),
        edits_reverted_count: clampInt(i.editsReverted, 0, 500),
        ...(i.editsRejected != null ? { edits_rejected_count: clampInt(i.editsRejected, 0, 500) } : {}),
        engine: i.engine,
        from_notification_2h: i.fromNotificationWithin2h,
      });
    },

    trackCaptureStarted(i: {
      mode: 'spoken' | 'typed';
      source: V<'capture_started', 'source'>;
      promptKind: PromptKindValue | null;
      childIndex: number;
      role: MemberRole;
    }): TrackResult {
      return track('capture_started', {
        mode: i.mode,
        source: i.source,
        prompt_kind: i.promptKind ?? 'none',
        child_ordinal: childOrdinal(i.childIndex),
        member_role: i.role,
      });
    },

    trackCaptureDiscarded(i: { mode: 'spoken' | 'typed'; stage: 'listening' | 'review'; audioMs?: number | null }): TrackResult {
      return track('capture_discarded', {
        mode: i.mode,
        stage: i.stage,
        ...(i.audioMs != null ? { audio_bucket: audioBucket(i.audioMs) } : {}),
      });
    },

    trackTranscriptionCompleted(i: {
      engine: V<'transcription_completed', 'engine'>;
      /** Speech model id from src/lib/models/catalog.ts, or null (sample engine). */
      modelId: string | null;
      audioMs: number;
      latencyMs: number;
      outcome: V<'transcription_completed', 'outcome'>;
    }): TrackResult {
      return track('transcription_completed', {
        engine: i.engine,
        model: speechModelValue(i.modelId),
        audio_bucket: audioBucket(i.audioMs),
        latency_bucket: latencyBucket(i.latencyMs),
        outcome: i.outcome,
      });
    },

    trackBookOpened(i: { childIndex: number; letters: number; role: MemberRole }): TrackResult {
      return track('book_opened', { child_ordinal: childOrdinal(i.childIndex), letters_bucket: lettersBucket(i.letters), member_role: i.role });
    },

    trackReadTogetherStarted(i: { childIndex: number; access: 'plus' | 'free'; letters: number }): TrackResult {
      return track('read_together_started', { child_ordinal: childOrdinal(i.childIndex), access: i.access, letters_bucket: lettersBucket(i.letters) });
    },

    trackReadTogetherEnded(i: { reason: 'finished' | 'stopped' | 'interrupted'; durationMs: number; lettersHeard: number }): TrackResult {
      return track('read_together_ended', {
        reason: i.reason,
        session_bucket: sessionBucket(i.durationMs),
        letters_heard: clampInt(i.lettersHeard, 0, 50),
      });
    },

    trackInviteCreated(i: { role: InviteRoleInput; channel: V<'invite_created', 'channel'>; shared: boolean; childIndex: number }): TrackResult {
      return track('invite_created', { role: inviteRole(i.role), channel: i.channel, shared: i.shared, child_ordinal: childOrdinal(i.childIndex) });
    },

    trackInviteAccepted(i: { role: InviteRoleInput }): TrackResult {
      return track('invite_accepted', { role: inviteRole(i.role), surface: 'app' });
    },

    trackExportStarted(i: { letters: number }): TrackResult {
      return track('export_started', { format: 'archive', letters_bucket: lettersBucket(i.letters) });
    },

    trackExportCompleted(i: { bytes: number; durationMs: number }): TrackResult {
      return track('export_completed', { format: 'archive', size_bucket: exportSizeBucket(i.bytes), duration_bucket: exportDurationBucket(i.durationMs) });
    },

    trackExportFailed(i: { reason: V<'export_failed', 'reason'> }): TrackResult {
      return track('export_failed', { format: 'archive', reason: i.reason });
    },

    /** Stored reminder preferences (src/lib/reminders ReminderPrefs) to the schedule event. */
    trackReminderSchedule(i: {
      enabled: boolean;
      cadence: 'off' | 'weekly' | 'fewTimes' | 'everyEvening';
      hour: number;
      paused: boolean;
    }): TrackResult {
      const cadence = !i.enabled ? 'off' : i.cadence === 'fewTimes' ? 'few_times' : i.cadence === 'everyEvening' ? 'every_evening' : i.cadence;
      return track('reminder_schedule_set', { cadence, hour_bucket: hourBucket(i.hour), paused: i.paused });
    },

    /**
     * The verifier's rejections for one letter, grouped by edit type, source
     * and reason, with a count. Never the text, offsets or the edit itself.
     */
    trackMachineEditsRejected(rejected: readonly RejectedEditInput[]): TrackResult[] {
      const groups = new Map<string, { input: RejectedEditInput; n: number }>();
      for (const r of rejected) {
        const key = `${r.edit.type}|${r.edit.source}|${r.reason}`;
        const g = groups.get(key);
        if (g) g.n++;
        else groups.set(key, { input: r, n: 1 });
      }
      return [...groups.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, MAX_REJECTED_EVENTS_PER_LETTER)
        .map(({ input, n }) =>
          track('machine_edit_rejected', { edit_type: input.edit.type, source: input.edit.source, reason: input.reason, count: clampInt(n, 1, 500) }),
        );
    },

    trackColdStart(i: { ttfiMs: number }): TrackResult {
      return track('app_cold_start', { ttfi_bucket: ttfiBucket(i.ttfiMs) });
    },

    /**
     * Right after a yes. A one-time summary of first-run facts the app already
     * keeps, because first-run events can never be sent (K-01). Counsel to
     * confirm (TRACKING_PLAN section 2).
     */
    trackAnalyticsOptedIn(i: OptedInSummaryInput): TrackResult {
      const sinceInstall = i.firstLaunchAt == null ? 0 : i.now - i.firstLaunchAt;
      const ttfl = i.firstLaunchAt != null && i.firstLetterAt != null ? i.firstLetterAt - i.firstLaunchAt : null;
      return track('analytics_opted_in', {
        surface: i.surface,
        days_since_install: daysBucket(sinceInstall),
        letters_bucket: lettersBucket(i.letters),
        signed_in: i.signedIn,
        member_role: i.role,
        first_letter_mode: i.firstLetterMode ?? 'none',
        time_to_first_letter: i.firstLetterAt == null ? 'unknown' : timeToFirstLetterBucket(ttfl),
        came_from_invite: i.cameFromInvite,
      });
    },

    /** One language per event, and only the seven v1.0 languages. */
    trackLanguageSet(i: { lang: string; action: V<'language_set', 'action'> }): HelperResult {
      const lang = toV1Lang(i.lang);
      if (!lang) return 'not_sent';
      return track('language_set', { lang, action: i.action });
    },

    /** A pack engine progress change, by short analytics pack id and language code only. */
    trackPackDownload(i: PackDownloadInput): HelperResult {
      const { pack, lang } = packAnalyticsId(i.packId);
      return track('pack_download', {
        pack,
        ...(lang ? { lang } : {}),
        pack_version: clampInt(i.version ?? 1, 1, 1000),
        stage: i.stage,
        ...(i.stage === 'failed' && i.failure ? { failure: i.failure } : {}),
        network: i.network,
      });
    },
  };
}

export type Trackers = ReturnType<typeof createTrackers>;
