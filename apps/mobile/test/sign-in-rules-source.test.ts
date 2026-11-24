/// <reference types="node" />
/**
 * BL-727: the sign-in rules chapter 05 states and nothing pinned (docs/engineering/05-identity-and-access.md).
 *  - IAM-R05, R06, R07: under apps/mobile/src the only Supabase sign-in calls are `signInWithOtp` (email, in email.ts),
 *    `signInWithIdToken` with provider `apple` (apple.ts) or `google` (google.ts), and the passkey path
 *    (`auth.passkey.*`, passkey.ts). Anonymous, password, password-reset, sign-up, OAuth, SSO and Web3 sign-in appear
 *    nowhere, in a call, a destructure or a string key.
 *  - IAM-R09: the email request sends `shouldCreateUser: true`, so a known and a new address get the same answer
 *    (no-reveal), until BL-581 decides otherwise.
 *  - IAM-R23: `.github/workflows/agents.yml` names no secret whose name holds SUPABASE or SERVICE_ROLE, and does not
 *    hand every secret over (`secrets: inherit`, `toJSON(secrets)`). This test reads the file; it changes no workflow.
 * IAM-R11 (refresh_token_reuse_interval) is pinned in supabase/tests/auth_config.test.mjs; IAM-R12 (scope `others`,
 * outbox kept when the session is lost) in test/session-provider-sign-out-rules.test.ts.
 * Each scan is a pure function with a positive control on a made-up fixture, then the real tree.
 * Mutants run for the PR (each made, seen to fail, restored): a temp file calling `sb.auth.signInAnonymously()`;
 * one calling `sb.auth.signInWithPassword`; one destructuring `resetPasswordForEmail`; `signInWithIdToken` with
 * provider 'facebook'; `signInWithOtp` outside email.ts; `shouldCreateUser: false` in email.ts; a
 * `secrets.SUPABASE_SERVICE_ROLE_KEY` line in a copy of agents.yml.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));

const MOBILE = join(__dirname, '..');
const SRC = join(MOBILE, 'src');
const REPO = join(MOBILE, '..', '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) out.push(p);
  }
  return out;
}

/** Every source file under apps/mobile/src as `[path from src with /, text]`, tests kept beside modules included. */
const tree = (): Array<[string, string]> => walk(SRC).map((p) => [relative(SRC, p).split(sep).join('/'), readFileSync(p, 'utf8')]);

/** The Supabase sign-in calls the app may make, and the one file each may live in (IAM-R05). */
const ALLOWED: Record<string, { file: string; provider?: string }[]> = {
  signInWithOtp: [{ file: 'lib/auth/email.ts' }],
  signInWithIdToken: [
    { file: 'lib/auth/apple.ts', provider: 'apple' },
    { file: 'lib/auth/google.ts', provider: 'google' },
  ],
};

/**
 * auth-js methods that start a session or an account other than the allowed ones. Any of these words anywhere under
 * src fails (IAM-R06 password and reset, IAM-R07 anonymous, IAM-R05 no other provider). `signInWithPasskey` is not
 * here: the app's own AuthApi uses that name for the passkey path, so it is held by the call scan below instead.
 */
export const BANNED = ['signInAnonymously', 'signInWithPassword', 'resetPasswordForEmail', 'signUp', 'signInWithOAuth', 'signInWithSSO', 'signInWithWeb3'];

/** Findings for one file: `<file>: <why>`. Pure, so a fixture can prove it. */
export function signInFindings(file: string, text: string): string[] {
  const out: string[] = [];
  for (const word of BANNED) {
    if (new RegExp(`\\b${word}\\b`).test(text)) out.push(`${file}: names ${word}`);
  }
  // A call on a Supabase auth client: `sb.auth.signInX(`, `sb?.auth.signInX(`, `client.auth?.signInX(`.
  for (const m of text.matchAll(/\.auth\??\.\s*(signIn\w*|signUp\w*)\s*\(\s*(\{[^)]*)?/g)) {
    const method = m[1];
    const rules = ALLOWED[method];
    if (!rules) {
      out.push(`${file}: calls auth.${method}`);
      continue;
    }
    const rule = rules.find((r) => r.file === file);
    if (!rule) {
      out.push(`${file}: calls auth.${method} outside ${rules.map((r) => r.file).join(' or ')}`);
      continue;
    }
    if (rule.provider) {
      const provider = /provider:\s*'([^']*)'/.exec(m[2] ?? '')?.[1];
      if (provider !== rule.provider) out.push(`${file}: auth.${method} with provider ${provider ?? '(not a literal)'}`);
    }
  }
  // The passkey path is the auth-js two-step API, and only passkey.ts reaches it.
  if (/\.auth\??\.\s*passkey\b/.test(text) && file !== 'lib/auth/passkey.ts') out.push(`${file}: reaches auth.passkey outside lib/auth/passkey.ts`);
  return out;
}

