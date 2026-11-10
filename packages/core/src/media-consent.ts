/**
 * The consent state machine (NX-39 v2 R3, R11, R47, R48; BL-861).
 *
 * Three layers a person can agree to, each with its own act: `media_read`
 * (reading photo dates on a tap or on open), `media_background` (the optional
 * best-effort top-up, P2c) and `occasions` (reminders for days the parent
 * typed). Seven states: not_asked, held ("Not now"), all, limited, denied,
 * narrowed (a Limited selection got smaller, or All became Limited) and
 * revoked (access was taken away in Settings).
 *
 * The rules it holds, each with a test:
 *  - The only event that can ask the system for anything is `continue`, on a
 *    sheet that is open. Launch, a note, a deep link and a notification tap
 *    never do (R3).
 *  - "Not now" holds. Only the parent opening the control shows the sheet
 *    again; a note, a launch or a chooser tap never does (R3, UR-4).
 *  - A switch is on only after its own act is recorded and while access is All
 *    or Limited (R47). If the writer fails the switch stays off.
 *  - Limited is first-class and never nags for Full. Denied is an ordinary
 *    state with no effect. Narrowed and Revoked stop reads and wipe the index (R11, R42).
 *
 * Pure: no imports, no clock, no storage, no network. The act writer is an
 * adapter interface: the home of the PRIV-R21 function is UNVERIFIED
 * (NX-39 section 14 item 30), so nothing here guesses it. An act carries no
 * media fact: a layer, an action, a way, the key of the words shown and the
 * access level iOS reports. The writer adds version, time, hash and the rest.
 * Not wired to any screen; the switches that expose it are off in production.
 */

export const CONSENT_LAYERS = Object.freeze(['media_read', 'media_background', 'occasions'] as const);
export type ConsentLayer = (typeof CONSENT_LAYERS)[number];

export const CONSENT_STATES = Object.freeze(['not_asked', 'held', 'all', 'limited', 'denied', 'narrowed', 'revoked'] as const);
export type ConsentStatus = (typeof CONSENT_STATES)[number];

export const LAUNCH_PATHS = Object.freeze(['cold', 'warm', 'notification_tap', 'deep_link', 'first_run'] as const);
export type LaunchPath = (typeof LAUNCH_PATHS)[number];

/** Where a request to show the sheet came from. Only a parent's own tap is `control` or `chooser_tap`. */
export type SheetSource = 'control' | 'chooser_tap' | 'note' | 'launch';
/** What the system question returned (or `cancelled` if it was dismissed or failed). */
export type SystemAnswer = 'all' | 'limited' | 'denied' | 'cancelled';
/** What iOS reports when the app checks. `not_determined` means it has never been asked. */
export type SystemReport = 'all' | 'limited' | 'denied' | 'not_determined';
export type AccessLevel = 'all' | 'limited';

export interface LayerState {
  readonly status: ConsentStatus;
  readonly sheet: 'closed' | 'open' | 'asking';
  readonly switchOn: boolean;
  /** An act for this agreement is on record. */
  readonly actRecorded: boolean;
  /** An agreed act has been sent to the writer and not yet confirmed. */
  readonly agreePending: boolean;
}
export type ConsentState = Readonly<Record<ConsentLayer, LayerState>>;

export type ConsentEvent =
  | { readonly type: 'launch'; readonly path: LaunchPath }
  | { readonly type: 'open_sheet'; readonly layer: ConsentLayer; readonly source: SheetSource; readonly backgroundRefreshAvailable?: boolean }
  | { readonly type: 'not_now'; readonly layer: ConsentLayer }
  | { readonly type: 'continue'; readonly layer: ConsentLayer }
  | { readonly type: 'system_answer'; readonly layer: ConsentLayer; readonly answer: SystemAnswer }
  | { readonly type: 'system_status'; readonly layer: ConsentLayer; readonly status: SystemReport; readonly selectionNarrowed?: boolean }
  | { readonly type: 'turn_on'; readonly layer: ConsentLayer }
  | { readonly type: 'turn_off'; readonly layer: ConsentLayer }
  | { readonly type: 'act_recorded'; readonly layer: ConsentLayer; readonly action: ConsentAction }
  | { readonly type: 'act_failed'; readonly layer: ConsentLayer; readonly action: ConsentAction }
  | { readonly type: 'index_wiped'; readonly layer: ConsentLayer };

