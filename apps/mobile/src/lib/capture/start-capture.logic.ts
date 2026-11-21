/**
 * One capture entry, the pure part (design spec 06 sections 2 P1, 10.1 and 12 step 0; PRD 01 section 3; NAV-TAB-ROLES
 * P1 and P2). Every new letter or take begins through `startCapture({ source })` in ./start-capture.ts, and this file
 * holds the closed list of sources and what each one does. Routes and params are exactly what Home did before the
 * consolidation, so a person sees no change, servers on or off.
 *
 * Sources: Home's cluster (speak, type, notMuchToday, photo) and the four doorway names the PRD README gives (widget,
 * controlCenterControl, actionButton, siri). `photo` is Home's photo start (NS-01, behind EXPO_PUBLIC_PHOTOS): called
 * once the system picker has returned a picture, it opens Listen at Ready with that picture. The doorways are reserved
 * for the hands-free work (NS-04, NS-06 Part C): until their PRs land, planning them starts nothing. Nothing that
 * arrives from outside the app turns the microphone on (lib/resilience/start-intent.ts, +native-intent.tsx); that rule
 * stays with the doorways when they are built. A new source or doorway is added here, in the same PR as its handler,
 * with a `design-systems` approval line (spec 06 section 10.3).
 *
 * Mode changes inside a capture already begun (Type instead on Listen, Record again and Write the words on Review) are
 * not starts: those screens `router.replace` among themselves and never push a capture route. Opening a waiting draft
 * from Home's cards is a resume, not a start (P9). test/navigation-one-entry.test.ts pins both.
 */
export const HOME_CAPTURE_SOURCES = ['speak', 'type', 'notMuchToday', 'photo'] as const;
export const CAPTURE_DOORWAYS = ['widget', 'controlCenterControl', 'actionButton', 'siri'] as const;
export const CAPTURE_SOURCES = [...HOME_CAPTURE_SOURCES, ...CAPTURE_DOORWAYS] as const;

export type HomeCaptureSource = (typeof HOME_CAPTURE_SOURCES)[number];
export type CaptureDoorway = (typeof CAPTURE_DOORWAYS)[number];
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

/** The two screens that begin a letter. Only start-capture.ts pushes them. */
export const CAPTURE_ROUTES = ['/listen', '/write'] as const;
export type CaptureRoute = (typeof CAPTURE_ROUTES)[number];

/** The prompt on Home when the person tapped: carried to Listen or Write as route params, as before. */
export type CapturePrompt = { key: string; libraryVersion: number };

export type CaptureRequest = { source: CaptureSource; prompt?: CapturePrompt };

export type CapturePlan =
  /** Open a capture screen. `armListen` is Speak's tap that lets Listen start the microphone (start-intent.ts). */
  | { kind: 'route'; pathname: CaptureRoute; mode: 'spoken' | 'typed'; armListen: boolean; params: Record<string, string> }
  /**
   * Home's photo start (NS-01): Listen at Ready with the picture already chosen. Not armed, because nothing records
   * until the person taps (F04, design spec 01 section 3.2), and no capture event: nothing is said or typed yet.
   */
  | { kind: 'photo'; pathname: '/listen'; params: Record<string, string> }
  /** "Not much today": a mark with no words for today (D-084), one a day. */
  | { kind: 'quietDay' }
  /** A source whose behaviour is not built yet: nothing happens. */
  | { kind: 'reserved'; source: CaptureSource };

export function isCaptureSource(value: unknown): value is CaptureSource {
  return typeof value === 'string' && (CAPTURE_SOURCES as readonly string[]).includes(value);
}

export function isCaptureDoorway(source: CaptureSource): source is CaptureDoorway {
  return (CAPTURE_DOORWAYS as readonly string[]).includes(source);
}

function promptParams(prompt: CapturePrompt | undefined): Record<string, string> {
  return prompt ? { promptKey: prompt.key, promptLibraryVersion: String(prompt.libraryVersion) } : {};
}

/** What a source does. Pure: the caller (start-capture.ts) runs it. */
export function planCapture(req: CaptureRequest): CapturePlan {
  switch (req.source) {
    case 'speak':
      return { kind: 'route', pathname: '/listen', mode: 'spoken', armListen: true, params: promptParams(req.prompt) };
    case 'type':
      return { kind: 'route', pathname: '/write', mode: 'typed', armListen: false, params: promptParams(req.prompt) };
    case 'notMuchToday':
      return { kind: 'quietDay' };
    case 'photo':
      return { kind: 'photo', pathname: '/listen', params: promptParams(req.prompt) };
    case 'widget':
    case 'controlCenterControl':
    case 'actionButton':
    case 'siri':
      return { kind: 'reserved', source: req.source };
  }
}