describe('BL-727 sign-in methods in the app source', () => {
  it('[IAM-R05] positive control: an unlisted method, a wrong provider and an allowed call in the wrong file are each reported', () => {
    expect(signInFindings('lib/x.ts', 'await sb.auth.signInWithOAuth({ provider: "github" })')).toEqual([
      'lib/x.ts: names signInWithOAuth',
      'lib/x.ts: calls auth.signInWithOAuth',
    ]);
    expect(signInFindings('lib/auth/google.ts', "sb.auth.signInWithIdToken({ provider: 'facebook', token })")).toEqual([
      'lib/auth/google.ts: auth.signInWithIdToken with provider facebook',
    ]);
    expect(signInFindings('lib/auth/apple.ts', "sb.auth.signInWithIdToken({ provider: 'google', token })")).toEqual([
      'lib/auth/apple.ts: auth.signInWithIdToken with provider google',
    ]);
    expect(signInFindings('app/x.tsx', 'await sb?.auth.signInWithOtp({ phone })')).toEqual([
      'app/x.tsx: calls auth.signInWithOtp outside lib/auth/email.ts',
    ]);
    expect(signInFindings('lib/x.ts', 'await sb.auth.signInWithPasskey()')).toEqual(['lib/x.ts: calls auth.signInWithPasskey']);
    expect(signInFindings('lib/x.ts', 'await sb.auth.passkey.startAuthentication()')).toEqual([
      'lib/x.ts: reaches auth.passkey outside lib/auth/passkey.ts',
    ]);
  });

  it('[IAM-R06][IAM-R07] positive control: anonymous, password and reset are reported as a call, a destructure or a string key', () => {
    expect(signInFindings('a.ts', 'await sb.auth.signInAnonymously()')).toContain('a.ts: names signInAnonymously');
    expect(signInFindings('a.ts', 'const { signInWithPassword } = sb.auth')).toEqual(['a.ts: names signInWithPassword']);
    expect(signInFindings('a.ts', "sb.auth['resetPasswordForEmail'](email)")).toEqual(['a.ts: names resetPasswordForEmail']);
    expect(signInFindings('a.ts', 'await sb.auth.signUp({ email })')).toContain('a.ts: names signUp');
  });

  it('[IAM-R05] negative control: the app own AuthApi names (signInWithApple, signInWithPasskey) are not Supabase calls', () => {
    expect(signInFindings('app/x.tsx', "run('passkey', auth.signInWithPasskey); void auth.signInWithApple();")).toEqual([]);
    expect(signInFindings('lib/auth/email.ts', 'await sb.auth.signInWithOtp({ email, options })')).toEqual([]);
    expect(signInFindings('lib/auth/passkey.ts', 'await sb.auth.passkey.startAuthentication()')).toEqual([]);
  });

  it('[IAM-R05][IAM-R06][IAM-R07] the banned list covers every sign-in and sign-up method the installed auth-js declares, except the allowed ones', () => {
    // Read from the installed package (CODE-R17), so an auth-js upgrade that adds a sign-in method fails here until
    // someone decides whether the app may call it.
    const rel = 'node_modules/@supabase/auth-js/dist/main/GoTrueClient.d.ts';
    const dts = readFileSync([join(MOBILE, rel), join(REPO, rel)].find((p) => existsSync(p)) ?? join(REPO, rel), 'utf8');
    const declared = new Set([...dts.matchAll(/^\s{4}(signIn\w*|signUp\w*|resetPasswordForEmail)\(/gm)].map((m) => m[1]));
    expect(declared.size).toBeGreaterThan(5);
    const held = new Set([...BANNED, ...Object.keys(ALLOWED), 'signInWithPasskey']);
    expect([...declared].filter((m) => !held.has(m))).toEqual([]);
  });

  it('[IAM-R05][IAM-R06][IAM-R07] apps/mobile/src makes only the allowed sign-in calls, and the allowed ones are where they should be', () => {
    const files = tree();
    expect(files.length).toBeGreaterThan(100);
    expect(files.flatMap(([f, t]) => signInFindings(f, t))).toEqual([]);
    // The allowed calls still exist, so the scan above is reading the files that hold them.
    const text = Object.fromEntries(files);
    expect(text['lib/auth/email.ts']).toMatch(/\.auth\.signInWithOtp\(/);
    expect(text['lib/auth/apple.ts']).toMatch(/\.auth\.signInWithIdToken\(\{ provider: 'apple'/);
    expect(text['lib/auth/google.ts']).toMatch(/\.auth\.signInWithIdToken\(\{ provider: 'google'/);
  });
});

describe('BL-727 email sign-in does not reveal whether an address has an account', () => {
  it('[IAM-R09] sendEmailLink asks Supabase with shouldCreateUser true (BL-581 may change this, with this test)', async () => {
    const { sendEmailLink } = await import('../src/lib/auth/email');
    const calls: Array<{ email: string; options: Record<string, unknown> }> = [];
    const sb = { auth: { signInWithOtp: async (a: (typeof calls)[number]) => (calls.push(a), { error: null }) } };
    await sendEmailLink(sb as never, ' asha.parent@example.com ');
    expect(calls).toHaveLength(1);
    expect(calls[0].email).toBe('asha.parent@example.com');
    expect(calls[0].options.shouldCreateUser).toBe(true);
  });
});

/** Secret names in a workflow that an agent must never get, and blanket hand-overs. Pure, so a fixture can prove it. */
export function agentSecretFindings(text: string): string[] {
  const out: string[] = [];
  const names = [
    ...[...text.matchAll(/\bsecrets\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]),
    ...[...text.matchAll(/\bsecrets\s*\[\s*['"]([^'"]+)['"]\s*\]/g)].map((m) => m[1]),
  ];
  for (const n of names) if (/SUPABASE|SERVICE_ROLE/i.test(n)) out.push(`names secret ${n}`);
  if (/^\s*secrets:\s*inherit\b/m.test(text)) out.push('passes every secret on (secrets: inherit)');
  if (/toJSON\(\s*secrets\s*\)/.test(text)) out.push('reads every secret (toJSON(secrets))');
  return out;
}

describe('BL-727 the agents workflow gets no Supabase secret', () => {
  it('[IAM-R23] positive control: a Supabase or service-role secret, by dot or by key, and a blanket hand-over are each reported', () => {
    expect(agentSecretFindings('KEY: ${{ secrets.SUPABASE_ACCESS_TOKEN }}')).toEqual(['names secret SUPABASE_ACCESS_TOKEN']);
    expect(agentSecretFindings("KEY: ${{ secrets['STAGING_SERVICE_ROLE_KEY'] }}")).toEqual(['names secret STAGING_SERVICE_ROLE_KEY']);
    expect(agentSecretFindings('k: ${{ secrets.supabase_db_password }}')).toEqual(['names secret supabase_db_password']);
    expect(agentSecretFindings('    uses: ./.github/workflows/x.yml\n    secrets: inherit\n')).toEqual(['passes every secret on (secrets: inherit)']);
    expect(agentSecretFindings('ALL: ${{ toJSON(secrets) }}')).toEqual(['reads every secret (toJSON(secrets))']);
  });

  it('[IAM-R23] negative control: the model and app keys the agents run on are not reported', () => {
    expect(agentSecretFindings('a: ${{ secrets.OPENROUTER_API_KEY }}\nb: ${{ secrets.AGENTS_APP_PRIVATE_KEY }}')).toEqual([]);
  });

  it('[IAM-R23] .github/workflows/agents.yml names no SUPABASE or SERVICE_ROLE secret', () => {
    const yml = readFileSync(join(REPO, '.github/workflows/agents.yml'), 'utf8');
    expect(yml).toMatch(/\bsecrets\./); // it does read secrets, so the scan is reading the right file
    expect(agentSecretFindings(yml)).toEqual([]);
  });
});