export type ConsentAction = 'agreed' | 'withdrawn';

export type ConsentEffect =
  | { readonly type: 'show_sheet'; readonly layer: ConsentLayer }
  | { readonly type: 'request_authorization'; readonly layer: ConsentLayer }
  | { readonly type: 'record_act'; readonly layer: ConsentLayer; readonly action: ConsentAction; readonly method: 'sheet' | 'switch'; readonly accessLevel: AccessLevel | null }
  | { readonly type: 'wipe_index' }
  | { readonly type: 'clear_background' };

/** What the act writer is given. It adds the document version, phone time, hash of the words, app and OS fields itself. */
export interface ConsentActInput {
  readonly layer: ConsentLayer;
  readonly action: ConsentAction;
  readonly method: 'sheet' | 'switch';
  /** The `packages/content` key of the words the person was shown. */
  readonly shownKey: string;
  readonly accessLevel: AccessLevel | null;
}

/** Adapter for the PRIV-R21 act function. Its location is UNVERIFIED; it must throw or reject if the act was not recorded. */
export interface ConsentActWriter {
  record(act: ConsentActInput): Promise<void>;
}

const FRESH: LayerState = Object.freeze({ status: 'not_asked', sheet: 'closed', switchOn: false, actRecorded: false, agreePending: false });

export const initialConsentState = (): ConsentState => ({ media_read: FRESH, media_background: FRESH, occasions: FRESH });

const isGranted = (s: ConsentStatus) => s === 'all' || s === 'limited';
const isConsented = (s: ConsentStatus) => s === 'all' || s === 'limited' || s === 'narrowed';

/** True only when the person agreed, the act is on record and the switch is on. */
export function isSwitchOn(state: ConsentState, layer: ConsentLayer): boolean {
  const l = state[layer];
  return l.switchOn && l.actRecorded;
}

/** The check before every read (R42): switch on, act on record, and access All or Limited right now. */
export function canRead(state: ConsentState, layer: ConsentLayer): boolean {
  return isSwitchOn(state, layer) && isGranted(state[layer].status);
}

interface Reduced {
  readonly state: ConsentState;
  readonly effects: readonly ConsentEffect[];
}

const NOTHING = (state: ConsentState): Reduced => ({ state, effects: [] });

function patch(state: ConsentState, layer: ConsentLayer, p: Partial<LayerState>): ConsentState {
  return { ...state, [layer]: { ...state[layer], ...p } };
}

const withdrawEffects = (layer: ConsentLayer, method: 'sheet' | 'switch'): ConsentEffect[] => [
  { type: 'record_act', layer, action: 'withdrawn', method, accessLevel: null },
];

/** Switch the background layer off as part of the read layer going away. */
function cascadeBackgroundOff(state: ConsentState, recordWithdrawal: boolean): Reduced {
  const bg = state.media_background;
  if (!bg.switchOn && !bg.agreePending) return NOTHING(state);
  return {
    state: patch(state, 'media_background', { switchOn: false, actRecorded: false, agreePending: false }),
    effects: [...(recordWithdrawal ? withdrawEffects('media_background', 'switch') : []), { type: 'clear_background' }],
  };
}

function backgroundAllowed(state: ConsentState): boolean {
  return isSwitchOn(state, 'media_read') && isGranted(state.media_read.status);
}

