/// <reference types="node" />
/**
 * NS-39 first launch (card docs/product/prd/19-from-download-to-first-letter.md): R1 no network before the age
 * question, R2 no permission prompt, R12 no teaser or price, R14 a No discards a held invite.
 * Source scans carry a positive control and a named mutant. Fictional family "Asha" only.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decideGate } from '../src/lib/age-gate.logic';
import { decideEntry } from '../src/lib/agreements.logic';

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const tsx = (dir: string) => readdirSync(join(SRC, dir)).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)).map((f) => `${dir}/${f}`);

// ---------- R1 ----------
const NETWORK = /from '[^']*(supabase|session-provider|auth\/email|expo\/fetch|sync\/|analytics|remote)[^']*'|\bfetch\(|\bsupabase\b/;
/** The age question is the first thing rendered: services start only after pass, and the session provider sits in the pass branch. */
export function ageQuestionFirst(layout: string): string[] {
  const bad: string[] = [];
  const guard = layout.indexOf("if (gate.decision !== 'pass') return;");
  const start = layout.indexOf('startServices(launchedAt)');
  if (guard < 0 || start < 0 || guard > start) bad.push('services can start before the age answer');
  const ternary = layout.indexOf("gate.decision !== 'pass' ?");
  const provider = layout.indexOf('<SessionProvider');
  if (ternary < 0 || provider < ternary) bad.push('SessionProvider is outside the pass branch');
  return bad;
}

describe('[NS-39-R1] first launch never waits on the network', () => {
  it('[NS-39-R1] a fresh store asks the age question from local state alone', () => {
    const r = decideGate({ passed: false, stoppedAt: null }, Date.parse('2026-11-20T10:00:00Z'));
    expect(r.decision).toBe('ask');
    expect(decideEntry('ask', false)).toBe('ask');
  });
  it('[NS-39-R1] the root layout starts no service and mounts no session before the answer is Yes', () => {
    expect(ageQuestionFirst(read('app/_layout.tsx'))).toEqual([]);
  });
  it('[NS-39-R1] the age gate files import nothing that reaches the network', () => {
    for (const f of ['lib/age-gate.ts', 'lib/age-gate.logic.ts', 'lib/agreements.logic.ts', 'components/gate/age-gate-screen.tsx']) {
      expect({ f, hit: NETWORK.exec(read(f))?.[0] }).toEqual({ f, hit: undefined });
    }
  });
  it('[NS-39-R1] control: the pattern matches a network import', () => {
    expect(NETWORK.test("import { x } from '@/lib/supabase/client';")).toBe(true);
  });
  it('[NS-39-R1] mutant: services started before the guard is caught', () => {
    const m = read('app/_layout.tsx').replace("if (gate.decision !== 'pass') return;", '');
    expect(ageQuestionFirst(m)).not.toEqual([]);
  });
  it('[NS-39-R1] mutant: a provider above the gate is caught', () => {
    const m = '<SessionProvider>' + read('app/_layout.tsx');
    expect(ageQuestionFirst(m)).not.toEqual([]);
  });
});

