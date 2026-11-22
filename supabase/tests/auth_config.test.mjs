// Auth settings in supabase/config.toml (SIGN-02, TPL-12; review docs/reviews/2026-10-31/signin.md).
// No database: this file reads config.toml, the generated templates and the snippet the email library
// exports, and pins the values the app, the templates and the copy depend on. The hosted projects must
// hold the same values (supabase/auth-email.md section 3); this test cannot see them.
// Runs under `npm run test:db` (the runner passes the migration list, which this file ignores).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const supabaseDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(supabaseDir, '..');

// Minimal TOML reader for the shapes config.toml uses: [tables], key = "string" | number | bool | ["a", "b"].
export function parseToml(src) {
  const out = {};
  let table = out;
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const header = /^\[([A-Za-z0-9_.]+)\]$/.exec(line);
    if (header) {
      table = out;
      for (const k of header[1].split('.')) table = table[k] ??= {};
      continue;
    }
    const kv = /^([A-Za-z0-9_]+)\s*=\s*(.+)$/.exec(line);
    if (!kv) throw new Error(`unparsed config.toml line: ${line}`);
    const v = kv[2].trim();
    let value;
    if (v === 'true' || v === 'false') value = v === 'true';
    else if (/^-?\d+$/.test(v)) value = Number(v);
    else if (v.startsWith('"') || v.startsWith('[')) value = JSON.parse(v);
    else throw new Error(`unsupported value in config.toml: ${line}`);
    table[kv[1]] = value;
  }
  return out;
}

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}\n     ${e.message}`);
  }
};

const config = parseToml(readFileSync(join(supabaseDir, 'config.toml'), 'utf8'));
const auth = config.auth;
const email = auth.email;

check('site_url is the website origin the templates link to', () => {
  assert.equal(auth.site_url, 'https://earlyletters.com');
});

check('redirect allowlist is exactly the auth callback (website page and universal link), no wildcard, no custom scheme', () => {
  assert.deepEqual(auth.additional_redirect_urls, ['https://earlyletters.com/auth/callback']);
  for (const u of auth.additional_redirect_urls) {
    assert.ok(!u.includes('*'), `wildcard in ${u}`);
    assert.ok(u.startsWith('https://'), `not https: ${u}`);
  }
});

check('the app sends the allowlisted redirect (AUTH_CALLBACK_PATH on brand.web.origin)', () => {
  const links = readFileSync(join(repoRoot, 'apps/mobile/src/lib/auth/links.logic.ts'), 'utf8');
  const path = /AUTH_CALLBACK_PATH = '([^']+)'/.exec(links)?.[1];
  assert.equal(`${auth.site_url}${path}`, auth.additional_redirect_urls[0]);
});

check('email OTP: 6 digits, 15 minutes, confirmations on, secure email change on, 60 s per address', () => {
  assert.equal(email.otp_length, 6);
  assert.equal(email.otp_expiry, 900);
  assert.equal(email.enable_confirmations, true);
  assert.equal(email.double_confirm_changes, true);
  assert.equal(email.max_frequency, '1m');
  assert.equal(email.enable_signup, true);
});

check('rate limits match supabase/auth-email.md 3.6', () => {
  assert.deepEqual(auth.rate_limit, { email_sent: 100, sign_in_sign_ups: 30, token_verifications: 30, token_refresh: 150 });
});

check('sessions and sign-in switches', () => {
  assert.equal(auth.jwt_expiry, 900);
  assert.equal(auth.enable_anonymous_sign_ins, false);
  assert.equal(auth.enable_manual_linking, false);
  assert.equal(auth.enable_refresh_token_rotation, true);
});

check('no SMTP block and no secret value is committed', () => {
  assert.equal(email.smtp, undefined);
  for (const p of Object.values(auth.external ?? {})) {
    assert.match(p.secret, /^env\(/);
  }
});

// Templates: content_path for [auth.email.template.*] is relative to the repo root; for
// [auth.email.notification.*] it is relative to supabase/ (see the comment in config.toml).
const templates = email.template ?? {};
const notifications = email.notification ?? {};
const templatePath = (p) => join(repoRoot, p);
const notificationPath = (p) => join(supabaseDir, p);

check('every link and code template is ours, and every file exists', () => {
  assert.deepEqual(Object.keys(templates).sort(), ['confirmation', 'email_change', 'magic_link', 'reauthentication']);
  for (const [name, t] of Object.entries(templates)) {
    assert.ok(t.subject, `${name} has no subject`);
    assert.ok(existsSync(templatePath(t.content_path)), `${name}: ${t.content_path} not found from the repo root`);
  }
});

check('notifications: on for identity_linked, email_changed, identity_unlinked; off for the rest; files exist', () => {
  const on = Object.entries(notifications).filter(([, n]) => n.enabled).map(([k]) => k).sort();
  assert.deepEqual(on, ['email_changed', 'identity_linked', 'identity_unlinked']);
  for (const [name, n] of Object.entries(notifications)) {
    if (!n.content_path) continue;
    assert.ok(!n.content_path.startsWith('./supabase/'), `${name}: notification paths are relative to supabase/`);
    assert.ok(existsSync(notificationPath(n.content_path)), `${name}: ${n.content_path} not found from supabase/`);
  }
});

check('subjects and files match the snippet packages/emails exports', () => {
  const snippet = parseToml(readFileSync(join(supabaseDir, 'templates/config.toml.snippet'), 'utf8')).auth.email;
  const base = (p) => p.split('/').pop();
  for (const [name, t] of Object.entries(snippet.template ?? {})) {
    assert.equal(templates[name]?.subject, t.subject, `template ${name} subject`);
    assert.equal(base(templates[name].content_path), base(t.content_path), `template ${name} file`);
  }
  for (const [name, n] of Object.entries(snippet.notification ?? {})) {
    assert.equal(notifications[name]?.enabled, n.enabled, `notification ${name} enabled`);
    if (n.subject) assert.equal(notifications[name].subject, n.subject, `notification ${name} subject`);
    if (n.content_path) assert.equal(base(notifications[name].content_path), base(n.content_path), `notification ${name} file`);
  }
});

check('link templates build the scanner-safe fragment link, never ConfirmationURL; expiry text matches otp_expiry', () => {
  const minutes = `${email.otp_expiry / 60} minutes`;
  for (const name of ['confirmation', 'magic_link', 'email_change']) {
    const html = readFileSync(templatePath(templates[name].content_path), 'utf8');
    assert.ok(!html.includes('.ConfirmationURL'), `${name} uses ConfirmationURL`);
    assert.ok(html.includes('{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}'), `${name} lacks the fragment link`);
    assert.ok(html.includes('{{ .Token }}'), `${name} lacks the code`);
    assert.ok(html.includes(minutes), `${name} does not say "${minutes}"`);
    assert.ok(!html.includes('{{ .Data'), `${name} renders user metadata`);
  }
});

if (failures) {
  console.log(`\n${failures} auth config check(s) failed.`);
  process.exit(1);
}
console.log('\nAll auth config checks passed.');
