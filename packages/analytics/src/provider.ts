/**
 * Provider adapter interface. The client talks only to this; PostHog (or a
 * swap like Aptabase, ADR 0008) is injected. Keep adapters thin: all policy
 * lives in the client and validate.ts, not here.
 */
export interface AnalyticsProvider {
  optIn(): void | Promise<void>;
  optOut(): void | Promise<void>;
  /** Random analytics id only. Never pass person properties. */
  identify(distinctId: string): void | Promise<void>;
  capture(event: string, properties: Record<string, string | number | boolean>): void | Promise<void>;
  flush(): void | Promise<void>;
  /** Forget the provider's own identity and any queued events. */
  reset(): void | Promise<void>;
}

/** Provider that records calls. Useful in tests and for a dev "inspector". */
export interface RecordingProvider extends AnalyticsProvider {
  calls: { method: keyof AnalyticsProvider; args: unknown[] }[];
  captured(): { event: string; properties: Record<string, string | number | boolean> }[];
}

export function recordingProvider(): RecordingProvider {
  const calls: RecordingProvider['calls'] = [];
  const rec =
    (method: keyof AnalyticsProvider) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
    };
  return {
    calls,
    optIn: rec('optIn'),
    optOut: rec('optOut'),
    identify: rec('identify'),
    capture: rec('capture'),
    flush: rec('flush'),
    reset: rec('reset'),
    captured: () =>
      calls
        .filter((c) => c.method === 'capture')
        .map((c) => ({ event: c.args[0] as string, properties: c.args[1] as Record<string, string | number | boolean> })),
  };
}

/** A provider that does nothing (web contribution page, Storybook, CI). */
export const noopProvider: AnalyticsProvider = {
  optIn() {},
  optOut() {},
  identify() {},
  capture() {},
  flush() {},
  reset() {},
};
