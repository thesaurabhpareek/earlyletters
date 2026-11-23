/// <reference types="node" />
/**
 * NS-07-G11-5 (BL-975): the privacy label guard job is safe to switch on. The job file is read as data: when the founder
 * copies it to .github/workflows/, this test follows it there (it prefers that path when the file exists), so the copy
 * is one command and the test keeps guarding the live file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '..', '..', '..');
const LIVE = join(REPO, '.github', 'workflows', 'label-guard.yml');
const PROPOSED = join(REPO, 'docs', 'ops', 'proposed', 'workflows', 'label-guard.yml');
const FILE = existsSync(LIVE) ? LIVE : PROPOSED;

/** Everything wrong with a job file, as short sentences. Empty means it is safe. Pure, so a mutant can prove each rule. */
export function problems(yml: string): string[] {
  const out: string[] = [];
  const lines = yml.split(/\r?\n/);
  const code = lines.filter((l) => !/^\s*#/.test(l));
  const text = code.join('\n');
  if (/^\s*pull_request_target\s*:/m.test(text)) out.push('uses pull_request_target');
  const types = /^\s+types:\s*\[([^\]]*)\]/m.exec(text)?.[1].split(',').map((t) => t.trim()) ?? [];
  for (const t of ['opened', 'synchronize', 'reopened', 'edited']) if (!types.includes(t)) out.push(`trigger types lack ${t}`);
  // permissions: exactly `contents: read` at the top level
  const perm = /^permissions:\s*\n((?:[ \t]+\S.*\n?)+)/m.exec(text)?.[1].split('\n').map((l) => l.trim()).filter(Boolean) ?? [];
  if (perm.length !== 1 || perm[0] !== 'contents: read') out.push('permissions are not exactly contents: read');
  if (!/git worktree add --detach "\$RUNNER_TEMP\/base" "origin\/\$BASE_REF"/.test(text)) out.push('no base worktree');
  if (!/node "\$RUNNER_TEMP\/base\/scripts\/release\/label-effect\.mjs"/.test(text)) out.push('the guard is not the base worktree copy');
  if (/continue-on-error|\|\|\s*true/.test(text)) out.push('the job can pass on a guard error');
  // the PR body (any github.event text) reaches a script only through env, never inside run text
  for (let i = 0; i < code.length; i++) {
    const m = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(code[i]);
    if (!m) continue;
    const body = [m[2]];
    for (let j = i + 1; j < code.length && (code[j].trim() === '' || code[j].search(/\S/) > m[1].length + 1); j++) body.push(code[j]);
    if (body.some((l) => l.includes('${{'))) out.push(`an expression inside run text at line ${i + 1}`);
  }
  if (!/PR_BODY:\s*\$\{\{\s*github\.event\.pull_request\.body\s*\}\}/.test(text)) out.push('the PR body is not passed through PR_BODY');
  for (const l of code) if (/\buses:\s*\S+/.test(l) && !/\buses:\s*\S+@[0-9a-f]{40}\b/.test(l)) out.push(`unpinned action: ${l.trim()}`);
  if (!/timeout-minutes:\s*\d+/.test(text)) out.push('no timeout');
  return out;
}

describe('label guard job', () => {
  const yml = readFileSync(FILE, 'utf8');

  it('[NS-07-G11-5] the proposed job runs the base copy of the guard on pull requests and edits', () => {
    expect(problems(yml)).toEqual([]);
  });

  it('[NS-07-G11-5] mutants: each rule goes red when its line is broken', () => {
    const mutants: Array<[string, string]> = [
      ['trigger types lack edited', yml.replace(/(types:.*)edited/, '$1labeled')],
      ['pull_request_target', yml.replace(/^(\s*)pull_request:/m, '$1pull_request_target:')],
      ['permissions are not exactly contents: read', yml.replace(/contents: read/, 'contents: write')],
      ['the guard is not the base worktree copy', yml.replace('$RUNNER_TEMP/base/scripts', 'scripts')],
      ['the job can pass on a guard error', yml.replace(/(label-effect\.mjs.*)$/m, '$1 || true')],
      ['the PR body is not passed through PR_BODY', yml.replace('PR_BODY: ${{ github.event.pull_request.body }}', 'PR_BODY: none')],
      ['unpinned action', yml.replace(/(actions\/checkout)@[0-9a-f]{40}/, '$1@v4')],
    ];
    for (const [expected, mutant] of mutants) expect(problems(mutant).join('|'), expected).toContain(expected);
    // the body inside run text
    expect(problems(yml.replace('run: node "$RUNNER_TEMP', 'run: echo "${{ github.event.pull_request.body }}" && node "$RUNNER_TEMP')).join('|')).toContain('an expression inside run text');
  });
});
