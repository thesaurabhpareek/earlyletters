/// <reference types="node" />
/**
 * NS-40 first-run age rows, cited under their own ids (test plan B13 risk 14, T7-126; until now only PRD-REQ-019 and
 * LEGAL-REQ-002 named these rules). R1: the age question comes first, nothing selected, nothing stored. R8: No at the
 * age step ends the session: only the time of the No is kept, nothing is sent. R9, R10 and R12 (the D-131 country
 * check) are in auth-region-refused.test.ts, first-run-welcome-refused.test.ts and country-hook-counts.test.ts.
 * BL-1168 adds R2 (Yes stores a boolean only), R3 (No creates nothing and holds 24 hours) and R13 (VoiceOver and AX5,
 * read as source like a11y-ax5.test.ts). Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  writes: [] as string[],
  clearedInvite: 0,
  clearedEmail: 0,
  tookLink: 0,
  agreements: [] as { rows: readonly object[]; passAge: boolean }[],
}));

vi.mock('react', async () => {
  const { reactStandIn } = await import('./helpers/mini-react');
  return { ...reactStandIn, useCallback: <T,>(fn: T, deps: readonly unknown[]) => reactStandIn.useMemo(() => fn, deps) };
});
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: () => { h.clearedInvite++; return Promise.resolve(); } }));
// The sign-in link and email request stores sit on secure-storage (expo-secure-store); this file observes neither.
vi.mock('../src/lib/auth/pending', () => ({
  clearPendingEmailRequest: () => { h.clearedEmail++; return Promise.resolve(); },
  takePendingAuthLink: () => { h.tookLink++; return null; },
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/store', () => ({
  hasAgreement: () => false,
  recordAgreement: (rows: readonly object[], passAge: boolean) => { h.agreements.push({ rows, passAge }); },
  uuidv7: () => 'id',
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => { h.writes.push(k); h.settings.set(k, v); },
  deleteSetting: (k: string) => { h.settings.delete(k); },
  subscribeTo: () => () => {},
}));

const { answerAgeGate, acceptBeforeYouBegin } = await import('../src/lib/age-gate');
const { continueBeforeBegin } = await import('../src/lib/agreements.logic');
const { decideGate } = await import('../src/lib/age-gate.logic');
const { renderHook } = await import('./helpers/mini-react');
const { tokens } = await import('@scribe/design-tokens');
const { useAgeGate } = await import('../src/lib/age-gate');

beforeEach(() => {
  h.settings.clear();
  h.writes.length = 0;
  h.clearedInvite = 0;
  h.clearedEmail = 0;
  h.tookLink = 0;
  h.agreements.length = 0;
});

describe('NS-40 the age question', () => {
  it('[NS-40-R1] the age question comes first: a fresh install is asked, nothing is selected and nothing is written', () => {
    const run = renderHook(() => useAgeGate());
    expect(run.result.current.decision).toBe('ask');
    expect(h.writes).toEqual([]);
    expect(h.settings.size).toBe(0);
    expect(decideGate({ passed: false, stoppedAt: null }, Date.now()).decision).toBe('ask');
  });

  it('[NS-40-R8] No at the age step ends the session: only ageGate.stoppedAt is stored, as a time, and nothing is sent', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    try {
      const run = renderHook(() => useAgeGate());
      answerAgeGate('no');
      expect([...h.settings.keys()]).toEqual(['ageGate.stoppedAt']);
      expect(new Date(h.settings.get('ageGate.stoppedAt')!).toISOString()).toBe(h.settings.get('ageGate.stoppedAt'));
      expect(h.settings.has('ageGate.passed')).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      run.result.current.refresh();
      expect(run.result.current.decision).toBe('stop');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('[NS-40-R8] a No also drops an invite link that opened the app', () => {
    answerAgeGate('no');
    expect(h.clearedInvite).toBe(1);
  });
});

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (rel: string) => code(readFileSync(join(SRC, rel), 'utf8'));

describe('[NS-40-R2] Yes stores a boolean only', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('[NS-40-R2] Yes and a tick: the only setting written is ageGate.passed = 1, with no age, date, range or time, and nothing is sent', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(continueBeforeBegin({ adult: true, agreed: true, returning: false })).toMatchObject({ kind: 'accept', passAge: true });
    answerAgeGate('yes');
    expect([...h.settings.entries()]).toEqual([['ageGate.passed', '1']]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('[NS-40-R2] the agreement transaction carries the age as the flag passAge and no age value in any row', () => {
    acceptBeforeYouBegin('I agree.', 'first_run.before_you_begin', true);
    expect(h.agreements).toHaveLength(1);
    expect(h.agreements[0].passAge).toBe(true);
    const keys = h.agreements[0].rows.flatMap((r) => Object.keys(r));
    expect(keys.join(' ')).not.toMatch(/age|birth|range|signal|yes/i);
  });

  it('[NS-40-R2] Yes without a tick stores nothing, and the gate never keeps the time of a Yes', () => {
    expect(continueBeforeBegin({ adult: true, agreed: false, returning: false })).toEqual({ kind: 'reason', reason: 'tickBox' });
    expect(h.settings.size).toBe(0);
    const logic = src('lib/age-gate.logic.ts');
    expect(logic).toMatch(/answer === 'yes' \? \{ passed: true, stoppedAt: null \}/);
  });

  it('[NS-40-R2] mutant: a Yes that also kept the time is caught by the single-key check', () => {
    const real = src('lib/age-gate.ts');
    const keepsTime = (t: string) => /setSetting\(PASSED, (?!'1')/.test(t) || /setSetting\(PASSED, '1'\);\s*setSetting\((?!STOPPED_AT)/.test(t);
    expect(keepsTime(real)).toBe(false);
    expect(keepsTime(real.replace("setSetting(PASSED, '1');", "setSetting(PASSED, '1');\n    setSetting('ageGate.passedAt', new Date().toISOString());"))).toBe(true);
  });
});

describe('[NS-40-R3] No creates nothing and holds 24 hours', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const T0 = Date.parse('2026-11-24T09:00:00.000Z');
  const DAY = 24 * 60 * 60 * 1000; // literal on purpose: the test must not follow a changed constant

  it('[NS-40-R3] No: the stop shows, exactly one row, a held invite, link and email request are dropped, zero requests', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const run = renderHook(() => useAgeGate());
    answerAgeGate('no');
    expect(h.settings.size).toBe(1);
    expect(h.settings.has('ageGate.stoppedAt')).toBe(true);
    expect([h.clearedInvite, h.tookLink, h.clearedEmail]).toEqual([1, 1, 1]);
    expect(fetchSpy).not.toHaveBeenCalled();
    run.result.current.refresh();
    expect(run.result.current.decision).toBe('stop');
  });

  it('[NS-40-R3] a relaunch at 23 h 59 min still shows the stop, and at 24 h the question is offered again', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    answerAgeGate('no');
    vi.setSystemTime(T0 + DAY - 60_000);
    expect(renderHook(() => useAgeGate()).result.current.decision).toBe('stop');
    vi.setSystemTime(T0 + DAY);
    expect(renderHook(() => useAgeGate()).result.current.decision).toBe('ask');
  });

  it('[NS-40-R3] no file is written: the gate and its logic import no file system module', () => {
    for (const f of ['lib/age-gate.ts', 'lib/age-gate.logic.ts']) {
      expect(readFileSync(join(SRC, f), 'utf8'), f).not.toMatch(/expo-file-system|FileSystem|documentDirectory|node:fs|writeAsStringAsync/);
    }
  });

  it('[NS-40-R3] mutant: a No that forgets the held invite, or sends something, is caught by the same checks', () => {
    const real = src('lib/age-gate.ts');
    const dropsInvite = (t: string) => /else \{[\s\S]*clearPendingInvite\(\)[\s\S]*\}\s*\}/.test(t);
    expect(dropsInvite(real)).toBe(true);
    expect(dropsInvite(real.replace('void clearPendingInvite();', ''))).toBe(false);
    const sends = (t: string) => /fetch\(|supabase|getSupabase/.test(t);
    expect(sends(real)).toBe(false);
    expect(sends(real.replace('void clearPendingInvite();', "void fetch('/x');"))).toBe(true);
  });
});

describe('[NS-40-R13] the age screen works with VoiceOver and at AX5', () => {
  const screen = () => src('components/gate/age-gate-screen.tsx');

  it('[NS-40-R13] focus starts on the question, and the stop line and each reason are announced', () => {
    const s = screen();
    expect(s).toMatch(/useFocusOnMount\(question, view !== 'stop', view\)/);
    expect(s).toMatch(/<Text ref=\{question\} variant="display" asHeading=\{1\}/);
    expect(s).toMatch(/announceForAccessibility\(g\.stopTitle\)/);
    expect(s).toMatch(/announce\(b\[out\.reason\]\)/);
    expect(s).toMatch(/accessibilityLiveRegion="polite"/);
  });

  it('[NS-40-R13] the answers read as a choice of two with none selected: a radio group named by the question, two radios, nothing preselected', () => {
    const s = screen();
    expect(s).toMatch(/accessibilityRole="radiogroup"\s+accessibilityLabel=\{label\}/);
    expect(s).toMatch(/accessibilityRole="radio"/);
    expect(s).toMatch(/aria-checked=\{selected\}/);
    expect(s).toMatch(/useState<boolean \| null>\(null\)/);
    expect(s.match(/<Answer /g)).toHaveLength(2);
  });

  it('[NS-40-R13] AX5: the answers stack, the column scrolls so Continue is reachable, and no text is capped or shrunk; targets are 44 pt or more', () => {
    const s = screen();
    expect(s).toMatch(/flexDirection: stacked \? 'column' : 'row'/);
    expect(s).toMatch(/<ScrollView contentContainerStyle=\{\{ flexGrow: 1/);
    expect(s).not.toMatch(/numberOfLines|adjustsFontSizeToFit|ellipsizeMode|maxFontSizeMultiplier|allowFontScaling=\{false\}/);
    expect(s).toMatch(/minHeight: ROOM\.answerHeight/);
    expect(s).toMatch(/answerHeight: tokens\.target\.primary/);
    expect(tokens.target.primary).toBeGreaterThanOrEqual(44);
  });

  it('[NS-40-R13] mutant: a capped line, a lost radio role and a question that never takes focus are each caught', () => {
    const real = screen();
    const capped = (t: string) => /numberOfLines|adjustsFontSizeToFit/.test(t);
    expect(capped(real)).toBe(false);
    expect(capped(real.replace('variant="display"', 'variant="display" numberOfLines={1}'))).toBe(true);
    const hasRadio = (t: string) => /accessibilityRole="radio"/.test(t) && /accessibilityRole="radiogroup"/.test(t);
    expect(hasRadio(real)).toBe(true);
    expect(hasRadio(real.replace('accessibilityRole="radio"', 'accessibilityRole="button"'))).toBe(false);
    const focuses = (t: string) => /useFocusOnMount\(question, view !== 'stop', view\)/.test(t);
    expect(focuses(real.replace('useFocusOnMount(question, view', 'useFocusOnMount(null, view'))).toBe(false);
  });
});
