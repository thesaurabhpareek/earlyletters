/// <reference types="node" />
/**
 * NS-42 R2, R3, R7 (FP-2): the one consent builder, its hash against the checked-in manifest, and the rule that
 * nothing else calls `record_policy_act` (NSC-14). Fictional Asha family only. The database half is
 * supabase/tests/consent_builder.test.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CONSENT_LOCALE, consentShownText, en } from '@scribe/content';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';

vi.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '17.4.1' } }));
vi.mock('expo-application', () => ({ nativeBuildVersion: '42' }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('../src/lib/supabase/client', () => ({ idempotencyKey: () => '0199a5b0-0000-7000-8000-00000000b001' }));

const { buildConsentAct, osMajor } = await import('../src/lib/auth/consent-record');
const { recordConsent } = await import('../src/lib/auth/consent');
const { agreementRows } = await import('../src/lib/agreements.logic');
const { sha256Hex } = await import('../src/lib/sha256');

const manifest = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'packages', 'content', 'generated', 'consent-manifest.json'), 'utf8')) as {
  locale: string;
  entries: Record<string, string>;
};
const env = { sha256: sha256Hex, appBuild: '42', appVersion: '1.0.0', osVersion: '17.4.1', platform: 'ios' as const };
const act = (over: Partial<Parameters<typeof buildConsentAct>[0]> = {}) =>
  buildConsentAct(
    {
      document: 'terms', version: '4.1.0', action: 'accept', method: 'signin_sheet', surface: 'auth.consent.terms',
      shownText: consentShownText('terms'), locale: CONSENT_LOCALE, clientRecordedAt: '2026-11-20T10:00:00.000Z',
      context: { auth: 'apple', age_attested: true }, ...over,
    },
    env,
  );

describe('consent builder', () => {
  it('[NS-42-R7] consent rows carry PRIV-R21 fields', () => {
    const a = act();
    expect(a.p_rendered_sha256).toBe(`\\x${manifest.entries.terms}`);
    expect(a.p_locale).toBe(manifest.locale);
    expect(a.p_app_build).toBe('42');
    expect(a.p_os_major).toBe(17);
    const keys = Object.keys(a).join(' ');
    expect(keys).not.toMatch(/ip|agent|device|idfv|age\b|age_signal|model/i);
    expect(JSON.stringify(a)).not.toMatch(/17\.4|iPhone/);
  });

  it('[NS-42-R7] the locale is the one shown, not a constant', () => {
    expect(act({ locale: 'fr' }).p_locale).toBe('fr');
    expect(() => act({ locale: '' })).toThrow();
    expect(() => act({ shownText: '' })).toThrow();
    expect(readFileSync(join(__dirname, '..', 'src', 'lib', 'auth', 'consent.ts'), 'utf8')).not.toMatch(/p_locale:\s*'/);
  });

  it('keeps the build and OS inside what the server accepts (never a 23514)', () => {
    expect(buildConsentAct({ document: 'terms', version: '4.1.0', action: 'accept', method: 'signin_sheet', surface: 's', shownText: 'x', locale: 'en', clientRecordedAt: 't', context: {} }, { ...env, appBuild: '42; drop' }).p_app_build).toBeNull();
    expect([osMajor('17.4'), osMajor(34), osMajor(0), osMajor(1000), osMajor(undefined)]).toEqual([17, 34, null, null, null]);
  });

  it('[NS-42-R2] the local agreement record: both rows hash the registered sentence and hold no age', () => {
    const rows = agreementRows({ sentence: consentShownText('agreement-line'), surface: 'first_run.before_you_begin', now: '2026-11-20T10:00:00.000Z', appVersion: '1.0.0', newId: (() => { let n = 0; return () => `id${++n}`; })() });
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.renderedSha256).toBe(manifest.entries['agreement-line']);
      expect(Object.keys(r).join(' ')).not.toMatch(/age|birth/i);
    }
  });

  it('[PRIV-R21] the local row hashes the sentence the age-gate screen shows (beforeBegin.agree), not another one', () => {
    // age-gate-screen.tsx passes `copy.beforeBegin.agree` to acceptBeforeYouBegin; the manifest must hash that same sentence.
    expect(consentShownText('agreement-line')).toBe(en.beforeBegin.agree);
    expect(sha256Hex(en.beforeBegin.agree)).toBe(manifest.entries['agreement-line']);
    const gate = readFileSync(join(__dirname, '..', 'src', 'components', 'gate', 'age-gate-screen.tsx'), 'utf8');
    expect(gate).toMatch(/acceptBeforeYouBegin\(\s*b\.agree\b/);
    expect(gate).toMatch(/const b = copy\.beforeBegin\b/);
  });

  it('[NS-42-R7] consent.tsx draws the keys the terms hash joins (title, body, agreeLine)', () => {
    const sheet = readFileSync(join(__dirname, '..', 'src', 'app', '(auth)', 'sign-in', 'consent.tsx'), 'utf8');
    for (const key of ['title', 'body', 'agreeLine']) expect(sheet).toContain(`{t.${key}}`);
    expect(sheet).toMatch(/const t = authCopy\.consent\.terms;/);
  });

  it('[NS-42-R3] the Terms record before any sync: one terms accept with context.auth and age_attested', async () => {
    const sent: { fn: string; args: Record<string, unknown>; key?: string }[] = [];
    const sb = {
      rpc: (fn: string, args: Record<string, unknown>) => {
        if (fn === 'policy_actions_needed') return Promise.resolve({ data: [{ document: 'terms', version: '4.1.0' }], error: null });
        const call = { fn, args } as (typeof sent)[number];
        sent.push(call);
        return { setHeader: (h: string, v: string) => { if (h === HEADER_IDEMPOTENCY_KEY) call.key = v; return Promise.resolve({ error: null }); } };
      },
    };
    await recordConsent(sb as never, 'terms', true, 'apple', 'asha-parent');
    expect(sent).toHaveLength(1);
    expect(sent[0].args).toMatchObject({ p_document: 'terms', p_action: 'accept', p_context: { auth: 'apple', age_attested: true }, p_app_build: '42', p_os_major: 17 });
    expect(sent[0].args.p_rendered_sha256).toBe(`\\x${manifest.entries.terms}`);
    await recordConsent(sb as never, 'terms', false, 'apple', 'asha-parent');
    expect(sent).toHaveLength(1); // Not now records nothing
  });

  // Question FP-2-2: backup/runtime.ts also calls record_policy_act (method backup_sheet, not a sheet method the server
  // trigger checks; backup is off in Build 12). It is listed, not moved: the backup lane owns it. Any third caller fails here.
  it('[NSC-14] buildConsentAct is the only caller of record_policy_act for the consent sheets', () => {
    const root = join(__dirname, '..', 'src');
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f) && /record_policy_act/.test(readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) hits.push(p.slice(root.length));
      }
    };
    walk(root);
    expect(hits).toEqual(['/lib/auth/consent.ts', '/lib/backup/runtime.ts']);
    expect(readFileSync(join(root, 'lib', 'auth', 'consent.ts'), 'utf8')).toMatch(/const args = buildConsentAct\([\s\S]*sb\.rpc\('record_policy_act', a\)/);
  });
});
