/**
 * Test support for observers and trackers that still call HELD events (typed in catalog.ts, not in the registry,
 * so the client drops them). `intentRecorder` records what the code asked to send and checks it against the
 * catalogue shape with the same rules (`sanitizeWith`), so the mapping logic stays covered until each held event
 * is registered or removed.
 */
import { EVENTS, SCHEMA_VERSION, sanitizeWith, type Analytics, type TrackResult } from '../src';

export function intentRecorder(analytics: Analytics) {
  const intents: [string, Record<string, string | number | boolean>][] = [];
  const wrapped: Analytics = {
    ...analytics,
    track: ((name: string, props: Record<string, unknown>): TrackResult => {
      const { props: clean } = sanitizeWith(EVENTS as never, name, { ...props, schema_version: SCHEMA_VERSION });
      if (!clean) return 'dropped_invalid';
      const { schema_version: _v, ...rest } = clean;
      void _v;
      intents.push([name, rest]);
      return 'queued';
    }) as Analytics['track'],
  };
  return { analytics: wrapped, intents };
}
