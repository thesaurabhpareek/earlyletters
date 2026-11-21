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
import { nextReportMark, reportNewDevice, DEVICE_ID_PATTERN, deviceClassOf, type ReportDeps } from '../src/lib/auth/new-device/report.logic';

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