/** The whole machine: a state and an event in, a state and effects out. */
export function reduceConsent(state: ConsentState, event: ConsentEvent): Reduced {
  if (event.type === 'launch') return NOTHING(state); // every launch path: nothing asked, nothing shown, nothing recorded

  const layer = event.layer;
  const l = state[layer];

  switch (event.type) {
    case 'open_sheet': {
      if (l.sheet !== 'closed') return NOTHING(state);
      if (layer === 'media_background' && !(event.backgroundRefreshAvailable === true && backgroundAllowed(state))) return NOTHING(state);
      const allowed =
        (l.status === 'not_asked' && event.source !== 'launch') || (l.status === 'held' && event.source === 'control');
      if (!allowed) return NOTHING(state);
      return { state: patch(state, layer, { sheet: 'open' }), effects: [{ type: 'show_sheet', layer }] };
    }

    case 'not_now': {
      if (l.sheet !== 'open') return NOTHING(state);
      return NOTHING(patch(state, layer, { sheet: 'closed', status: 'held' }));
    }

    case 'continue': {
      if (l.sheet !== 'open') return NOTHING(state);
      if (layer === 'media_background') {
        // No system question exists for this layer; its consent is the act itself.
        if (!backgroundAllowed(state)) return NOTHING(patch(state, layer, { sheet: 'closed' }));
        return {
          state: patch(state, layer, { sheet: 'closed', status: 'all', agreePending: true }),
          effects: [{ type: 'record_act', layer, action: 'agreed', method: 'sheet', accessLevel: null }],
        };
      }
      return { state: patch(state, layer, { sheet: 'asking' }), effects: [{ type: 'request_authorization', layer }] };
    }

    case 'system_answer': {
      if (l.sheet !== 'asking') return NOTHING(state);
      if (event.answer === 'cancelled') return NOTHING(patch(state, layer, { sheet: 'closed', status: 'held' }));
      if (event.answer === 'denied') return NOTHING(patch(state, layer, { sheet: 'closed', status: 'denied' }));
      if (event.answer === 'limited' && layer !== 'media_read') return NOTHING(state);
      const level: AccessLevel | null = layer === 'media_read' ? event.answer : null;
      return {
        state: patch(state, layer, { sheet: 'closed', status: event.answer, switchOn: false, actRecorded: false, agreePending: true }),
        effects: [{ type: 'record_act', layer, action: 'agreed', method: 'sheet', accessLevel: level }],
      };
    }

    case 'act_recorded': {
      if (event.action !== 'agreed' || !l.agreePending) return NOTHING(state);
      // The grant may have been taken away while the act was in flight: then it switches nothing on.
      const stillGranted = isConsented(l.status) && !(layer === 'media_background' && !backgroundAllowed(state));
      return NOTHING(patch(state, layer, { agreePending: false, actRecorded: stillGranted, switchOn: stillGranted }));
    }

    case 'act_failed': {
      if (event.action !== 'agreed') return NOTHING(state);
      return NOTHING(patch(state, layer, { agreePending: false, switchOn: false, actRecorded: false }));
    }

    case 'turn_on': {
      if (l.switchOn || l.agreePending || l.sheet !== 'closed') return NOTHING(state);
      if (!isGranted(l.status)) return NOTHING(state); // not asked, held, denied, narrowed, revoked: a sheet or Settings, never a silent switch
      if (layer === 'media_background' && !backgroundAllowed(state)) return NOTHING(state);
      return {
        state: patch(state, layer, { agreePending: true }),
        effects: [{ type: 'record_act', layer, action: 'agreed', method: 'switch', accessLevel: layer === 'media_read' ? (l.status as AccessLevel) : null }],
      };
    }

    case 'turn_off': {
      if (!l.switchOn && !l.agreePending) return NOTHING(state);
      let s = patch(state, layer, { switchOn: false, actRecorded: false, agreePending: false });
      const effects: ConsentEffect[] = [...withdrawEffects(layer, 'switch')];
      if (layer === 'media_read') {
        effects.push({ type: 'wipe_index' });
        const c = cascadeBackgroundOff(s, true);
        s = c.state;
        effects.push(...c.effects);
      } else if (layer === 'media_background') {
        effects.push({ type: 'clear_background' });
      }
      return { state: s, effects };
    }

    case 'system_status': {
      if (layer === 'media_background') return NOTHING(state); // it has no system permission of its own
      const report = event.status;
      if (report === 'all' || report === 'limited') {
        const level: ConsentStatus = layer === 'media_read' ? report : 'all';
        if (!isConsented(l.status)) {
          // Granted outside our sheet (Settings, or before a reinstall): visible, but nothing is switched on without its act.
          return NOTHING(patch(state, layer, { status: level, switchOn: false, actRecorded: false }));
        }
        if (l.status === 'narrowed') return level === 'all' ? NOTHING(patch(state, layer, { status: 'all' })) : NOTHING(state);
        if (level === 'all') return NOTHING(patch(state, layer, { status: 'all' }));
        if (l.status === 'all' || event.selectionNarrowed === true) {
          return { state: patch(state, layer, { status: 'narrowed' }), effects: [{ type: 'wipe_index' }] };
        }
        return NOTHING(state);
      }
      // denied or not_determined
      if (isConsented(l.status)) {
        let s = patch(state, layer, { status: 'revoked', switchOn: false, actRecorded: false, agreePending: false });
        const effects: ConsentEffect[] = [];
        if (layer === 'media_read') {
          effects.push({ type: 'wipe_index' });
          const c = cascadeBackgroundOff(s, false);
          s = c.state;
          effects.push(...c.effects);
        }
        return { state: s, effects };
      }
      if (report === 'denied' && (l.status === 'not_asked' || l.status === 'held')) return NOTHING(patch(state, layer, { status: 'denied' }));
      return NOTHING(state);
    }

    case 'index_wiped': {
      if (layer !== 'media_read' || l.status !== 'narrowed') return NOTHING(state);
      return NOTHING(patch(state, layer, { status: 'limited' })); // same agreement, fewer photos: no new act
    }
  }
}

