/**
 * Push payloads, version 1 (F11 D6, F11-REQ-014, -029, -084; LEGAL-REQ-054).
 * Shapes only: `push-send` is WP-F11-09f (S07, after the WP-F11-09a spike and
 * the push ADR), the tables are S02's (WP-F11-09s), the client is S04's
 * (WP-F11-09c).
 *
 * A payload carries a kind and the words to show, nothing else: no child
 * name, signature, letter text or id of any kind. A push only wakes the app;
 * the app pulls (F16 6.2 C) or reads its pending restore requests (F08 6.5 C3).
 *
 * Server-feature contract: imported only through `@scribe/api/server`.
 */
import * as v from 'valibot';

export const PUSH_KINDS = ['co_parent_letter', 'restore_request'] as const;
export type PushKind = (typeof PUSH_KINDS)[number];

/** APNs interruption levels: letters are passive (no sound, no lit screen); a restore request is time-sensitive [A: WP-F11-09a]. */
export const PUSH_INTERRUPTION: Readonly<Record<PushKind, 'passive' | 'time-sensitive'>> = {
  co_parent_letter: 'passive',
  restore_request: 'time-sensitive',
};

/** One co-parent letter push per author per book per 2 hours (collapse, F11-REQ-014). Restore requests are never collapsed. */
export const CO_PARENT_LETTER_COLLAPSE_HOURS = 2;

/** The APNs body `push-send` builds. Title and body come from `notifications.*` copy in `packages/content`. */
export const PushPayloadSchema = v.strictObject({
  aps: v.strictObject({
    alert: v.strictObject({ title: v.pipe(v.string(), v.maxLength(80)), body: v.pipe(v.string(), v.maxLength(160)) }),
    'interruption-level': v.picklist(['passive', 'time-sensitive']),
  }),
  kind: v.picklist(PUSH_KINDS),
});
export type PushPayload = v.InferOutput<typeof PushPayloadSchema>;

export function buildPushPayload(kind: PushKind, title: string, body: string): PushPayload {
  return { aps: { alert: { title, body }, 'interruption-level': PUSH_INTERRUPTION[kind] }, kind };
}
