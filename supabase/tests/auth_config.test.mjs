// Auth settings in supabase/config.toml (SIGN-02, TPL-12; review docs/reviews/2026-10-31/signin.md).
// No database: this file reads config.toml, the generated templates and the snippet the email library
// exports, and pins the values the app, the templates and the copy depend on. The hosted projects must
// hold the same values (supabase/auth-email.md section 3); this test cannot see them.
// Runs under `npm run test:db` (the runner passes the migration list, which this file ignores).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

check('[IAM-R07][IAM-R11] sessions and sign-in switches (BL-727 pins the reuse interval)', () => {
  assert.equal(auth.jwt_expiry, 900);
  assert.equal(auth.enable_anonymous_sign_ins, false);
  assert.equal(auth.enable_manual_linking, false);
  assert.equal(auth.enable_refresh_token_rotation, true);
  // The 10 s grace in which a retried refresh token still works; 0 would log a parent out on a flaky network (TDD 04 section 4).
  assert.equal(auth.refresh_token_reuse_interval, 10);
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

// BL-1995, NX-40-R14: docs/ops/AUTH_SETTINGS.md cites config.toml lines by number. A line added above a
// key moves it, and the register then sends a reader to the wrong line. Each pin is [row, section, key];
// the line is found in config.toml itself, so the cite must follow the file. A row with two cites lists both.
check('AUTH_SETTINGS.md cites the config.toml line that holds each key (BL-1995)', () => {
  const lines = readFileSync(join(supabaseDir, 'config.toml'), 'utf8').split('\n');
  const lineOf = (section, key) => {
    let at = '';
    for (let i = 0; i < lines.length; i++) {
      const h = /^\[([A-Za-z0-9_.]+)\]$/.exec(lines[i].trim());
      if (h) at = h[1];
      else if (at === section && new RegExp(`^${key}\\s*=`).test(lines[i])) return i + 1;
    }
    throw new Error(`config.toml has no ${key} in [${section}]`);
  };
  const doc = readFileSync(join(repoRoot, 'docs/ops/AUTH_SETTINGS.md'), 'utf8').split('\n');
  const rowText = (n) => doc.find((l) => l.startsWith(`| ${n} |`)) ?? assert.fail(`AUTH_SETTINGS.md has no row ${n}`);
  const pins = [
    [1, 'auth.email', 'otp_length'], [2, 'auth.email', 'otp_expiry'], [3, 'auth.email', 'max_frequency'],
    [4, 'auth.rate_limit', 'token_verifications'], [5, 'auth.rate_limit', 'email_sent'],
    [6, 'auth.rate_limit', 'sign_in_sign_ups'], [7, 'auth.rate_limit', 'token_refresh'],
    [8, 'auth', 'jwt_expiry'], [9, 'auth', 'enable_refresh_token_rotation'], [9, 'auth', 'refresh_token_reuse_interval'],
    [11, 'auth', 'enable_anonymous_sign_ins'], [12, 'auth', 'enable_manual_linking'],
    [13, 'auth', 'enable_signup'], [13, 'auth.email', 'enable_signup'],
    [14, 'auth.email', 'enable_confirmations'], [14, 'auth.email', 'double_confirm_changes'],
    [15, 'auth', 'site_url'], [15, 'auth', 'additional_redirect_urls'],
    [19, 'auth.external.apple', 'enabled'],
  ];
  for (const [row, section, key] of pins) {
    const n = lineOf(section, key);
    // The cite group runs from "config.toml:" to the closing parenthesis: `config.toml:45`, `:65` is two cites.
    const group = /config\.toml:([^)]*)\)/.exec(rowText(row))?.[1] ?? '';
    const cited = new Set(group.match(/\d+/g));
    assert.ok(cited.has(String(n)), `row ${row}: ${key} is at config.toml:${n}; the row cites ${[...cited].join(', ')}`);
  }
});