export interface ConsentDeps {
  readonly writer: ConsentActWriter;
  /** The `packages/content` key of the words shown for each layer's sheet. */
  readonly shown: Readonly<Record<ConsentLayer, string>>;
  /** Called only for a `request_authorization` effect, which only `continue` can produce. */
  readonly requestAuthorization: (layer: ConsentLayer) => Promise<SystemAnswer>;
  readonly showSheet: (layer: ConsentLayer) => void;
  readonly wipeIndex: () => Promise<void>;
  readonly clearBackground: () => Promise<void>;
  readonly onChange?: (state: ConsentState) => void;
}

export interface ConsentController {
  getState(): ConsentState;
  /** Events run one at a time, in order. Resolves when the event and its follow-ups are done. */
  dispatch(event: ConsentEvent): Promise<void>;
}

/** Runs the machine against real adapters. Errors from adapters never leave a switch on and are never logged here. */
export function createConsentController(deps: ConsentDeps, initial: ConsentState = initialConsentState()): ConsentController {
  let state = initial;
  let chain: Promise<void> = Promise.resolve();

  async function run(event: ConsentEvent): Promise<void> {
    const r = reduceConsent(state, event);
    if (r.state !== state) {
      state = r.state;
      deps.onChange?.(state);
    }
    for (const effect of r.effects) await execute(effect);
  }

  async function execute(effect: ConsentEffect): Promise<void> {
    switch (effect.type) {
      case 'show_sheet':
        deps.showSheet(effect.layer);
        return;
      case 'request_authorization': {
        let answer: SystemAnswer = 'cancelled';
        try {
          answer = await deps.requestAuthorization(effect.layer);
        } catch {
          // A failed question is treated as dismissed.
        }
        await run({ type: 'system_answer', layer: effect.layer, answer });
        return;
      }
      case 'record_act': {
        let recorded = true;
        try {
          await deps.writer.record({
            layer: effect.layer,
            action: effect.action,
            method: effect.method,
            shownKey: deps.shown[effect.layer],
            accessLevel: effect.accessLevel,
          });
        } catch {
          recorded = false;
        }
        await run({ type: recorded ? 'act_recorded' : 'act_failed', layer: effect.layer, action: effect.action });
        return;
      }
      case 'wipe_index':
        try {
          await deps.wipeIndex();
        } catch {
          return; // not acknowledged: the layer stays Narrowed and reads stay blocked
        }
        await run({ type: 'index_wiped', layer: 'media_read' });
        return;
      case 'clear_background':
        try {
          await deps.clearBackground();
        } catch {
          // The layer is already off; a later open clears again.
        }
        return;
    }
  }

  return {
    getState: () => state,
    dispatch(event) {
      const p = chain.then(() => run(event));
      chain = p.catch(() => undefined);
      return p;
    },
  };
}
