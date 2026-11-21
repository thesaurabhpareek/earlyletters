#!/usr/bin/env node
/**
 * Refuses to let a pack signing key or an R2/S3 upload secret reach git
 * (docs/ops/PACKS_HOSTING.md). Plain Node, no dependencies.
 *
 *   node scripts/packs/secret-scan.mjs --staged      # before a commit: what `git add` staged (exit 1 if a secret is staged)
 *   node scripts/packs/secret-scan.mjs               # every tracked file (secret-scan.test.ts runs this in npm test and CI)
 *
 * What it looks for (a VALUE, never a mention): the lines scripts/packs/keygen.mjs prints for the
 * password manager (`EL_SIGNING_KEY=<44 base64 characters>`), the R2 secret variable with a value, a private key
 * block (also an Apple .p8), a Supabase `sb_secret_` key, a JWT whose role is `service_role`, a service-role key
 * variable with a value, an EAS `EXPO_TOKEN` value, an Anthropic `sk-ant-` key, and a GitHub token. It prints only
 * the file, the line number and the rule name, never the value (SEC-R03, BRIEF CI-SECRET).
 *
 * It reads the tree at HEAD only, NOT git history: a secret committed and later deleted is not found here. History
 * is GitHub secret scanning's job (a founder setting; docs/ops/SECRETS.md).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Each pattern matches a secret VALUE, not a mention: a placeholder such as `EL_SIGNING_KEY=...` or `<secret>` never matches. */
export const SECRET_PATTERNS = [
  { name: 'pack signing key (EL_SIGNING_KEY)', re: /EL_SIGNING_KEY\s*[=:]\s*['"]?[A-Za-z0-9+/]{43}=/ },
  { name: 'upload secret (PACKS_S3_SECRET_ACCESS_KEY)', re: /PACKS_S3_SECRET_ACCESS_KEY\s*[=:]\s*['"]?(?![<$])[^\s'"]{20,}/ },
  { name: 'private key block', re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/, check: (m, next, line) => /^\s*[A-Za-z0-9+/=]{40,}/.test(next) || /^(?:\\n|\s)+[A-Za-z0-9+/=]{40,}/.test(line.slice(m.index + m[0].length)) },
  { name: 'Supabase secret key (sb_secret_)', re: /\bsb_secret_[A-Za-z0-9_-]{20,}/, check: (m) => !obviouslyFake(m[0]) },
  { name: 'service_role JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/, check: (m) => jwtRole(m[1]) === 'service_role' && !obviouslyFake(Buffer.from(m[0].split('.')[2], 'base64url').toString('latin1')) },
  { name: 'service role key value', re: /\b(?:SUPABASE_)?SERVICE_ROLE_KEY['"]?\s*[=:]\s*['"]?(?![<$\{])[A-Za-z0-9._-]{30,}/ },
  { name: 'EAS token (EXPO_TOKEN)', re: /\bEXPO_TOKEN['"]?\s*[=:]\s*['"]?(?![<$\{])[A-Za-z0-9_-]{30,}/ },
  { name: 'Supabase access token (sbp_)', re: /\bsbp_[0-9a-f]{40}\b/ },
  { name: 'Resend key', re: /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{24,}/ },
  { name: 'AWS access key id', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, check: (m) => !obviouslyFake(m[0]) },
  { name: 'Anthropic key (sk-ant-)', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/ },
];

/** Files the repo scan skips: the scanner's own test builds its fixtures at run time but names the rules. */
export const SKIP_FILES = new Set(['scripts/packs/secret-scan.test.ts']);

/** A value a test author typed to look like a key: a run of the alphabet or digits, one repeated character, or a word that says so. */
function obviouslyFake(v) {
  return /abcdefghijklmnop|0123456789|(.)\1{7,}|example|fake|dummy|signature/i.test(v);
}

/** The `role` claim of a JWT payload (base64url JSON), or '' when it does not decode. */
function jwtRole(payload) {
  try {
    return String(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role ?? '');
  } catch {
    return '';
  }
}

/** Findings in one file's text: `[{ line, name }]`. */
export function scanText(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const p of SECRET_PATTERNS) {
      const m = p.re.exec(lines[i]);
      if (m && (!p.check || p.check(m, lines[i + 1] ?? '', lines[i]))) out.push({ line: i + 1, name: p.name });
    }
  }
  return out;
}

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { maxBuffer: 256 * 1024 * 1024 });
}

/**
 * Scans the staged version of every staged file (`staged: true`) or every
 * tracked file. Binary-looking files (a NUL byte) are skipped.
 */
export function scanRepo(cwd, { staged = false } = {}) {
  const names = git(cwd, staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  const findings = [];
  for (const name of names) {
    if (SKIP_FILES.has(name)) continue;
    let buf;
    try {
      // Staged: exactly what the commit would hold (the index). Tracked: the working tree, what the next commit would hold.
      buf = staged ? git(cwd, ['show', `:${name}`]) : readFileSync(join(cwd, name));
    } catch {
      continue; // deleted in the working tree, or a submodule
    }
    if (buf.includes(0)) continue;
    for (const f of scanText(buf.toString('utf8'))) findings.push({ file: name, ...f });
  }
  return findings;
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const staged = argv.includes('--staged');
  let findings;
  try {
    findings = scanRepo(cwd, { staged });
  } catch (e) {
    process.stderr.write(`secret scan could not read git: ${e.message}\n`);
    return 2;
  }
  if (!findings.length) {
    process.stdout.write(`secret scan: no known secret in ${staged ? 'the staged files' : 'tracked files'}\n`);
    return 0;
  }
  for (const f of findings) process.stderr.write(`SECRET ${f.file}:${f.line}: ${f.name}\n`);
  process.stderr.write(
    staged
      ? 'Do not commit this. Unstage it (git restore --staged <file>), move the secret out of the repo, and keep it only in your password manager and ~/.config/early-letters/.\n'
      : 'A secret is committed. Treat it as leaked: make a new key (docs/ops/PACKS_HOSTING.md, "Signing key custody and rotation") or rotate the R2 token.\n',
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
