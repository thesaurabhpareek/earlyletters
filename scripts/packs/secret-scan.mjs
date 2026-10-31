#!/usr/bin/env node
/**
 * Refuses to let a pack signing key or an R2/S3 upload secret reach git
 * (docs/ops/PACKS_HOSTING.md). Plain Node, no dependencies.
 *
 *   node scripts/packs/secret-scan.mjs --staged      # before a commit: what `git add` staged (exit 1 if a secret is staged)
 *   node scripts/packs/secret-scan.mjs               # every tracked file (secret-scan.test.ts runs this in npm test and CI)
 *
 * What it looks for: the lines scripts/packs/keygen.mjs prints for the
 * password manager (`EL_SIGNING_KEY=<44 base64 characters>`) and the R2
 * secret variable with a value (`PACKS_S3_SECRET_ACCESS_KEY=<20 or more
 * characters>`). It prints only the file and line number, never the value.
 * A repo-wide secret scan in CI (all credential types) is a separate request
 * to the security owner (S20).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Each pattern matches a secret VALUE, not a mention: a placeholder such as `EL_SIGNING_KEY=...` or `<secret>` never matches. */
export const SECRET_PATTERNS = [
  { name: 'pack signing key (EL_SIGNING_KEY)', re: /EL_SIGNING_KEY\s*[=:]\s*['"]?[A-Za-z0-9+/]{43}=/ },
  { name: 'upload secret (PACKS_S3_SECRET_ACCESS_KEY)', re: /PACKS_S3_SECRET_ACCESS_KEY\s*[=:]\s*['"]?(?![<$])[^\s'"]{20,}/ },
];

/** Findings in one file's text: `[{ line, name }]`. */
export function scanText(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const p of SECRET_PATTERNS) if (p.re.test(lines[i])) out.push({ line: i + 1, name: p.name });
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
    process.stdout.write(`secret scan: no signing key or upload secret in ${staged ? 'the staged files' : 'tracked files'}\n`);
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