// ---------- R2 ----------
const PROMPT = /\b(request\w*Permissions?\w*|requestTrackingPermissionsAsync|authenticateAsync|requestMicrophone\w*|registerForPush\w*)\s*\(/;
const FIRST_RUN_FILES = [
  'app/onboarding.tsx',
  'components/gate/age-gate-screen.tsx',
  'components/app-lock/lock-offer.tsx',
  ...tsx('components/onboarding'),
  ...tsx('lib/first-run'),
  ...tsx('app/(auth)/sign-in'),
];

describe('[NS-39-R2] no permission prompt in first run', () => {
  it('[NS-39-R2] no first-run screen calls an OS permission request', () => {
    const hits = FIRST_RUN_FILES.filter((f) => PROMPT.test(read(f)));
    expect(hits).toEqual([]);
  });
  it('[NS-39-R2] control: the listen screen, which does ask, matches the pattern', () => {
    expect(PROMPT.test(read('app/listen.tsx')) || PROMPT.test(read('components/capture/listen.logic.ts'))).toBe(true);
  });
  it('[NS-39-R2] mutant: a request added to onboarding.tsx is caught', () => {
    expect(PROMPT.test(read('app/onboarding.tsx') + '\nawait Notifications.requestPermissionsAsync();')).toBe(true);
  });
});

// ---------- R12 ----------
const TEASER = /coming soon|\$\s?\d|\d\s?(usd|\/\s?(mo|month|yr|year))|per (month|year)|free trial|\btrial\b|\bstory\b/i;
const sections = (o: Record<string, unknown>, keys: string[]) => keys.map((k) => JSON.stringify(o[k] ?? ''));

describe('[NS-39-R12] first run shows no teaser and no price', () => {
  it('[NS-39-R12] the first-run words hold no teaser, price or trial', async () => {
    const { copy } = await import('../src/lib/copy');
    const text = sections(copy.onboarding as unknown as Record<string, unknown>, ['welcome', 'promise', 'child', 'signsAs']).join(' ');
    expect(TEASER.exec(text)?.[0]).toBeUndefined();
  });
  it('[NS-39-R12] the sign-in Welcome and the first-run screens never route to or name Plus', () => {
    for (const f of ['components/onboarding/welcome-sign-in.tsx', 'components/onboarding/promise-sample.tsx']) {
      expect(/billingCopy|['"]\/plus|href="\/plus/i.test(read(f))).toBe(false);
    }
    expect(/router\.(push|replace)\(['"`]\/plus/.test(read('app/onboarding.tsx'))).toBe(false);
  });
  it('[NS-39-R12] control: the Plus words and the pattern match a price', async () => {
    const { billingCopy } = await import('@scribe/content');
    expect(TEASER.test(JSON.stringify(billingCopy)) || /plus/i.test(JSON.stringify(billingCopy.store))).toBe(true);
    expect(TEASER.test('Plus is $4.99 per month')).toBe(true);
  });
  it('[NS-39-R12] mutant: a coming-soon line on the Welcome is caught', async () => {
    const { copy } = await import('../src/lib/copy');
    const text = JSON.stringify(copy.onboarding.welcome) + ' Stories are coming soon.';
    expect(TEASER.test(text)).toBe(true);
  });
});

// ---------- R14 ----------
const store = new Map<string, string>();
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));
vi.mock('../src/lib/store', () => ({
  getSetting: vi.fn(), setSetting: vi.fn(), deleteSetting: vi.fn(), hasAgreement: vi.fn(), recordAgreement: vi.fn(),
  subscribeTo: vi.fn(), uuidv7: vi.fn(),
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('react-native', () => ({ AppState: { addEventListener: vi.fn() } }));

describe('[NS-39-R14] a No discards a held link', () => {
  const TOKEN = 'T'.repeat(43); // shape only; belongs to the fictional Asha invite
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    store.clear();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('[NS-39-R14] a No deletes the held invite token and makes no request', async () => {
    const { savePendingInvite, readPendingInvite } = await import('../src/lib/family/pending-invite');
    const { answerAgeGate } = await import('../src/lib/age-gate');
    await savePendingInvite(TOKEN);
    expect(await readPendingInvite()).not.toBeNull();
    answerAgeGate('no');
    await new Promise((r) => setTimeout(r, 0));
    expect(await readPendingInvite()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // Was it.fails while answerAgeGate('no') cleared the invite only. #1128 made a No also take the held email auth link
  // (auth/pending.ts setPendingAuthLink), so this is now an ordinary test: a No must not leave a link to be replayed.
  it('[NS-39-R14] a No deletes the held email link too', async () => {
    const { setPendingAuthLink, takePendingAuthLink } = await import('../src/lib/auth/pending');
    const { answerAgeGate } = await import('../src/lib/age-gate');
    setPendingAuthLink({ tokenHash: 'asha-hash', type: 'magiclink' });
    answerAgeGate('no');
    await new Promise((r) => setTimeout(r, 0));
    expect(takePendingAuthLink()).toBeNull();
  });

  it('[NS-39-R14] mutant: a No branch without the invite clear is caught', () => {
    const noBranch = (src: string) => /else \{[^}]*clearPendingInvite\(\)/.test(src);
    const src = read('lib/age-gate.ts');
    expect(noBranch(src)).toBe(true);
    expect(noBranch(src.replace('void clearPendingInvite();', ''))).toBe(false);
  });
});
