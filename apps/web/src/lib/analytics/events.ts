/**
 * Owner: E3 (release). The complete list of things the website may ever report.
 *
 * The rule: every value is a member of a fixed list below. There is no free text, so no email, name,
 * message, user id or URL can reach the analytics service, by accident or on purpose. `toWireEvent`
 * re-checks the lists at run time, so a wrong value cast past TypeScript is dropped, not sent.
 *
 * Vercel Web Analytics allows 2 properties per custom event on Pro (8 with the Plus add-on). Every event
 * here has at most 2, and a test enforces it.
 */

/** Scene ids, from docs/web/STORYBOARD.md. Same strings as the section ids in src/scenes. */
export const SCENE_IDS = [
  'evening',
  'a-minute',
  'just-talk',
  'exactly',
  'your-voice',
  'the-book',
  'years-later',
  'languages',
  'private',
  'pricing',
  'start',
] as const;
export type SceneId = (typeof SCENE_IDS)[number];

/** Where a call to action sits. Also the App Store campaign token suffix (see appStoreHref in launch.ts). */
export const CTA_PLACEMENTS = ['header', 'pill', 'start', 'footer'] as const;
export type CtaPlacement = (typeof CTA_PLACEMENTS)[number];

/** Which action the visitor was offered: the email form before launch, the App Store badge after. */
export const CTA_MODES = ['prelaunch', 'live'] as const;
export type CtaMode = (typeof CTA_MODES)[number];

/** Same values as `NotifyResult` in src/lib/notify/client.ts: 'ok' for success, else its `error`. */
export const NOTIFY_RESULTS = ['ok', 'invalid', 'rate_limited', 'server'] as const;
export type NotifyOutcome = (typeof NOTIFY_RESULTS)[number];

export type AnalyticsEvent =
  | { name: 'cta_click'; mode: CtaMode; placement: CtaPlacement }
  | { name: 'notify_submit'; result: NotifyOutcome }
  | { name: 'scene_reached'; id: SceneId };

export interface WireEvent {
  name: AnalyticsEvent['name'];
  data: Record<string, string>;
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Validates an event against the lists and returns what is sent, or null when anything is off. */
export function toWireEvent(event: AnalyticsEvent): WireEvent | null {
  switch (event?.name) {
    case 'cta_click':
      return isOneOf(CTA_MODES, event.mode) && isOneOf(CTA_PLACEMENTS, event.placement)
        ? { name: 'cta_click', data: { mode: event.mode, placement: event.placement } }
        : null;
    case 'notify_submit':
      return isOneOf(NOTIFY_RESULTS, event.result) ? { name: 'notify_submit', data: { result: event.result } } : null;
    case 'scene_reached':
      return isOneOf(SCENE_IDS, event.id) ? { name: 'scene_reached', data: { id: event.id } } : null;
    default:
      return null;
  }
}
