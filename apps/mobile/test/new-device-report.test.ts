/// <reference types="node" />
/**
 * The app side of the new-device sign-in email (NDR-1, NS-08-R21). Pure logic, the device wiring over a fake client, the
 * flag, and the Erase everything and sign-out rules. Mutants are named in the comments: each rule goes red if broken.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { parseNewDeviceEmailFlag, setNewDeviceEmailForTest } from '../src/lib/auth/new-device/flag';
import { authReducer, initialAuthState, type AuthEvent } from '../src/lib/auth/machine.logic';
import { methodForEvent, nextReportMark, reportNewDevice, DEVICE_ID_PATTERN, deviceClassOf, type ReportDeps } from '../src/lib/auth/new-device/report.logic';

const kc = new Map<string, string>();
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + kc.size + 3) % 256) }));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => kc.get(k) ?? null,
    setItem: async (k: string, v: string) => void kc.set(k, v),
    removeItem: async (k: string) => void kc.delete(k),
  },
}));

const SRC = join(__dirname, '..', 'src');
const CANARY_TOKEN = 'zqxjkcanarytoken.abc.def';
const CANARY_ID = 'zqxjkcanarydeviceid0123456789';

const st = {
  checking: (method: 'email' | null): AuthState => ({ status: 'checkingConsent', userId: 'u1', method }) as AuthState,
  needs: { status: 'needsConsent', userId: 'u1', method: 'email', steps: ['terms'] } as unknown as AuthState,
  ready: (sync: 'on' | 'off' | 'unknown'): AuthState => ({ status: 'ready', userId: 'u1', sync }) as AuthState,
  out: { status: 'signedOut' } as AuthState,
};

/** The provider's loop over states, counting calls. */
function run(states: AuthState[]): number {
  let mark: string | null = null;
  let calls = 0;
  for (const s of states) {
    const n = nextReportMark(mark, s);
    mark = n.mark;
    if (n.call) calls++;
  }
  return calls;
}

function deps(over: Partial<ReportDeps> = {}): ReportDeps & { sent: Array<{ token: string; body: Record<string, unknown> }> } {
  const sent: Array<{ token: string; body: Record<string, unknown> }> = [];
  return {
    sent,
    enabled: () => true,
    deviceId: async () => CANARY_ID,
    accessToken: async () => CANARY_TOKEN,
    deviceClass: 'apple',
    send: async (i) => (sent.push(i), true),
    ...over,
  };
}

describe('[NS-08-R21] when the call runs: once per settled sign-in', () => {
  it('runs once for a sign-in, however many times the state is ready again', () => {
    expect(run([st.checking('email'), st.ready('on'), st.ready('on'), st.ready('on')])).toBe(1); // mutant: no mark spend -> 3
  });
  it('runs again for the next sign-in', () => {
    expect(run([st.checking('email'), st.ready('on'), st.out, st.checking('email'), st.ready('on')])).toBe(2);
  });
  it('waits for consent to be recorded', () => {
    expect(run([st.checking('email'), st.needs])).toBe(0);
    expect(run([st.checking('email'), st.needs, st.ready('on')])).toBe(1);
  });
  it('never runs with sync off or unknown (consent not recorded), nor for a restored session', () => {
    expect(run([st.checking('email'), st.ready('off')])).toBe(0);
    expect(run([st.checking('email'), st.ready('unknown')])).toBe(0);
    expect(run([st.checking(null), st.ready('on')])).toBe(0);
    expect(run([st.out, st.ready('on')])).toBe(0);
  });
  it('a sign-out in between drops the mark', () => {
    expect(run([st.checking('email'), st.out, st.ready('on')])).toBe(0);
  });
});