// ---------- BL-1893: identity linking, pinned to the versions it was read on ----------
// Read on 25 Nov 2026 (NS-54-R15, R18, R19; A-REQ-019):
//  - Supabase Identity Linking guide (supabase.com/docs/guides/auth/auth-identity-linking, page dated 16 Nov 2026):
//    identities with the same email address are linked to one user automatically; manual linking (beta) is off unless
//    the project turns it on; `linkIdentity` takes an ID token on native apps; SAML SSO users are never linked.
//  - "How Auth links identities" (supabase.com/docs/guides/auth/identities, dated 20 Jun 2024): when a new OAuth
//    identity can be linked to an existing user, Auth removes that user's unconfirmed identities, because linking to an
//    unverified address allows pre-account takeover.
//  - Installed auth-js 2.117.2 (`GoTrueClient.js` linkIdentityIdToken): posts `/token?grant_type=id_token` with
//    `link_identity: true` and this session's access token; its error codes include `identity_already_exists` and
//    `manual_linking_disabled`.
// UNVERIFIED: the auth server version that Supabase CLI 2.119.0 runs and its source (the CLI and auth repositories
// could not be read from this session); whether the same-email rule applies to the `id_token` grant exactly as to
// OAuth redirects (the guide says OAuth); and which code the server sends for an identity on another account. Those are
// the staging test BL-1893 names (Apple relay against Google). An upgrade of either pin below fails here, so the
// behaviour is read again before the new version ships.
check('BL-1893 linking behaviour was read on Supabase CLI 2.119.0 and auth-js 2.117.2; a new version is read again first', () => {
  for (const wf of ['db-cli.yml', 'deploy-db.yml', 'deploy-functions.yml']) {
    const y = readFileSync(join(repoRoot, '.github/workflows', wf), 'utf8');
    assert.equal(/SUPABASE_CLI_VERSION:\s*([0-9.]+)/.exec(y)?.[1], '2.119.0', `${wf}: re-read the linking behaviour, then move this pin`);
  }
  const lock = JSON.parse(readFileSync(join(repoRoot, 'package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/@supabase/auth-js']?.version, '2.117.2', 'auth-js moved: re-read linkIdentity, then move this pin');
  const gotrue = readFileSync(join(repoRoot, 'node_modules/@supabase/auth-js/dist/main/GoTrueClient.js'), 'utf8');
  const linkFn = gotrue.slice(gotrue.indexOf('async linkIdentityIdToken('), gotrue.indexOf('async linkIdentityIdToken(') + 1200);
  assert.match(linkFn, /grant_type=id_token/, 'linkIdentity with a token no longer uses the id_token grant');
  assert.match(linkFn, /link_identity: true/, 'linkIdentity with a token no longer asks the server to link');
  assert.match(linkFn, /jwt: /, 'linkIdentity with a token no longer sends this session, so the server cannot tie it to this account');
});

// NS-54-R19: manual linking stays off until the screen that uses it ships (BL-1894), and goes on in that same change.
// "Ships" is read from the source: a module under apps/mobile/src that imports the linking path. Both must move together.
check('[NS-54-R19][stand-in] enable_manual_linking is on exactly when an app module imports the linking path (BL-1893, BL-1894)', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(d, e.name)] : []));
  const src = join(repoRoot, 'apps/mobile/src');
  const logic = join(src, 'lib/auth/link-identity.logic.ts');
  assert.ok(existsSync(logic), 'the linking path moved: update this check');
  const users = walk(src).filter((f) => f !== logic && !/\.test\.tsx?$/.test(f) && /from '[^']*link-identity\.logic'/.test(readFileSync(f, 'utf8')));
  const callers = walk(src).filter((f) => f !== logic && /\.auth\??\.linkIdentity\s*\(/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(callers, [], 'call linkIdentity only through lib/auth/link-identity.logic.ts');
  assert.equal(auth.enable_manual_linking, users.length > 0, users.length ? `wired in ${users.join(', ')} but manual linking is off` : 'manual linking is on but no screen uses it');
});

if (failures) {
  console.log(`\n${failures} auth config check(s) failed.`);
  process.exit(1);
}
console.log('\nAll auth config checks passed.');