describe('[NS-08-R21] what is sent', () => {
  it('sends the class and the id in the body and the token only as bearer: no ids of the account in the body', async () => {
    const d = deps();
    await reportNewDevice(d);
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].token).toBe(CANARY_TOKEN);
    expect(Object.keys(d.sent[0].body).sort()).toEqual(['class', 'device_id']); // mutant: add user_id or session_id -> red
    expect(d.sent[0].body).toEqual({ class: 'apple', device_id: CANARY_ID });
    expect(JSON.stringify(d.sent[0].body)).not.toContain(CANARY_TOKEN);
  });
  it('the class is apple on iPhone and other elsewhere', () => {
    expect(deviceClassOf('ios')).toBe('apple');
    expect(deviceClassOf('android')).toBe('other');
    expect(deviceClassOf('web')).toBe('other');
  });
  it('flag off makes no call and does not even read the id or the token', async () => {
    const d = deps({ enabled: () => false, deviceId: vi.fn(async () => CANARY_ID), accessToken: vi.fn(async () => CANARY_TOKEN) });
    await reportNewDevice(d);
    expect(d.sent).toHaveLength(0); // mutant: ignore the flag -> 1
    expect(d.deviceId).not.toHaveBeenCalled();
  });
  it('no token, no id, or an id the function would refuse: no call', async () => {
    for (const over of [{ accessToken: async () => null }, { deviceId: async () => null }, { deviceId: async () => 'short' }, { deviceId: async () => 'has space in it 12345' }]) {
      const d = deps(over);
      await reportNewDevice(d);
      expect(d.sent).toHaveLength(0);
    }
  });
});

describe('[NS-08-R21] a failure never blocks, retries once, and says nothing', () => {
  let spies: Array<ReturnType<typeof vi.spyOn>>;
  beforeEach(() => {
    spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((c) => vi.spyOn(console, c).mockImplementation(() => {}));
  });
  afterEach(() => spies.forEach((s) => s.mockRestore()));

  it('a send that returns false or throws is tried at most twice and resolves', async () => {
    for (const send of [vi.fn(async () => false), vi.fn(async () => { throw new Error(`boom ${CANARY_TOKEN} ${CANARY_ID}`); })]) {
      await expect(reportNewDevice(deps({ send }))).resolves.toBeUndefined();
      expect(send).toHaveBeenCalledTimes(2); // mutant: loop of 3 -> red
    }
  });
  it('a success is not repeated', async () => {
    const send = vi.fn(async () => true);
    await reportNewDevice(deps({ send }));
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('a throwing id or token read resolves too', async () => {
    await expect(reportNewDevice(deps({ deviceId: async () => { throw new Error(CANARY_ID); } }))).resolves.toBeUndefined();
  });
  it('the canary token and id reach no console channel, on success or failure', async () => {
    await reportNewDevice(deps());
    await reportNewDevice(deps({ send: async () => { throw new Error(`${CANARY_TOKEN} ${CANARY_ID}`); } }));
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });
  it('the sources have no console call or logger', () => {
    for (const f of ['flag.ts', 'key.ts', 'report.logic.ts', 'report.ts']) {
      expect(readFileSync(join(SRC, 'lib/auth/new-device', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), f).not.toMatch(/console\.|logEvent|track\(/);
    }
  });
});

describe('[NS-08-R21] the flag', () => {
  it('only the word on turns it on, read from EXPO_PUBLIC_NEW_DEVICE_EMAIL', () => {
    for (const raw of [undefined, null, '', 'off', 'true', '1']) expect(parseNewDeviceEmailFlag(raw)).toBe(false);
    expect(parseNewDeviceEmailFlag(' ON ')).toBe(true);
    expect(readFileSync(join(SRC, 'lib/auth/new-device/flag.ts'), 'utf8')).toMatch(/process\.env\.EXPO_PUBLIC_NEW_DEVICE_EMAIL/);
    setNewDeviceEmailForTest(null);
  });
  it('is not set in any eas.json profile', () => {
    expect(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')).not.toContain('NEW_DEVICE_EMAIL');
  });
});

describe('[NS-08-R21] the install id', () => {
  beforeEach(() => kc.clear());
  const wire = async () => {
    vi.resetModules();
    const flag = await import('../src/lib/auth/new-device/flag');
    return { ...(await import('../src/lib/auth/new-device/report')), setFlag: flag.setNewDeviceEmailForTest };
  };
  it('is random once, hex of 32 bytes, stable across sign-ins and in the shape the function accepts', async () => {
    const { deviceIdOnce } = await wire();
    const a = await deviceIdOnce();
    const b = await deviceIdOnce();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(DEVICE_ID_PATTERN.test(a as string)).toBe(true);
    expect(b).toBe(a); // mutant: new id each call -> red
    expect(kc.get('scribe.auth.deviceId')).toBe(a);
  });
  it('a stored id that is not in shape is replaced; an unreadable Keychain gives null, never a throw', async () => {
    const { deviceIdOnce } = await wire();
    kc.set('scribe.auth.deviceId', 'x');
    expect(await deviceIdOnce()).toMatch(/^[0-9a-f]{64}$/);
  });
  it('is never derived from a hardware or advertising id', () => {
    const src = readFileSync(join(SRC, 'lib/auth/new-device/report.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/ \/\*.*?\*\//g, '');
    expect(src).not.toMatch(/expo-device|expo-application|advertis|idfa|idfv|getIosIdForVendor|getRandomBytes\(\s*0/i);
  });
  it('the call goes to new-device-fill with the token as bearer and no ids in the body', async () => {
    const { reportNewDeviceFor, setFlag } = await wire();
    setFlag(true);
    const invoke = vi.fn(async () => ({ data: { status: 'ok' }, error: null }));
    const sb = { auth: { getSession: async () => ({ data: { session: { access_token: CANARY_TOKEN } } }) }, functions: { invoke } };
    await reportNewDeviceFor(sb as never);
    const [name, opts] = invoke.mock.calls[0] as unknown as [string, { method: string; body: Record<string, unknown>; headers: Record<string, string> }];
    expect(name).toBe('new-device-fill');
    expect(opts.headers).toEqual({ Authorization: `Bearer ${CANARY_TOKEN}` });
    expect(Object.keys(opts.body).sort()).toEqual(['class', 'device_id']);
    expect(opts.body.class).toBe('apple');
    setFlag(false);
    await reportNewDeviceFor(sb as never);
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});

describe('[NS-08-R21] Erase everything clears the id; sign-out keeps it', () => {
  it('erase-everything.ts clears DEVICE_ID_KEY with the sign-in leftovers, after the days, backup and recordings steps', () => {
    const src = readFileSync(join(SRC, 'lib/erase-everything.ts'), 'utf8');
    expect(src).toMatch(/SIGN_IN_LEFTOVERS = \[[^\]]*DEVICE_ID_KEY[^\]]*\]/);
    expect(src.indexOf('eraseDaysFile();')).toBeLessThan(src.indexOf('deleteBackupFiles();'));
    expect(src.indexOf('deleteBackupFiles();')).toBeLessThan(src.indexOf('for (const key of SIGN_IN_LEFTOVERS)'));
  });
  it('the sign-out settle path never touches the id', () => {
    const src = readFileSync(join(SRC, 'lib/auth/session-provider.tsx'), 'utf8');
    expect(src).not.toMatch(/DEVICE_ID_KEY|deviceId|clearDeviceId/);
  });
});

/** The provider's real path: the real reducer, the method each auth event carries, and the report mark. */
function session(events: Array<{ auth: string; ev: AuthEvent; ref: 'email' | null }>): number {
  let state: AuthState = initialAuthState;
  let mark: string | null = null;
  let calls = 0;
  const step = (e: AuthEvent) => {
    state = authReducer(state, e);
    const n = nextReportMark(mark, state);
    mark = n.mark;
    if (n.call) calls++;
  };
  for (const { auth, ev, ref } of events) {
    step(ev.type === 'SIGNED_IN' ? { ...ev, method: methodForEvent(auth, ref) } : ev);
    if (state.status === 'checkingConsent' || state.status === 'needsConsent') step({ type: 'GATE_LOADED', gate: GATE_ON, sensitiveDeclined: false });
  }
  return calls;
}
const GATE_ON = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true } as never;
const signedIn = (auth: string, ref: 'email' | null) => ({ auth, ev: { type: 'SIGNED_IN', userId: 'u1', method: null } as AuthEvent, ref });

describe('[NDA-1] a sign-in through the email link is fresh; a restored session is not', () => {
  it('a fresh link sign-in reports once, however often Supabase repeats SIGNED_IN', () => {
    const r = session([{ auth: '', ev: { type: 'RESTORED', userId: null }, ref: null }, signedIn('SIGNED_IN', 'email'), signedIn('SIGNED_IN', 'email')]);
    expect(r).toBe(1); // mutant: link never sets the method -> 0
  });
  it('a restored session never reports, even with a stale method left in the ref (INITIAL_SESSION carries none)', () => {
    expect(session([{ auth: '', ev: { type: 'RESTORED', userId: 'u1' }, ref: null }, signedIn('INITIAL_SESSION', null)])).toBe(0);
    expect(session([signedIn('INITIAL_SESSION', 'email')])).toBe(0); // mutant: methodForEvent returns current -> 1
  });
  it('a link opened after a cold start (app killed since the email was asked for, state still restoring) reports once', () => {
    expect(session([signedIn('SIGNED_IN', 'email'), { auth: '', ev: { type: 'RESTORED', userId: null }, ref: null }])).toBe(1);
    expect(session([{ auth: '', ev: { type: 'RESTORED', userId: null }, ref: null }, { auth: '', ev: { type: 'START', method: 'email' }, ref: null }, signedIn('SIGNED_IN', 'email')])).toBe(1);
  });
  it('methodForEvent keeps the method for every event but INITIAL_SESSION', () => {
    expect(methodForEvent('SIGNED_IN', 'email')).toBe('email');
    expect(methodForEvent('INITIAL_SESSION', 'email')).toBeNull();
    expect(methodForEvent('SIGNED_IN', null)).toBeNull();
  });
  it('the provider sets the method before the exchange, reads it through methodForEvent, and clears it on a failed link', () => {
    const src = readFileSync(join(SRC, 'lib/auth/session-provider.tsx'), 'utf8');
    expect(src).toMatch(/methodRef\.current = 'email';\s*if \(stateRef\.current\.status[^\n]*\n\s*return verifyEmailLinkPkce\(sb, hash, t\)/);
    expect(src).toContain('method: methodForEvent(event, methodRef.current)');
    expect(src).toMatch(/methodRef\.current = null;[^\n]*\n\s*dispatch\(\{ type: 'FAILED', error \}\)/);
  });
});

describe('[NDA-1] sync is judged once, when the fresh sign-in reaches ready', () => {
  it('sync off or unknown at ready drops the mark: turning sync on later in the same run never calls', () => {
    expect(run([st.checking('email'), st.ready('off'), st.ready('on')])).toBe(0); // mutant: keep the mark -> 1
    expect(run([st.checking('email'), st.ready('unknown'), st.ready('on')])).toBe(0);
  });
  it('sync on at ready still calls once', () => {
    expect(run([st.checking('email'), st.ready('on'), st.ready('off'), st.ready('on')])).toBe(1);
  });
});

describe('[NDA-1] a timed-out first attempt is cancelled and never overlaps the retry', () => {
  beforeEach(() => {
    kc.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  const wire = async () => {
    vi.resetModules();
    const flag = await import('../src/lib/auth/new-device/flag');
    flag.setNewDeviceEmailForTest(true);
    return { ...(await import('../src/lib/auth/new-device/report')), flag };
  };
  const client = (invoke: unknown) => ({ auth: { getSession: async () => ({ data: { session: { access_token: CANARY_TOKEN } } }) }, functions: { invoke } }) as never;

  it('aborts the first attempt at the cap, then retries once', async () => {
    const { reportNewDeviceFor, flag } = await wire();
    const signals: AbortSignal[] = [];
    const invoke = vi.fn((_n: string, o: { signal: AbortSignal }) => {
      signals.push(o.signal);
      return signals.length === 1 ? new Promise(() => {}) : Promise.resolve({ error: null });
    });
    const done = reportNewDeviceFor(client(invoke));
    await vi.advanceTimersByTimeAsync(8_001);
    await done;
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true); // mutant: no abort -> false
    expect(signals[1].aborted).toBe(false);
    flag.setNewDeviceEmailForTest(null);
  });
  it('a second ask while one is in flight shares it: at most one call at a time', async () => {
    const { reportNewDeviceFor, flag } = await wire();
    const invoke = vi.fn(async () => ({ error: null }));
    const sb = client(invoke);
    await Promise.all([reportNewDeviceFor(sb), reportNewDeviceFor(sb)]);
    expect(invoke).toHaveBeenCalledTimes(1); // mutant: no cap -> 2
    await reportNewDeviceFor(sb); // after it settled, the next sign-in may call again
    expect(invoke).toHaveBeenCalledTimes(2);
    flag.setNewDeviceEmailForTest(null);
  });
});
